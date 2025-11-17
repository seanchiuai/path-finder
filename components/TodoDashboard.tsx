"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type Tab = "all" | "pending" | "completed";

// Helper to format dates with user's locale
const formatDate = (date: number) => {
  const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  return new Date(date).toLocaleDateString(userLocale, {
    month: "short",
    day: "numeric"
  });
};

export default function TodoDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleComplete = useMutation(api.todos.toggleComplete);
  const removeTodo = useMutation(api.todos.remove);
  const updateTodo = useMutation(api.todos.update);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    await createTodo({
      title: newTodoTitle.trim(),
      description: newTodoDescription.trim() || undefined,
    });

    setNewTodoTitle("");
    setNewTodoDescription("");
  };

  const handleStartEdit = (todo: { _id: Id<"todos">; title: string; description?: string }) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    await updateTodo({
      id: editingId,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });

    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const filteredTodos = todos?.filter((todo) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return todo.status === "pending";
    if (activeTab === "completed") return todo.status === "completed";
    return true;
  });

  const pendingCount = todos?.filter((t) => t.status === "pending").length || 0;
  const completedCount = todos?.filter((t) => t.status === "completed").length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-baseline gap-4 mb-3">
          <h1 className="text-5xl font-bold tracking-tight">Tasks</h1>
          <div className="px-3 py-1 rounded-md border border-border bg-card">
            <span className="text-sm font-medium text-muted-foreground">
              {todos?.length || 0}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-base">Clear mind, clear goals</p>
      </div>

      {/* New Task Form */}
      <div className="mb-10 card-minimal rounded-lg p-6 animate-scale-in stagger-1">
        <form onSubmit={handleCreateTodo} className="space-y-3">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-0 py-2 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60 font-medium focus:placeholder:text-muted-foreground/40 transition-colors"
          />
          {newTodoTitle && (
            <div className="space-y-3 animate-fade-in">
              <textarea
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                placeholder="Add details..."
                className="w-full px-0 py-2 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 resize-none focus:placeholder:text-muted-foreground/40 transition-colors"
                rows={2}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTodoTitle("");
                    setNewTodoDescription("");
                  }}
                  className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border animate-fade-in stagger-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === "all"
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 ${
            activeTab === "pending"
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-primary/15 text-primary rounded-md font-medium">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 ${
            activeTab === "completed"
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Completed
          {completedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-accent/15 text-accent rounded-md font-medium">
              {completedCount}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {!filteredTodos ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading tasks...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-muted/30 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-foreground font-medium mb-2">All clear</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "completed"
                ? "No completed tasks yet"
                : activeTab === "pending"
                ? "No pending tasks"
                : "Ready to add your first task?"}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo, index) => (
            <div
              key={todo._id}
              className="group card-minimal rounded-lg p-5 hover:border-primary/40 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {editingId === todo._id ? (
                <div className="space-y-3">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-border outline-none font-medium focus:border-primary transition-colors"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add details..."
                    className="w-full px-0 py-2 bg-transparent border-b border-border outline-none text-sm resize-none focus:border-primary transition-colors"
                    rows={2}
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => toggleComplete({ id: todo._id })}
                    aria-label={`Toggle completion for ${todo.title || 'todo'}`}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 transition-all duration-200 ${
                      todo.status === "completed"
                        ? "bg-primary border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {todo.status === "completed" && (
                      <svg
                        className="w-full h-full text-primary-foreground p-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-base font-medium leading-snug ${
                        todo.status === "completed"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p
                        className={`text-sm mt-1.5 leading-relaxed ${
                          todo.status === "completed"
                            ? "line-through text-muted-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{formatDate(todo.createdAt)}</span>
                      {todo.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-accent">Completed {formatDate(todo.completedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeTodo({ id: todo._id })}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}