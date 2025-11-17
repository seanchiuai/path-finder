"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [memoryType, setMemoryType] = useState<"preference" | "context">("preference");

  const memories = useQuery(api.memory.getUserMemories);
  const saveMemory = useMutation(api.memory.saveMemory);
  const deleteMemory = useMutation(api.memory.deleteMemory);

  const handleSave = async () => {
    if (newKey.trim() && newValue.trim()) {
      try {
        await saveMemory({
          key: newKey.trim(),
          value: newValue.trim(),
          memoryType,
        });
        setNewKey("");
        setNewValue("");
        toast.success("Memory saved successfully");
      } catch (error) {
        console.error("Failed to save memory:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to save memory", {
          description: errorMessage,
        });
      }
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await deleteMemory({ memoryId });
      toast.success("Memory deleted");
    } catch (error) {
      console.error("Failed to delete memory:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to delete memory", {
        description: errorMessage,
      });
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close overlay"
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
      />

      {/* Panel */}
      <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-2xl rounded-lg bg-background shadow-lg md:inset-x-auto md:right-4 md:w-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Memory Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Add your preferences and context to help the AI personalize responses.
          </p>

          {/* Add new memory */}
          <div className="mb-6 space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Add Memory</h3>
            <div className="space-y-2">
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value as "preference" | "context")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="preference">Preference</option>
                <option value="context">Context</option>
              </select>
              <input
                type="text"
                placeholder="Key (e.g., favorite_language)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Value (e.g., TypeScript)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!newKey.trim() || !newValue.trim()}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground",
                  "hover:bg-primary/90",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <Plus className="h-4 w-4" />
                Add Memory
              </button>
            </div>
          </div>

          {/* Existing memories */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Saved Memories</h3>
            {!memories || memories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memories saved yet.</p>
            ) : (
              <div className="space-y-2">
                {memories.map((memory) => (
                  <div
                    key={memory._id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {memory.memoryType}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{memory.key}</p>
                      <p className="text-sm text-muted-foreground">{memory.value}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(memory._id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
