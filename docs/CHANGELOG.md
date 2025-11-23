# Changelog

## [Video URL Field Fix] - 2025-11-23

### Fixed - ArgumentValidationError on Career Plan Generation
**Issue:** Front-end error "Object is missing the required field `url`" when generating career plans. Python backend returned video objects with videoId, title, channel but missing url field required by Convex schema.

**Changes:**
- **utils/youtube_search.py:53-59**: Added url field construction from videoId: `https://www.youtube.com/watch?v={videoId}`
- Video objects now include all required fields for Convex validator

**Flow:** YouTube API search → Returns videos with url → upsertCareerCompassPlan validates successfully → Plans generate without errors.

## [Default Project Auto-Init Fix] - 2025-11-23

### Fixed - "Default project not found" Error
**Issue:** Error when clicking "Generate Action Plans" because defaultProject was null.

**Changes:**
- Added auto-initialization using initializeUserDefaults mutation (app/recommendations/page.tsx:57,351-375)
- Creates "Main" project with isDefault=true when missing
- Button shows "Initializing..." during setup
- Changed error throw → friendly toast message

**Flow:** Page load → Checks defaultProject → If null → Auto-creates "Main" project → User can generate plans.

## [Saved Careers Display Fix] - 2025-11-23

### Fixed - Saved Careers Page Shows Selected Careers
**Issues:** Wrong redirect, field mismatches (title vs careerName), matchScore format (expected 0-1 got 0-100), missing careerId, no generating status.

**Changes:**
- **Schema:** Added careerId, isGenerating fields + by_careerId index (convex/schema.ts:96,101,106)
- **Mutations:** Updated createSavedCareer, added updateGeneratingStatus (convex/savedCareers.ts:93-215)
- **Redirect:** /dashboard → /saved-careers (app/recommendations/page.tsx:206)
- **Display:** Fixed career.title → careerName, matchScore format, added generating indicator (app/saved-careers/page.tsx:58-89)

**Flow:** Select → Generate → Redirect to /saved-careers → Shows selected careers with names, scores, and "Generating..." status.

## [Select Button Fix] - 2025-11-23

### Fixed - Career Compass Selection Flow
**Issue:** Select button was saving to database immediately instead of temporarily selecting careers for action plan generation.

**Changes:**
- **app/recommendations/page.tsx:627-633,701-707**: Changed onClick from handleSaveCareer → handleToggleCareerSelection
- Button shows "Selected ✓" (primary variant) when career is in selection
- **Removed:** handleSaveCareer function, savingCareer state (no longer needed)
- **Added:** Folder system save to handleGenerateActionPlans (saves selected careers when generating plans)

**Flow:** Click "Select" → Temporary selection → Counter updates "X/3" → "Generate Action Plans" enabled → Click generates plans + saves to folder + redirects to dashboard.

## [Dynamic Career Generation] - 2025-11-23

### Changed - LLM Generates Careers Dynamically
**Major architectural change:** Removed hard-coded career database, LLM now generates personalized careers.

**orchestrator_agent_v2.py:**
- Switched from ToolCallAgent → BaseAgent (no tool dependencies)
- Updated prompts to instruct LLM to generate careers from scratch
- recommend() now calls LLM directly via chat_async
- System prompt emphasizes creative, personalized career generation

**Deleted:**
- `career_library.py`: No longer using CAREER_LIBRARY constant (8 hard-coded careers)
- `career_search_tool.py`: Tool no longer needed

**Benefits:** More personalized recommendations tailored to unique user profiles vs limited preset options.

## [Schema Validation Fix] - 2025-11-23

### Fixed - Career Recommendations Validation Error
**careerRecommendations.ts:49-59**: Updated schema validator to accept all fields returned by SpoonOS AI:
- Added: `careerId`, `summary`, `medianSalary`, `growthOutlook`, `estimatedTime`
- Fixed ArgumentValidationError: "Object contains extra field careerId"
- Schema now matches full AI output structure

## [E2E Testing Ready] - 2025-11-23

### Fixed - TypeScript Errors in Convex Functions
**Resolved schema compatibility issues and started all services:**

**actionPlans.ts Fixes:**
- `createActionPlan:78-87`: Transform legacy phase format (title, duration, steps) to Career Compass format (phaseId, name, order, status)
- Added careerId extraction from recommendation.selectedRecommendation or first recommendation
- Added empty tasks array for legacy action plans
- Maintains backwards compatibility with old API while supporting new schema

**careerRecommendations.ts Fixes:**
- `abandonRecommendations:151-160`: Changed from patching userProfiles to careerProfiles
- Fixed: aiAnalysisResults and rawOnboardingTranscript fields are in careerProfiles table, not userProfiles

**All Services Running:**
- ✅ **Next.js**: http://localhost:3000 (Turbopack, middleware compiled)
- ✅ **Convex**: Dev server connected, functions ready
- ✅ **Python Backend**: http://localhost:8001 (Career Compass pipeline with Gemini 2.0-flash)

**Ready for Testing:**
- Voice onboarding → Career Compass analysis → Recommendations
- Career selection (max 3) → Action plan generation
- Dashboard with XP/levels/streaks
- Career detail with phases, tasks, YouTube videos
- Task completion with XP updates

## [Backend Testing] - 2025-11-23

### Fixed - Python Backend Import Errors
**Resolved import issues and successfully started Python backend with Career Compass:**

**Import Fixes:**
- `agents_v2/pipeline.py:9`: Changed `from app.utils.gemini_chatbot` → `from utils.gemini_chatbot`
- `agents_v2/plan_detail_agent.py:9-10`: Changed `from app.utils` → `from utils` for gemini_chatbot and youtube_search
- `utils/__init__.py:2,8`: Fixed function name `calculate_xp_from_level` → `calculate_xp_for_level`
- `utils/__init__.py:3,10`: Fixed function name `search_youtube_videos` → `search_career_videos`

**Dependency Installation:**
- Installed missing Career Compass dependencies: `google-generativeai`, `youtube-search-python`
- Installed SpoonOS dependencies: `anthropic`, `tenacity`, `termcolor`, `tiktoken`, `colorama`, `nest-asyncio`, `beautifulsoup4`, `lxml`
- Installed toolkit dependencies: `pinecone`, `web3`, `tweepy`, `solana` (for spoon-toolkits)

**Backend Status:**
- ✅ Python backend starts successfully on port 8001
- ✅ Career Compass pipeline loaded with Gemini 2.0-flash LLM
- ✅ All 7 specialized agents initialized (skill, personality, passion, goal_lifestyle, values, orchestrator V1/V2, plan_detail)
- ✅ Environment toggle working: USE_CAREER_COMPASS=true activates Career Compass pipeline
- ✅ Fallback strategy operational: Career Compass → SpoonOS → Local agents

## [Career Detail UI] - 2025-11-23

### Added - Career Detail Page with Phases & Tasks
**Created comprehensive career detail page with gamified task system:**

**Components:**
- `components/career/PhaseCard.tsx`: Phase display with locked/unlocked/in-progress/completed states, progress bar showing task completion
- `components/career/TaskItem.tsx`: Task checkbox with track icons (learning/projects/networking/simulator), XP badges, completion toggle

**Career Detail Page (`app/career/[id]/page.tsx`):**
- Career header: Shows name, industry, fit score, completion %, level with badges for streak and weekly tasks
- XP progress bar integrated in header
- Phase navigation: Grid of 4 phase cards, click to view phase tasks
- Task list: Organized by 4 tracks (Learning, Projects, Networking, Simulator) with tab navigation
- Task completion: Checkboxes update XP via updateTaskStatus → updateTaskProgress mutations
- Phase unlocking: Backend automatically unlocks next phase at 70% completion
- YouTube videos: Grid of video thumbnails with hover effects, links to external resources
- Real-time updates: Toast notifications on task completion showing XP earned

**Data Flow:**
- Queries: `getActiveSelectedCareers` (career info), `getActionPlanByCareer` (phases/tasks/videos), `getCareerProgress` (XP/level/streak)
- Mutations: `updateTaskStatus` (update task in actionPlans), `updateTaskProgress` (update careerProgress with XP/level calculation)

**UI Features:**
- Phase cards show lock icon for locked phases, play icon for unlocked, checkmark for completed
- Task items have color-coded track badges (blue=learning, purple=projects, green=networking, orange=simulator)
- Completed tasks show green background and strikethrough text
- Video thumbnails use YouTube maxresdefault images with overlay play button

## [Dashboard UI] - 2025-11-23

### Added - Career Compass Dashboard with Gamification
**Created dashboard page displaying up to 3 selected careers with XP tracking:**

**Components:**
- `components/career/XPProgressBar.tsx`: Animated XP progress bar with level badges, shows current XP / required XP for next level
- `components/GameifiedCareerDashboard.tsx`: Complete rewrite to use Career Compass data model (replaced old single-career dashboard)

**Dashboard Features:**
- Dashboard stats cards: Total XP earned, longest streak, tasks completed this week, active careers count
- Career cards display: career name, industry, fit score, completion %, XP progress bar, streak, weekly tasks
- "View Details" button navigates to `/career/[careerId]` for individual career detail pages
- Empty state with call-to-action when no careers selected
- "Add More Career Paths" card when user has < 3 careers selected
- Uses Convex queries: `getActiveSelectedCareers`, `getAllProgress`, `getDashboardSummary`

**UI Patterns:**
- Glassmorphism cards with backdrop blur and gradient overlays
- Animated hover effects and scale transitions
- Responsive grid layouts (2 cols on mobile, 3-4 on desktop)
- Color-coded stat cards with icons (yellow=XP, orange=streak, green=tasks, purple=careers)

## [Backend Integration] - 2025-11-23

### Added - Career Compass Pipeline Integration
**Integrated Career Compass's advanced recommendation system with gamification:**

**Backend Integration:**
- Copied Career Compass agents to `python-backend/agents_v2/`: pipeline, skill_agent, personality_agent, passion_agent, goal_lifestyle_agent, values_agent, orchestrator (V1 & V2), plan_detail_agent, career_library, career_search_tool
- Copied utilities: `plan_generator.py` (gamification logic), `youtube_search.py` (video resources), `gemini_chatbot.py` (Gemini LLM wrapper)
- Updated `python-backend/main.py`: USE_CAREER_COMPASS env toggle, Career Compass pipeline in /api/onboarding/start, new endpoints for selected-careers/dashboard/careers/tasks
- Backup strategy: Career Compass (default) → SpoonOS → Local agents
- New Python dependencies: youtube-search-python, google-generativeai

**Convex Schema Enhancements:**
- Enhanced `careerRecommendations`: Added careerId, medianSalary, growthOutlook, estimatedTime, summary fields
- Created `selectedCareers` table: Max 3 selected careers with status tracking (active/completed/abandoned)
- Enhanced `actionPlans`: Added phases (phaseId, name, order, status), tasks (taskId, title, track, phase, xp, status), videos (videoId, title, url)
- Created `careerProgress` table: Gamification tracking (xp, level, completionPercent, streak, tasksCompletedThisWeek, xpToNextLevel)

**Convex Functions:**
- `convex/selectedCareers.ts`: getSelectedCareers, selectCareers, updateCareerStatus, removeSelectedCareer
- `convex/careerProgress.ts`: getAllProgress, getCareerProgress, getDashboardSummary, initializeProgress, updateTaskProgress, resetWeeklyTasks
- `convex/actionPlans.ts`: getActionPlanByCareer, upsertCareerCompassPlan, updateTaskStatus with phase unlocking (70% threshold)

**Architecture Changes:**
- Voice onboarding (OpenAI Realtime) → Career Compass pipeline → Convex storage
- Python backend returns data structures, frontend saves to Convex
- Frontend queries Convex for recommendations, dashboard, progress
- Retained voice agent feature, replaced recommendation sub-agents with Career Compass

## [Merged] - 2025-11-22

### Merged PR #2: Multi-agent System
- **Career Discovery UI**: Dashboard, recommendations, career details, my plan, onboarding, saved careers, interactive salary visualization
- **Voice Flows**: Voice recorder, voice onboarding, direct/proxied TTS/STT with backend health checks
- **AI Multi-Agent System**: Onboarding analysis, career recommendations, agent-run logging, action plan generation using SpoonOS
- **Backend Expansion**: New schema tables (careerProfiles, careerRecommendations, actionPlans, agentRuns, resources, salaryDataPoints, savedCareers)
- **Python Agents**: 7 specialized agents (skills, personality, passions, goals, values, recommendation, orchestrator)
- **Documentation**: Python backend integration guide, demo guide, project state reports
- **Stats**: 9,108 additions, 943 deletions

## [Unreleased] - 2025-01-22

### Added - Abandon Recommendations Feature
**Allow users to clear recommendations and restart:**
- `convex/careerRecommendations.ts:131-164`: `abandonRecommendations` mutation deletes all user recommendations and clears AI analysis/transcript from profile
- `app/recommendations/page.tsx:267-276`: Destructive abandon button in header with trash icon, confirmation dialog, loading state
- Redirects to voice-realtime onboarding after abandoning for fresh start

**Individual career removal:**
- `convex/careerRecommendations.ts:169-198`: `removeRecommendation` mutation filters out specific career from recommendations array
- `convex/careerProfiles.ts:142-177`: `removeRecommendationFromProfile` mutation removes career from profile recommendations
- `app/recommendations/page.tsx:348-356,406-414`: X button in top-right corner of each career card, hover turns destructive color
- Supports removal from both AI analysis and Convex recommendation sources

### Enhanced - Dashboard Visual Design
**Magical animated dashboard with glassmorphism:**
- `components/AnimatedBackground.tsx`: Canvas-based animated background with floating gradient orbs and particle system using theme colors
- **Glassmorphism**: All cards now use backdrop-blur-xl with semi-transparent backgrounds (bg-card/70, bg-card/80)
- **Hover Effects**: Scale transforms (hover:scale-105), glow effects with colored shadows, gradient overlays on hover
- **Animations**: Enhanced fadeIn/scaleIn animations with staggered delays, animated progress bars with blur glow
- **Visual Hierarchy**: Gradient text headings, larger typography, improved spacing (max-w-7xl container)
- **Micro-interactions**: Icon scale on hover, rotating icons, pulsing status indicators, smooth color transitions
- **Responsive Design**: Improved mobile layout with grid adjustments (grid-cols-2 lg:grid-cols-4)
- **Empty State**: Enhanced no-career-selected state with glassmorphism card and animated background
- **Stats Cards**: Glassmorphic stat cards with individual hover states and gradient overlays

### Fixed - Transcription Model Consistency
**Voice-realtime transcription model alignment:**
- Fixed inconsistency between API route (`whisper-1`) and session hook (`gpt-4o-mini-transcribe`)
- Both now use `whisper-1` for consistent language detection
- Reduces English misdetection issues caused by model mismatch

### Added - Language Preference Specification
**Voice-realtime language selection with ISO-639-1 codes:**
- `components/realtime/LanguageSelector.tsx`: Dropdown with 21 supported languages (en, es, fr, de, it, pt, nl, pl, ru, zh, ja, ko, ar, hi, tr, vi, th, sv, da, no, fi)
- Language preference persisted in localStorage (`voiceLanguagePreference`)
- Language passed to OpenAI session creation for input audio transcription accuracy
- Language config applied to realtime session for output language
- UI integrated in voice-realtime header, disabled during active sessions
- **Flow**: Select language → Connect → Language guides transcription & output

### Added - Voice-Realtime to Career Analysis Flow
**Complete onboarding flow from voice session to career recommendations:**
- `components/features/analysis-loading.tsx`: Animated loading UI with 6-stage fake progress (Processing → Skills → Personality → Passions → Values → Career Matching)
- Voice session disconnect automatically saves transcript to sessionStorage and redirects to `/recommendations?analyzing=true`
- Recommendations page triggers Python backend multi-agent analysis on mount when analyzing parameter present
- Analysis results saved to Convex (careerProfiles, careerRecommendations tables)
- Error handling with immediate retry button for failed analyses
- Transcript cleared from sessionStorage after successful analysis
- **Flow**: Voice session → Disconnect → Save transcript → Redirect → Show loading → Run agents → Display recommendations

### Changed
- **Recommendations Page**: "Complete Onboarding" button now navigates to `/voice-realtime` instead of `/onboarding`
- **Voice Realtime Disconnect**: Now stores transcript in sessionStorage and redirects to recommendations page for analysis

### Added - OpenAI Realtime API Integration

**Route:**
- `/voice-realtime`: Protected route for LISA Career Advisor voice conversations
- Full WebRTC-based voice interaction with OpenAI Realtime API

**Components & UI:**
- `components/realtime/Transcript.tsx`: Real-time conversation transcript with copy/download
- `components/realtime/Events.tsx`: Debug event logs (client/server)
- `components/realtime/BottomToolbar.tsx`: Connection controls, PTT, audio settings, codec selector
- `components/realtime/GuardrailChip.tsx`: Content moderation status display

**Context & State Management:**
- `contexts/realtime/TranscriptContext.tsx`: Conversation state + Convex persistence
- `contexts/realtime/EventContext.tsx`: Event logging for debugging

**Hooks:**
- `hooks/realtime/useRealtimeSession.ts`: WebRTC session management, OpenAI SDK integration
- `hooks/realtime/useHandleSessionHistory.ts`: Process conversation events, update transcript
- `hooks/realtime/useAudioDownload.ts`: Record and download conversation audio (WebM → WAV)

**Agent Configuration:**
- `lib/agentConfigs/lisaCareerAdvisor/`: LISA agent with structured career discovery framework
  - `prompts.ts`: Discovery methodology (6 topics: Goals, Interests, Values, Hard Skills, Soft Skills, Work Style)
  - `tools.ts`: `generateCareerRecommendations` tool (removed - conversations saved directly to Convex)
  - `index.ts`: Agent definition (voice: "sage", tools: [])
- `lib/agentConfigs/guardrails.ts`: Content moderation using OpenAI Responses API

**Utilities:**
- `lib/realtime/audioUtils.ts`: WAV encoding and WebM conversion
- `lib/realtime/codecUtils.ts`: WebRTC codec preferences (Opus/PCMU/PCMA)

**Types:**
- `types/realtime.ts`: Complete type definitions for sessions, events, transcripts, guardrails

**Convex Integration:**
- `convex/realtimeConversations.ts`: Save/retrieve voice conversation transcripts
- Schema: `realtimeConversations` table (userId, conversationId, agentName, fullTranscript, sessionDuration, messagesCount)
- Conversations auto-saved on disconnect with formatted transcript string

**API Routes:**
- `app/api/realtime/session/route.ts`: Create OpenAI ephemeral session tokens
- `app/api/realtime/responses/route.ts`: Proxy for OpenAI Responses API (guardrails)

**Dependencies Added:**
- `@openai/agents@^0.0.5`: OpenAI Agents SDK for Realtime API
- `@radix-ui/react-icons@^1.3.2`: Icons for UI components
- `react-markdown@^9.0.1`: Markdown rendering in transcript
- `uuid@^11.0.5`: Unique conversation IDs
- `@types/uuid@^10.0.0`: TypeScript types for UUID

**Assets:**
- `public/arrow.svg`: Send button icon
- `public/openai-logomark.svg`: OpenAI branding

**Features:**
- Real-time bidirectional voice conversation with LISA Career Advisor
- Push-to-talk mode toggle
- Audio playback controls
- Codec selection (Opus 48kHz, PCMU/PCMA 8kHz for phone quality testing)
- Event log debugging panel
- Audio recording with WAV export
- Content moderation guardrails
- Conversation persistence to Convex database
- Clerk authentication required

**Technical Details:**
- WebRTC for low-latency voice streaming
- OpenAI Realtime API (`gpt-4o-realtime-preview-2025-06-03`)
- Client-side conversation tracking with server-side storage
- Automatic session management and cleanup

### Fixed - Authentication & Deployment

**Auth Pattern Fix:**
- Replaced non-existent `@convex-dev/auth` with Clerk authentication
- Updated `convex/realtimeConversations.ts` to use `ctx.auth.getUserIdentity().subject`
- Updated `convex/planningConversations.ts` to use `ctx.auth.getUserIdentity().subject`
- Matches existing auth pattern used throughout codebase

**Deployment Status:**
- ✅ Dev server running successfully at http://localhost:3000
- ✅ Convex functions deployed and ready
- ✅ All table indexes created:
  - `realtimeConversations.by_user`
  - `realtimeConversations.by_user_created`
  - `realtimeConversations.by_conversation_id`
  - `planningConversations.by_user`
  - `planningConversations.by_user_created`
  - `planningConversations.by_conversation_id`
- ✅ No build errors
- ✅ All dependencies installed

**Next Steps:**
1. Add `OPENAI_API_KEY` to `.env.local`
2. Navigate to `/voice-realtime`
3. Test LISA voice conversation
4. Verify conversation saves to Convex

**Integration Summary:**
- Total files created/modified: 35+
- Commits: 4 (integration, completion, planning storage, auth fix)
- Documentation: 3 files updated (CHANGELOG, frontend-architecture, openai-realtime-integration)
- Status: ✅ Complete and ready for testing

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
