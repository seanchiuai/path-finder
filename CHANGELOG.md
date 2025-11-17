# Changelog

## [Unreleased] - 2025-11-17

### Added - AI Chat System with RAG

**Backend:**
- `convex/chat.ts`: AI chat orchestration with OpenAI integration
- `convex/chatMessages.ts`: Chat message CRUD operations
- `convex/memory.ts`: User memory storage for context persistence
- `convex/schema.ts`: Added chatMessages and userMemory tables

**Frontend:**
- `components/features/chat/chat-sidebar.tsx`: Main chat interface
- `components/features/chat/chat-input.tsx`: Message input with auto-resize
- `components/features/chat/chat-message.tsx`: Message display component
- `components/features/chat/chat-header.tsx`: Chat header UI
- `components/features/chat/bookmark-reference-card.tsx`: Bookmark reference cards in chat
- `components/features/chat/memory-panel.tsx`: User memory management panel

**Key Features:**
- Bookmark-aware AI responses via RAG
- User memory for personalized context
- Real-time chat with streaming support
- Project context awareness

### Added - Vector Embeddings & Semantic Search

**Backend:**
- `convex/embeddings.ts`: OpenAI integration for 1536-dim embeddings (text-embedding-3-small)
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
- `package.json`: Added `openai` and `tiktoken` dependencies

**Documentation:**
- `VECTOR_SEARCH_SETUP.md`: Complete setup and usage guide

**Key Features:**
- Async embedding generation (non-blocking bookmark creation)
- Semantic search across bookmarks by userId/projectId/folderId
- Batch embedding generation for existing bookmarks
- Graceful error handling (bookmark saves even if embedding fails)
- Cost-effective (~$0.000002 per bookmark)

### Added - Project & Folder Organization System

**Backend (Convex):**
- `convex/projects.ts`: CRUD operations, default project management, validation
- `convex/folders.ts`: Nested folder operations, circular reference prevention, tree building
- `convex/init.ts`: User initialization mutation
- Updated schema with indexes for efficient queries

**Frontend Components:**
- `ProjectSwitcher`: Dropdown for switching/creating projects
- `FolderTree` + `FolderTreeItem`: Recursive folder tree with expand/collapse
- `NewProjectDialog` + `NewFolderDialog`: Creation dialogs with validation
- `/bookmarks` route with custom sidebar layout
- Added dialog component from shadcn/ui

**Key Features:**
- Full hierarchical bookmark organization
- Projects table with default project support
- Folders table with nested structure (max 5 levels deep)
- Auto-initialization: Default "Main" project + "Uncategorized" folder on first login
- Defense-in-depth: 5-level UI limit, 50-depth circular reference checks, 100-depth breadcrumb safeguard

### Quality & Performance Improvements

- **Type Safety**: Replaced all `any` types with proper Convex types (QueryCtx, MutationCtx, Doc<T>)
- **Cycle Detection**: Added layered guards to prevent infinite loops in folder hierarchy traversal
  - getFolderDepth: Iterative with visited set (primary 5-level enforcement)
  - wouldCreateCircularReference: 50-depth technical limit + cycle detection (10x safety buffer)
  - getFolderPath: 100-depth safeguard for breadcrumb traversal
  - getSubtreeDepth: Recursive depth parameter
- **Performance**: Parallelized delete operations, added compound indexes
  - `by_user_name` on projects for efficient duplicate checks
  - `by_project_parent` on folders for sibling queries
  - Parallel deletes in deleteProject (bookmarks + folders)
- **TOCTOU Fixes**: Replaced full-table scans with targeted index queries
- **UX**: RenameFolderDialog component with validation
- **Default Project Deletion**: Auto-promotes fallback project instead of blocking

### Important Notes

- **Setup Required**: Run `npx convex dev` to deploy schema and generate types
- **OpenAI API Key**: Must be configured in `.env.local` (dev) and Convex dashboard (prod)
- All operations secured with row-level filtering by userId
- Real-time updates via Convex subscriptions (automatic)
- **Depth Limits**: 5-level user-facing limit with layered safeguards (50/100-depth technical limits)
