# Changelog

## [Unreleased] - 2025-01-22

### Project Transition - PathFinder (Career OS)

**Project Overview:**
- Transitioned from bookmark management template to PathFinder (Career OS)
- AI-powered career discovery platform with voice onboarding and multi-agent analysis
- PRD.json added with complete product requirements

**New Agents:**
- `agent-error-fixer`: Systematically fixes code review issues from docs/errors/
- `agent-status-reporter`: Analyzes project areas and reports status
- `agent-shadcn`: shadcn/ui + Tailwind CSS implementation

**Removed Agents:**
- `agent-microlink`, `agent-openai`, `agent-unfurl` (old bookmark-related agents)

**New Commands:**
- `/execute-plan [plan.md]`: Execute implementation plans with todo tracking
- `/identify-cause`: Deep root cause analysis before fixing issues
- `/double-check`: Review generated work from multiple perspectives
- `/update-docs`: Update docs/ using parallel agents
- `/init [PRD.json]`: Initialize new project from PRD

**Documentation:**
- Added `/docs/reports` for status reports (Eleven Labs voice agent status)
- Added `/docs/human-only-DONOTMODIFY` for human-only instructions
- Updated CLAUDE.md with project overview, agents, commands, recent updates

### Documentation Update - Comprehensive Analysis (2025-01-22)

**Agent Analysis Completed:**
- Components: 49 files (23 shadcn/ui, 13 features, 11 layout) - all working except 1 linting error
- Routes: 6 pages - 4 working, 1 incomplete, 1 dev-only
- Convex: 8 tables, 50+ functions - 1 incomplete RAG implementation
- Config: Tailwind 4 CSS-first, Next.js 15 + React 19, TypeScript strict

**Docs Updated:**
- `component-patterns.md`: Added organization structure, icon libraries, status tracking, accessibility patterns
- `frontend-architecture.md`: Route status table, auth patterns, known issues
- `convex-patterns.md`: Current schema/functions, vector search patterns, race condition handling
- `styling-guide.md`: Tailwind 4 config, "Warm Minimalism" design system, 23 shadcn/ui components
- `api-routes-guide.md`: Documented no API routes (Convex-first backend)

**Critical Issues:**
- ⚠️ **Build Blocker**: `folder-tree.tsx:13` - Unused `FolderNode` interface prevents production builds
- 🚧 **Incomplete Feature**: `chat.ts:140-146` - RAG bookmark search TODO not implemented
- 🚧 **Missing UI**: `/bookmarks/page.tsx` - Only placeholders, needs bookmark list/cards
- 🗑️ **Cleanup Needed**: `myFunctions.ts`, `numbers` table, `/tasks/data.json`
- ⚠️ **Security**: `/font-test` dev page has no auth protection

**Key Changes:**
- Enhanced error analysis emphasizing root cause identification
- CRITICAL error labeling for system design/database structure issues
- Plan execution workflow with status tracking

## [Unreleased] - 2025-11-22

### Fixed - Python Backend Dependencies

**Requirements Update:**
- `requirements.txt`: Updated elevenlabs from 1.14.1 (nonexistent) to 2.24.0 (latest)
- Successfully installed all dependencies in venv

### Added - Direct Voice Chat Implementation

**New Files:**
- `app/voice-demo-direct/page.tsx`: Direct voice demo route
- `components/features/voice-chat-direct.tsx`: Direct voice chat component (188 lines)
- `PROJECT_STATE.md`: Project state documentation
- `nextSteps.md`: Next steps documentation (250 lines)

**Updates:**
- `python-backend/main.py`: +30 lines for enhanced voice functionality
- `components/features/voice-chat.tsx`: Minor update

### Added - Python Backend Integration (Hybrid Architecture)

**Python Microservice (FastAPI):**
- `python-backend/main.py`: FastAPI server for ElevenLabs + Spoon OS integrations
- `python-backend/requirements.txt`: Python dependencies (fastapi, elevenlabs, uvicorn)
- `python-backend/README.md`: Setup and deployment guide

**Convex Proxy Actions:**
- `convex/voice.ts`: Text-to-speech, get voices, speech-to-text proxy actions
- `convex/spoonos.ts`: Spoon OS processing + backend health check

**Frontend Components:**
- `components/features/voice-chat.tsx`: Voice chat UI with ElevenLabs integration
- `app/voice-demo/page.tsx`: Demo page for testing voice features

**API Endpoints:**
- `/api/voice/tts`: Text-to-speech with ElevenLabs (base64 response)
- `/api/voice/tts-stream`: Streaming TTS for lower latency
- `/api/voice/voices`: Get available ElevenLabs voices
- `/api/voice/stt`: Speech-to-text placeholder (Whisper integration ready)
- `/api/spoonos/process`: Spoon OS processing endpoint
- `/health`: Backend health check

**Documentation:**
- `docs/python-backend-integration.md`: Complete hybrid architecture guide
- `.env.example`: Environment variable template with Python backend config

**Environment Variables:**
- Frontend: `NEXT_PUBLIC_PYTHON_API_URL` (Python backend URL)
- Convex: `PYTHON_API_URL` (for server-side Python calls)
- Python: `ELEVENLABS_API_KEY`, `SPOONOS_API_KEY`, `ALLOWED_ORIGINS`

**Key Features:**
- Hybrid architecture: Convex (database/realtime) + Python (ML/AI)
- ElevenLabs voice generation with configurable settings
- Backend health monitoring from frontend
- CORS-enabled for secure cross-origin requests
- Production-ready with deployment guides (Fly.io, Railway, AWS Lambda)

**Architecture Benefits:**
- Keep Convex strengths: realtime, type safety, vector search, auth
- Use Python for: ElevenLabs, Spoon OS, heavy ML models
- No frontend rewrite needed - proxy through Convex actions
- Type-safe end-to-end with auto-generated Convex types

## [Unreleased] - 2025-11-17

### Added - Tech Stack Agents

**New Agents:**
- `agent-openai.md`: OpenAI embeddings (text-embedding-3-small) + chat completions (gpt-4o-mini) with cost optimization, error handling, retry logic
- `agent-shadcn.md`: shadcn/ui + Tailwind CSS 4 patterns, component usage, responsive design, dark mode, accessibility
- `agent-unfurl.md`: Unfurl.js metadata extraction (OG, Twitter Cards, oEmbed), image storage, fallback strategy
- `agent-microlink.md`: Microlink API for complex sites (Instagram, Twitter), smart fallback, quota management
- `agent-vercel.md`: Next.js deployment, environment variables, preview/prod workflows, analytics, monitoring

**Removed:**
- `agent-ui.md`: Replaced by more comprehensive `agent-shadcn.md`

**Each agent includes:**
- Installation steps and configuration
- Complete code examples with TypeScript
- Best practices and patterns
- Error handling strategies
- Testing checklists
- Resource links

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
