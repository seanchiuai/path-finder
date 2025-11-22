# Project Overview
This project is a web application template built on a modern stack, designed for rapid development. It features a Next.js frontend, a Convex database and serverless backend, and Clerk for user authentication. It also includes a separate Python backend service designed to handle more intensive or specialized tasks, with existing stubs for AI and machine learning integrations like ElevenLabs for text-to-speech and SpoonOS for AI agent workflows.

The current maturity level is a **partially wired application**. Core features like user authentication, a hierarchical project/folder/bookmark management system, and a basic task dashboard are in place. The AI chat, voice chat, and semantic search features have complete UIs and backend database support, but the core AI/ML logic is either a placeholder or relies on stubbed-out backend services.

Key technologies include:
- **Frontend**: React 19, Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, dnd-kit (for drag-and-drop).
- **Backend**: Convex (TypeScript).
- **Database**: Convex DB with vector search capabilities.
- **Auth**: Clerk.
- **Auxiliary Backend**: Python with FastAPI.
- **Integrations**: ElevenLabs (TTS implemented, STT stubbed), SpoonOS (stubbed), OpenAI (for embeddings and chat).

# Tech Stack and Architecture
- **Frontend Stack**: The frontend is a Next.js 15 application using the App Router, written in TypeScript. It utilizes React 19 and is styled with Tailwind CSS. The UI is built with a combination of custom components and primitives from `shadcn/ui` (which uses Radix UI). Drag-and-drop functionality for the task dashboard is implemented using `@dnd-kit`. Client-side state and data fetching from Convex are managed via Convex's React hooks (`useQuery`, `useMutation`, `useAction`).

- **Backend Stack(s)**:
  - **TypeScript/Convex**: The primary backend logic is handled by serverless functions (mutations, queries, actions) in the `convex/` directory. This layer communicates directly with the Convex database and serves as the main API for the frontend.
  - **Python**: A secondary backend service in `python-backend/` built with FastAPI. It is designed to offload specific tasks: AI/ML model inference (ElevenLabs, SpoonOS) and other operations better suited for the Python ecosystem. It is called exclusively by Convex actions, never directly by the frontend.

- **Auth Provider**: Authentication is managed by Clerk. The root layout (`app/layout.tsx`) wraps the application in `<ClerkProvider>`, handling user sessions and UI. The Convex backend validates Clerk-issued JWTs via configuration in `convex/auth.config.ts`. The Next.js `middleware.ts` protects specific server routes.

- **Database Layer (Convex)**: The schema in `convex/schema.ts` defines tables for:
  - `todos`: A simple to-do list with status tracking.
  - `projects`, `folders`, `bookmarks`: A hierarchical data model. `projects` are the top-level containers. `folders` can be nested within projects and other folders. `bookmarks` belong to folders and include a vector `embedding` field.
  - `chatMessages`, `userMemory`: Tables to support an AI chat feature, storing message history and user preferences/context.
  - **Indexes**: Multiple database indexes are defined (e.g., `by_user`, `by_project_parent`) to optimize common query patterns. The `bookmarks` table has a vector search index (`by_embedding`) on the `embedding` field, enabling semantic search.

- **External Services**:
  - **OpenAI**: Used for generating text embeddings (`text-embedding-3-small`) in `convex/embeddings.ts` and for powering the AI chat in `convex/chat.ts`.
  - **ElevenLabs**: The Python backend has a functional text-to-speech (TTS) endpoint (`/api/voice/tts`) that calls the ElevenLabs API. The Speech-to-Text (STT) endpoint is a non-functional stub.
  - **SpoonOS**: The `spoon-ai-sdk` is a dependency in the Python backend, but the relevant endpoints (`/api/spoon-ai/*`) are placeholders with `TODO` comments, indicating the logic is not implemented.

# Repository Structure
- `app/`: Contains all Next.js App Router pages and layouts.
  - `app/layout.tsx`: The root layout, setting up global providers (`ClerkProvider`, `ConvexClientProvider`).
  - `app/page.tsx`: The main landing page with sign-in/sign-up buttons.
  - `app/tasks/`: The main dashboard page, displaying the `TodoDashboard` component.
  - `app/bookmarks/`: The layout and page for the bookmark management feature, including the `FolderTree`.
  - `app/voice-demo/`, `app/search-demo/`: Pages demonstrating the voice chat and semantic search features.
- `components/`: Reusable React components.
  - `components/ui/`: Core UI primitives from `shadcn/ui` (e.g., `Button`, `Card`, `Dialog`).
  - `components/features/`: Higher-level components for specific features.
    - `chat/`: Components for the AI chat sidebar, including `ChatHeader`, `ChatInput`, and `ChatMessage`.
    - `voice-chat.tsx`: The complete UI for the text-to-speech demo.
    - `semantic-search.tsx`: The UI for performing vector-based searches.
    - `folder-tree.tsx`, `project-switcher.tsx`, `new-folder-dialog.tsx`: Components that form the bookmark organization system.
  - `convex/`: All Convex backend code.
  - `convex/schema.ts`: Defines all database tables and indexes.
  - `convex/http.js`: (Not present, but would be for HTTP actions).
  - `convex/init.ts`: Contains the `initializeUserDefaults` mutation to set up a new user's default project and folder.
  - `convex/bookmarks.ts`, `folders.ts`, `projects.ts`: Contain the CRUD (Create, Read, Update, Delete) logic for the core data models.
  - `convex/embeddings.ts`: Contains the `generateBookmarkEmbedding` action that calls the OpenAI API.
  - `convex/chat.ts`: Contains the `getChatResponse` action that calls the OpenAI API for chat completions.
  - `convex/voice.ts`, `spoonos.ts`: These files contain actions that are simple, authenticated proxies to the Python backend. They construct a request and `fetch` the corresponding endpoint on the FastAPI server.
- `python-backend/`: The separate Python/FastAPI service.
  - `python-backend/main.py`: Defines all Python API endpoints for TTS, STT (stub), and SpoonOS (stub).
  - `python-backend/requirements.txt`: Lists Python dependencies like `fastapi`, `elevenlabs`, and `spoon-ai-sdk`.

# Frontend Details
- **Entry Point**: `app/layout.tsx` is the root entry point, setting up the global context. `app/page.tsx` is the initial view for unauthenticated users.
- **Routing**: The app uses the Next.js App Router. The main authenticated view is `/tasks`, which displays a `TodoDashboard`. The `/bookmarks` route contains the UI for managing projects, folders, and bookmarks.
- **Major UI Components & Features**:
  - **Task Management**: The `TodoDashboard` component (`components/TodoDashboard.tsx`) provides a full UI for creating, editing, deleting, and filtering to-do items.
  - **Bookmark/Project Organization**: A full-featured UI for managing a hierarchy of projects and folders.
    - `ProjectSwitcher`: A dropdown to switch between different user projects.
    - `FolderTree`: A collapsible tree view of folders within a project, supporting nested folders.
    - `NewProjectDialog`, `NewFolderDialog`, `RenameFolderDialog`: Modal dialogs for creating and managing projects and folders.
  - **Voice Chat**: The `VoiceChat` component (`components/features/voice-chat.tsx`) provides a UI to input text, select a voice, and play back the generated audio. It calls the `textToSpeech` Convex action.
  - **Semantic Search**: The `SemanticSearch` component (`components/features/semantic-search.tsx`) provides a search input that, on submission, calls the `generateEmbedding` action and then uses the resulting vector to perform a search with the `searchBookmarks` query.
  - **AI Chat**: A full chat interface is implemented in `components/features/chat/`, including a sidebar (`ChatSidebar`), message display (`ChatMessage`), and input (`ChatInput`). It calls the `getChatResponse` Convex action.
- **Clerk Integration**: The `<ClerkProvider>` in `app/layout.tsx` handles the entire auth lifecycle. The `useAuth` hook is used in `components/ConvexClientProvider.tsx` to pass authenticated state to Convex.

# Backend (TypeScript / Convex) Details
  - `projects.ts`, `folders.ts`, `bookmarks.ts`: These files contain the core business logic for the application's data hierarchy. They include functions like `createProject`, `listFoldersInProject`, `createBookmark`, and `deleteFolder` (which recursively deletes children). They include validation for things like folder depth and circular dependencies.
  - `init.ts`: The `initializeUserDefaults` mutation is a critical onboarding step that creates a default "Main" project and "Uncategorized" folder for a new user, ensuring a ready-to-use state.
  - `embeddings.ts`: The `generateEmbedding` action takes text, calls the OpenAI API to get a vector, and returns it. The `generateBookmarkEmbedding` action orchestrates this process for a specific bookmark and then calls a mutation to save the embedding to the database. It includes retry logic for network errors.
  - `chat.ts`: The `getChatResponse` action constructs a system prompt including user preferences from the `userMemory` table and sends the conversation history to the OpenAI API to get a chat completion.
  - `memory.ts`: Provides mutations to `saveMemory` and `deleteMemory`, allowing the AI to persist user preferences.
  - `search.ts`: The `searchBookmarks` query performs a vector search against the `bookmarks` table using a provided embedding and user/project filters.
  - `voice.ts`, `spoonos.ts`: These files contain actions that are simple, authenticated proxies to the Python backend. They construct a request and `fetch` the corresponding endpoint on the FastAPI server.

# Backend (Python) Details
- **Structure**: A single-file FastAPI application in `python-backend/main.py`.
- **Web Framework**: FastAPI, with `uvicorn` as the server.
- **Defined Endpoints**:
  - `/health`: Reports the service status and checks for the presence of API keys for ElevenLabs and various SpoonOS-related LLM providers.
  - `/api/voice/tts`: **Implemented**. Takes text and voice settings, calls the ElevenLabs API, and returns the audio as a base64 string.
  - `/api/voice/tts-stream`: **Implemented**. A streaming version of the TTS endpoint.
  - `/api/voice/voices`: **Implemented**. Fetches and returns available voices from ElevenLabs.
  - `/api/voice/stt`: **Stubbed**. This endpoint is a placeholder and returns a hardcoded message indicating it's not implemented.
  - `/api/spoon-ai/execute`: **Stubbed**. This endpoint checks for the Spoon AI SDK and then uses the `LLMManager` to send a prompt to a configured LLM provider. It is a basic implementation without any complex agent logic.
  - `/api/spoon-ai/toolkit`: **Stubbed**. This endpoint is a placeholder with a `TODO` comment, indicating no toolkit logic is implemented.
  - `/api/ml/analyze`: **Placeholder**. A non-functional endpoint meant to demonstrate where custom ML models could be integrated.
- **Wiring**: The Python backend is called exclusively by Convex actions, which add authentication and act as a secure gateway. The `PYTHON_API_URL` environment variable in Convex points to the Python service's address.

# Auth and User Model
- **Clerk Setup**: Clerk's `<ClerkProvider>` manages the frontend auth state. The Convex backend uses the Clerk issuer URL from `CLERK_JWT_ISSUER_DOMAIN` to configure its auth provider in `convex/auth.config.ts`, allowing it to validate tokens.
- **User Data in Convex**: All user-specific data in Convex tables (`projects`, `bookmarks`, etc.) is tied to the user's Clerk ID via a `userId` field, which is populated from `ctx.auth.getUserIdentity().subject`.
- **Identity Passing**: The Clerk JWT is automatically sent with every request from the frontend to Convex. Convex functions use `ctx.auth.getUserIdentity()` to securely access the user's ID and other properties. The Python backend is implicitly trusted as it's only called from these authenticated Convex actions.

# Integrations and Stubs
- **ElevenLabs**:
  - **Implemented**: Text-to-Speech (TTS) generation and voice listing are fully functional via the Python backend (`/api/voice/tts`, `/api/voice/voices`).
  - **Stubbed**: Speech-to-Text (STT) is not implemented. The `/api/voice/stt` endpoint is a placeholder.
- **SpoonOS**:
  - **Implemented**: The `spoon-ai-sdk` is a dependency, and the `LLMManager` is initialized in `python-backend/main.py`.
  - **Stubbed**: The `/api/spoon-ai/execute` endpoint only performs a basic chat completion. It does not use any advanced agentic workflows or toolkits. The `/api/spoon-ai/toolkit` endpoint is an empty placeholder.
- **OpenAI**:
  - **Implemented**: Used directly from Convex actions for generating embeddings (`convex/embeddings.ts`) and for chat completions (`convex/chat.ts`). Requires the `OPENAI_API_KEY` to be set in the Convex environment.

# Current Flows / Features
- **User Onboarding**: A new user signs up, which triggers the `initializeUserDefaults` mutation on their first authenticated action, creating a default project and folder.
- **Task Management**: Users can create, update, delete, and view tasks on the `/tasks` dashboard. State is managed via Convex queries and mutations.
- **Bookmark & Folder Management**: Users can create, rename, and delete projects and nested folders through dialogs and context menus in the UI at `/bookmarks`. This is powered by the mutations in `convex/projects.ts` and `convex/folders.ts`.
- **Text-to-Speech**: In the `/voice-demo` page, a user can type text, select a voice, and click "Generate Speech". This triggers the `textToSpeech` Convex action, which calls the `/api/voice/tts` endpoint on the Python backend, which in turn calls the ElevenLabs API and returns the audio data to the frontend for playback.
- **Semantic Search**: In the `/search-demo` page, a user types a query and clicks "Search". This triggers the `generateEmbedding` Convex action (calling OpenAI), and the resulting vector is used in a `useQuery` call to `api.search.searchBookmarks`, which performs a vector similarity search in the Convex database.

# Known TODOs and Technical Debt
- **Unimplemented Integrations**: The core logic for SpoonOS agents/toolkits and Speech-to-Text is missing from the Python backend, marked by `TODO` comments.
- **Unused Components**: The `components/data-table.tsx` file contains a complex, feature-rich table component with drag-and-drop, sorting, and pagination that does not appear to be currently used in any of the application's pages.
- **Hardcoded Values**: The default `voice_id` in `convex/voice.ts` is hardcoded to `"21m00Tcm4TlvDq8ikWAM"`.
- **Configuration**: The application relies heavily on environment variables (`.env` for Python, dashboard settings for Convex) that must be correctly configured for full functionality.
- **Error Handling**: While some error handling exists (e.g., for failed API calls), it could be made more robust, especially around the interaction between Convex and the Python backend.
- **Missing Features**: The UI contains placeholders for features like "Past Performance" and "Key Personnel" in the `data-table.tsx` component that are not implemented.

# Assumptions and Uncertainties
- It is assumed that the developer is expected to provide API keys for various services (Clerk, Convex, ElevenLabs, LLM providers) in environment variables.
- The functionality of the "SpoonOS" SDK is inferred from comments and surrounding code. It appears to be a framework for creating and managing AI agents that can use different LLM backends and tools.
- The `.claude/` directory appears to be for meta-development with an AI assistant and is not part of the runtime application code.
- The `components/data-table.tsx` component is complex and well-built but appears to be unused. It might be a remnant of a previous feature or intended for future use.
