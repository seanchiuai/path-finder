"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface SemanticSearchProps {
  projectId?: Id<"projects">;
  limit?: number;
}

export function SemanticSearch({ projectId, limit = 10 }: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const generateEmbedding = useAction(api.embeddings.generateEmbedding);
  const searchResults = useQuery(
    embedding
      ? api.search.searchBookmarks
      : "skip",
    embedding
      ? {
          embedding,
          projectId,
          limit,
        }
      : "skip"
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setEmbedding(null);
      return;
    }

    setIsSearching(true);
    try {
      const embeddingVector = await generateEmbedding({ text: query });
      setEmbedding(embeddingVector);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setEmbedding(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search bookmarks semantically..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            "Search"
          )}
        </Button>
        {embedding && (
          <Button type="button" variant="outline" onClick={clearSearch}>
            Clear
          </Button>
        )}
      </form>

      {embedding && (
        <div className="space-y-4">
          {searchResults === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((bookmark) => (
                <Card key={bookmark._id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {bookmark.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="text-xs font-mono truncate">
                      {bookmark.url}
                    </CardDescription>
                  </CardHeader>
                  {bookmark.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bookmark.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
