"use client";

import { SemanticSearch } from "@/components/features/semantic-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";

export default function SearchDemoPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please sign in to use semantic search</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Semantic Search Demo</h1>
        <p className="text-muted-foreground mt-2">
          Search your bookmarks using natural language and AI-powered semantic understanding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Vector embeddings powered by OpenAI&apos;s text-embedding-3-small model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Embedding Generation</h3>
            <p className="text-sm text-muted-foreground">
              When you create a bookmark, we automatically generate a 1536-dimensional vector
              embedding from the title, description, and URL using OpenAI&apos;s API.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Semantic Search</h3>
            <p className="text-sm text-muted-foreground">
              When you search, we generate an embedding for your query and use Convex&apos;s built-in
              vector search to find the most semantically similar bookmarks.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Relevance Ranking</h3>
            <p className="text-sm text-muted-foreground">
              Results are automatically ranked by semantic similarity, so you&apos;ll find relevant
              bookmarks even if they don&apos;t contain your exact search terms.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Your Bookmarks</CardTitle>
          <CardDescription>
            Try searching for concepts, topics, or keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SemanticSearch limit={20} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                &ldquo;React tutorials&rdquo;
              </span>
              <span className="text-muted-foreground">
                Finds React-related bookmarks
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                &ldquo;machine learning&rdquo;
              </span>
              <span className="text-muted-foreground">
                Finds ML and AI content
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                &ldquo;JavaScript frameworks&rdquo;
              </span>
              <span className="text-muted-foreground">
                Finds React, Vue, Angular, etc.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
