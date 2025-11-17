# Changelog

## [Unreleased] - 2025-11-17

### Added - Vector Embeddings & Semantic Search

**Backend:**
- `convex/schema.ts`: Added projects, folders, and bookmarks tables with vector embedding support
- `convex/embeddings.ts`: OpenAI integration for generating 1536-dim embeddings (text-embedding-3-small)
- `convex/bookmarks.ts`: Full CRUD operations with embedding support
- `convex/search.ts`: Vector search queries using Convex's built-in vector search
- Retry logic with exponential backoff for OpenAI rate limits (429 errors)

**Frontend:**
- `components/features/semantic-search.tsx`: Semantic search UI component
- `components/features/add-bookmark-example.tsx`: Example bookmark creation with auto-embedding
- `app/search-demo/page.tsx`: Demo page showing semantic search in action

**Configuration:**
- `.env.local`: Added OPENAI_API_KEY placeholder
- `.env.example`: Environment variable template
- `package.json`: Added `openai` SDK dependency

**Documentation:**
- `VECTOR_SEARCH_SETUP.md`: Complete setup and usage guide

**Key Features:**
- Async embedding generation (non-blocking bookmark creation)
- Semantic search across bookmarks by userId/projectId/folderId
- Batch embedding generation for existing bookmarks
- Graceful error handling (bookmark saves even if embedding fails)
- Cost-effective (~$0.000002 per bookmark)

**Requirements:**
- OpenAI API key must be configured in `.env.local` (dev) and Convex dashboard (prod)
- Run `npx convex dev` to deploy schema with vector search index

**Next Steps:**
- Configure OPENAI_API_KEY in Convex dashboard
- Run batch generation for existing bookmarks
- Integrate SemanticSearch component into main UI
