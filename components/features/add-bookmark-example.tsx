"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface AddBookmarkExampleProps {
  folderId: Id<"folders">;
}

/**
 * Example component showing how to create a bookmark with automatic embedding generation
 *
 * Usage:
 * 1. User creates bookmark
 * 2. Bookmark is saved immediately
 * 3. Embedding generation is triggered asynchronously (non-blocking)
 * 4. Embedding is updated when ready
 */
export function AddBookmarkExample({ folderId }: AddBookmarkExampleProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBookmark = useMutation(api.bookmarks.createBookmark);
  const generateBookmarkEmbedding = useAction(api.embeddings.generateBookmarkEmbedding);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || !title.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create bookmark (blocking)
      const bookmarkId = await createBookmark({
        folderId,
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Step 2: Trigger embedding generation (non-blocking)
      // Don't await - let it run in background
      generateBookmarkEmbedding({ bookmarkId }).catch(() => {
        toast.error("Failed to generate embedding. Bookmark saved without embedding.");
        // Bookmark is still saved, just without embedding
        // User can retry later or use batch generation
      });

      // Reset form
      setUrl("");
      setTitle("");
      setDescription("");

      // Show success message
      toast.success("Bookmark created successfully!");
    } catch {
      toast.error("Failed to create bookmark. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Bookmark</CardTitle>
        <CardDescription>
          Create a new bookmark with automatic embedding generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Bookmark title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isSubmitting || !url.trim() || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Bookmark"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold mb-2">How it works:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Bookmark is created immediately in the database</li>
            <li>Embedding generation starts in the background (async)</li>
            <li>Bookmark is searchable once embedding is ready (~1-2 seconds)</li>
            <li>If embedding fails, bookmark is still saved (can retry later)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
