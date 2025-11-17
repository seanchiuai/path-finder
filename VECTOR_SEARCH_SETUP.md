# Vector Embeddings & Semantic Search Setup

This guide explains how to use the vector embeddings and semantic search feature implemented for bookmark search.

## Overview

The system uses OpenAI's `text-embedding-3-small` model to generate 1536-dimensional vector embeddings for bookmarks, enabling semantic search powered by Convex's built-in vector search capabilities.

## Prerequisites

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Convex Account**: Make sure your Convex backend is deployed
3. **Dependencies**: The `openai` package is already installed

## Setup Instructions

### 1. Configure OpenAI API Key

#### For Local Development:

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

#### For Production (Convex):

1. Go to your [Convex dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add a new variable:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-actual-key-here`

### 2. Deploy Convex Schema

The database schema is already configured with:

- `bookmarks` table with `embedding` field (optional array of float64)
- Vector search index `by_embedding` with filter fields for `userId` and `folderId`

Deploy the schema:

```bash
npx convex dev
```

## How It Works

### Embedding Generation

When a bookmark is created:

1. **Bookmark is saved immediately** (non-blocking)
2. **Embedding generation is triggered asynchronously**
3. **Text to embed** combines: `title + description + url`
4. **OpenAI generates** 1536-dimensional vector embedding
5. **Embedding is stored** in the `embedding` field

### Semantic Search

When a user searches:

1. **Query embedding** is generated from search text
2. **Vector search** finds bookmarks with similar embeddings
3. **Results are ranked** by semantic similarity
4. **Filters** can be applied (userId, projectId, folderId)

## Usage Examples

### Creating a Bookmark with Embedding

```tsx
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function BookmarkForm({ folderId }) {
  const createBookmark = useMutation(api.bookmarks.createBookmark);
  const generateBookmarkEmbedding = useAction(api.embeddings.generateBookmarkEmbedding);

  const handleSubmit = async (data) => {
    // Step 1: Create bookmark (blocking)
    const bookmarkId = await createBookmark({
      folderId,
      url: data.url,
      title: data.title,
      description: data.description,
    });

    // Step 2: Generate embedding (non-blocking)
    generateBookmarkEmbedding({ bookmarkId }).catch(console.error);
  };

  // ... rest of component
}
```

### Searching Bookmarks

```tsx
import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const [embedding, setEmbedding] = useState(null);

  const generateEmbedding = useAction(api.embeddings.generateEmbedding);
  const results = useQuery(
    embedding ? api.search.searchBookmarks : "skip",
    embedding ? { embedding, limit: 10 } : "skip"
  );

  const handleSearch = async () => {
    const embeddingVector = await generateEmbedding({ text: query });
    setEmbedding(embeddingVector);
  };

  // Display results...
}
```

### Batch Generating Embeddings

For existing bookmarks without embeddings:

```tsx
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function BatchEmbeddings({ userId }) {
  const batchGenerate = useAction(api.embeddings.batchGenerateEmbeddings);

  const handleBatchGenerate = async () => {
    const count = await batchGenerate({ userId });
    console.log(`Generated ${count} embeddings`);
  };

  return <button onClick={handleBatchGenerate}>Generate All Embeddings</button>;
}
```

## Demo Pages

Two demo pages are included:

1. **`/search-demo`**: Interactive semantic search demo
2. **Example Component**: `AddBookmarkExample` shows bookmark creation flow

## Files Created

### Backend (Convex)

- `convex/embeddings.ts`: OpenAI embedding generation actions
- `convex/bookmarks.ts`: Bookmark CRUD with embedding support
- `convex/search.ts`: Vector search queries
- `convex/schema.ts`: Updated with bookmarks table and vector index

### Frontend (Components)

- `components/features/semantic-search.tsx`: Search UI component
- `components/features/add-bookmark-example.tsx`: Example bookmark form
- `app/search-demo/page.tsx`: Demo page

### Configuration

- `.env.local`: Environment variables (local)
- `.env.example`: Environment variables template

## API Reference

### Actions

#### `api.embeddings.generateEmbedding({ text })`

Generates embedding for arbitrary text.

- **Args**: `{ text: string }`
- **Returns**: `number[]` (1536 dimensions)
- **Example**: Search query embedding

#### `api.embeddings.generateBookmarkEmbedding({ bookmarkId })`

Generates and stores embedding for a bookmark.

- **Args**: `{ bookmarkId: Id<"bookmarks"> }`
- **Returns**: `void`
- **Side Effect**: Updates bookmark with embedding

#### `api.embeddings.batchGenerateEmbeddings({ userId })`

Batch generates embeddings for all bookmarks without embeddings.

- **Args**: `{ userId: string }`
- **Returns**: `number` (count of embeddings generated)

### Queries

#### `api.search.searchBookmarks({ embedding, projectId?, limit? })`

Search bookmarks by embedding vector. Automatically filters by authenticated user.

- **Args**:
  - `embedding: number[]` (1536 dimensions)
  - `projectId?: Id<"projects">` (optional filter)
  - `limit?: number` (default: 10)
- **Returns**: `Bookmark[]` (ranked by similarity)
- **Auth**: Requires authenticated user (userId derived from context)

#### `api.search.searchBookmarksInFolder({ embedding, folderId, limit? })`

Search bookmarks within a specific folder.

- **Args**:
  - `embedding: number[]`
  - `folderId: Id<"folders">`
  - `limit?: number` (default: 10)
- **Returns**: `Bookmark[]`

### Mutations

#### `api.bookmarks.createBookmark({ folderId, url, title, description? })`

Create a new bookmark.

- **Args**:
  - `folderId: Id<"folders">`
  - `url: string`
  - `title: string`
  - `description?: string`
- **Returns**: `Id<"bookmarks">`

#### `api.bookmarks.updateBookmarkEmbedding({ bookmarkId, embedding })`

Update bookmark with embedding vector.

- **Args**:
  - `bookmarkId: Id<"bookmarks">`
  - `embedding: number[]`
- **Returns**: `void`

## Error Handling

### Rate Limits (429)

The system includes exponential backoff retry logic:

- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay
- After 3 retries: Error thrown

### API Key Missing

If `OPENAI_API_KEY` is not set, embedding generation will fail with:

```text
Error: OPENAI_API_KEY environment variable is not set
```

### Graceful Degradation

- **If embedding fails**: Bookmark is still saved
- **Search without embedding**: Won't appear in semantic search results
- **Can retry**: Use `generateBookmarkEmbedding` or batch generation

## Cost Estimation

Using `text-embedding-3-small`:

- **Pricing**: $0.02 per 1M tokens
- **Per bookmark**: ~100 tokens (title + description + URL)
- **Cost per bookmark**: ~$0.000002 (negligible)
- **1,000 bookmarks**: ~$0.002
- **10,000 bookmarks**: ~$0.02

Cost is minimal and not a concern for most use cases.

## Performance Considerations

1. **Async Embedding**: Don't block bookmark creation
2. **Batch Processing**: Process in chunks for large datasets
3. **Caching**: Don't regenerate if embedding exists
4. **Rate Limiting**: Respect OpenAI limits (3000 RPM free tier)
5. **Text Truncation**: Input limited to 8000 characters

## Testing

### Test Embedding Generation

Open Convex dashboard → Functions → Run `generateEmbedding`:

```json
{
  "text": "React tutorial for beginners"
}
```

Verify response is array of 1536 numbers.

### Test Semantic Search

1. Create bookmarks with different content
2. Use `/search-demo` page
3. Try queries like:
   - "JavaScript frameworks" → finds React, Vue, Angular
   - "machine learning" → finds ML/AI content
   - "tutorial" → finds educational content

## Troubleshooting

### Embeddings Not Generating

1. Check `OPENAI_API_KEY` is set in Convex dashboard
2. Check Convex logs for errors
3. Verify OpenAI API key is valid
4. Check OpenAI account has credits

### Search Not Working

1. Verify bookmarks have embeddings (check database)
2. Check search index is deployed
3. Ensure userId matches authenticated user
4. Try batch generation for existing bookmarks

### Slow Embedding Generation

1. OpenAI API latency is typically 1-2 seconds
2. Check network connectivity
3. Monitor OpenAI status page
4. Consider upgrading OpenAI tier for higher rate limits

## Next Steps

1. **Add to production**: Configure `OPENAI_API_KEY` in Convex
2. **Batch existing bookmarks**: Run `batchGenerateEmbeddings`
3. **Integrate search UI**: Add `SemanticSearch` to bookmarks page
4. **Monitor costs**: Track OpenAI usage in dashboard
5. **Optional**: Add metadata fetching (unfurl.js) for richer content

## Future Enhancements

- **Hybrid search**: Combine vector + keyword search
- **Reranking**: Use Cohere/Jina for better ranking
- **Multi-query**: Generate multiple search variations
- **Auto-update**: Regenerate embeddings when bookmark edited
- **Custom embeddings**: Fine-tune model on user's collection
