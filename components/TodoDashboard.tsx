"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type Tab = "all" | "pending" | "completed";

export default function TodoDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

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

  const filteredTodos = todos?.filter((todo) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return todo.status === "pending";
    if (activeTab === "completed") return todo.status === "completed";
    return true;
  });

  const pendingCount = todos?.filter((t) => t.status === "pending").length || 0;
  const completedCount = todos?.filter((t) => t.status === "completed").length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold tracking-tight">My Tasks</h1>
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {todos?.length || 0} total
            </span>
          </div>
        </div>
        <p className="text-muted-foreground">Stay organized, stay productive</p>
      </div>

      {/* New Task Form */}
      <div className="mb-8 glass rounded-2xl p-5 border shadow-lg shadow-primary/5 animate-scale-in stagger-1">
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
                  className="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTodoTitle("");
                    setNewTodoDescription("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-muted/30 rounded-xl w-fit animate-fade-in stagger-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "all"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-primary/20 to-secondary/20 text-primary rounded-full font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            activeTab === "completed"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          Completed
          {completedCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-accent/20 to-secondary/20 text-accent rounded-full font-semibold">
              {completedCount}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {!filteredTodos ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading your tasks...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-foreground font-medium mb-1">All clear!</p>
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
              className="group glass rounded-xl p-5 border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {editingId === todo._id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-border/50 outline-none font-medium focus:border-primary transition-colors"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add details..."
                    className="w-full px-0 py-2 bg-transparent border-b border-border/50 outline-none text-sm resize-none focus:border-primary transition-colors"
                    rows={2}
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleComplete({ id: todo._id })}
                    className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 transition-all duration-200 ${
                      todo.status === "completed"
                        ? "bg-gradient-to-br from-primary to-primary/90 border-primary shadow-lg shadow-primary/25"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {todo.status === "completed" && (
                      <svg
                        className="w-full h-full text-white p-1"
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
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(todo.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      {todo.completedAt && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary font-medium">
                            ✓ Completed {new Date(todo.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all"
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
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
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