## Goals
- Deliver a working Career OS built on your existing Next.js + Convex + Python stack, matching the functionality outlined in your roadmap and shaping nextSteps2 into executable milestones.
- Center user flows on onboarding → recommendations → career detail → saved careers → action plan.
- Keep AI-heavy computation in Python; keep authenticated data and UI logic in Convex/Next.

## Current State Summary
- App shell and auth: `app/layout.tsx:15-58` wraps `ClerkProvider` and `ConvexClientProvider`.
- Entry routing: `app/page.tsx:23-40` redirects signed-in users to `/dashboard`; unauthenticated users see sign-in.
- Dashboard: `app/dashboard/page.tsx:5-10` renders `GameifiedCareerDashboard`.
- Onboarding (text + voice recorder UI): `app/onboarding/page.tsx:3-9` and `components/features/onboarding-form.tsx:16-32,165-291`.
- Recommendations UI: `app/recommendations/page.tsx:14-33,105-233` reads Convex recommendations and AI analysis summary.
- Saved careers UI: `app/saved-careers/page.tsx:12-31,51-100` lists saved careers.
- Career details tabs (static demo): `app/career/[id]/page.tsx:224-471` renders Overview/Learn/Network with SalaryBellCurve.
- Convex schema already expanded for Career OS: `convex/schema.ts:4-223` (profiles, recommendations, actionPlans, savedCareers with embedding index, resources, salaryDataPoints, chat, memory).
- Convex modules present: `convex/careerProfiles.ts:7-34,39-52,57-137`, `convex/careerRecommendations.ts:7-20,46-82,87-126`, `convex/savedCareers.ts:93-123,128-162,167-181,186-203,208-219`, `convex/embeddings.ts:34-74,147-180,186-239`, `convex/search.ts:18-60,65-84`, `convex/voice.ts:9-52,85-118`, `convex/spoonos.ts:9-40,45-77`, `convex/init.ts:8-31,33-79`, `convex/auth.config.ts:10-21`.
- Python backend endpoints: `python-backend/main.py:50-73` onboarding analysis, `74-104` action plan generation, `105-142` career insights, `189-205` TTS (mock), `206-218` voices, `219-246` STT (mock). Agents: `python-backend/career_agents.py:7-25,26-46,47-64,65-83,84-101,102-143,144-215,216-259`.
- Frontend → Python client: `src/lib/api.ts:1-2,97-113` calls `/api/analyze-onboarding`, `/api/generate-action-plan`, `/api/career-insights`.

## Gap Analysis
- Voice onboarding is partial: UI has recorder; STT and LLM “next question” loop is mocked (`convex/voice.ts:85-118`, `python-backend/main.py:219-246`).
- Recommendations exist in two shapes (Convex and AI-analysis) and need normalization for a single source of truth.
- Career details use static demo data; should fetch real/mock JSON via Python.
- Action plans generated in Python are not persisted in Convex (`actionPlans` schema exists but no Convex functions or UI wires).
- Saved careers can be created and searched by embedding but UX lacks bookmark-from-recommendations and project/folder linkage.

## Work Packages

### 1) Onboarding and Profile
- Implement robust text-first onboarding (already in `onboarding-form.tsx`) and keep voice as an enhancement.
- Normalize AI analysis output into `careerProfiles.aiAnalysisResults` and `careerRecommendations`.
- Convex mutations already exist; ensure they are called with normalized data after Python analysis.

### 2) Recommendations Flow
- Use one source of truth: read recommendations from `careerRecommendations` and hide legacy AI-analysis rendering when Convex data exists.
- Add “Choose This Career” updates `selectedRecommendation` via `selectRecommendation` (`convex/careerRecommendations.ts:87-126`) and redirects to dashboard.
- Add “Save” button on each recommendation to insert a `savedCareers` row (`convex/savedCareers.ts:93-123`).

### 3) Career Details
- Fetch detailed career info via Python `GET /api/data/career-details` (add endpoint parallel to `python-backend/main.py:105-142`).
- Render tabs:
  - Overview: match explanation from `careerRecommendations` and profile match from `careerProfiles.aiAnalysisResults`.
  - Experiment: simple simulator remains client-side for hackathon demo (present in `app/career/[id]/page.tsx:304-417`).
  - Learn/Network: back by `resources` and `collegeNetworks` from Convex or Python mocks.
- Use `SalaryBellCurve` with real mocked percentile data.

### 4) Action Plans
- Python: wire `POST /api/plan/generate` (already at `python-backend/main.py:74-104`) to accept role/timeframe and return structured phases.
- Convex: add mutations to persist plans in `actionPlans` and queries to list them for `/my-plan`.
- UI: show selected plan and progress on `/my-plan` (current route exists at `app/my-plan/page.tsx`).

### 5) Voice Loop (non-streaming)
- Frontend: `components/features/voice-onboarding.tsx` new component driving Q&A state.
- Convex: add `onboarding.getNextStep` action to compute next question given transcript/history; for hackathon, proxy Python endpoint that returns next prompt.
- Python: implement `/api/onboarding/llm-response` to generate next question using Spoon agents or a single prompt; reuse STT (`python-backend/main.py:219-246`) and TTS (`189-205`).

### 6) Data and Search
- Generate embeddings for saved careers and enable vector search via `convex/embeddings.ts:147-180` and `convex/search.ts:18-60,65-84`.
- Provide a small UI search demo over saved careers using `generateSavedCareerEmbedding` and `searchSavedCareers`.

### 7) Auth and Initialization
- Ensure Clerk JWT issuer is configured for Convex (`convex/auth.config.ts:17-19`).
- Call `initializeUserDefaults` after first login (`convex/init.ts:8-31,33-79`) to create “Main” project and “Uncategorized” folder.

### 8) API Contracts and Types
- Unify recommendation shape: `{industry, role, matchScore, matchExplanation}` everywhere.
- Add TypeScript types in `src/lib/api.ts` for plan and insights objects returned by Python; keep errors robust via `fetchWithErrorHandling` (`src/lib/api.ts:74-95`).

## Detailed Implementation Steps

### Backend (Python)
- Add endpoints:
  - `POST /api/onboarding/start`: returns `{ careerProfile, recommendations, orchestratorSessionId }` using `AgentOrchestrator` (similar to `career_agents.py:216-259`).
  - `POST /api/onboarding/llm-response`: returns next question given conversation history.
  - `GET /api/data/career-details`: aggregates mocked `salaryDataPoints` and `resources` per role.
- Replace mock TTS/STT with thin wrappers that can be mocked in dev; leave interfaces stable.

### Backend (Convex)
- Ensure CRUD exists for `actionPlans`, `resources`, `salaryDataPoints`, `agentRuns` (files already present; wire queries/mutations similarly to `savedCareers.ts`).
- Add actions:
  - `onboarding.startAgentAnalysis`: POST to Python `/api/onboarding/start`, store `aiAnalysisResults` and `careerRecommendations`.
  - `onboarding.getNextStep`: orchestrate voice flow.

### Frontend (App + Components)
- `/onboarding`: keep `OnboardingForm` for text; add `VoiceOnboarding` component for voice Q&A.
- `/recommendations`: normalize display to Convex recommendations only when present; add “Save” button writing to `savedCareers`.
- `/career/[id]`: fetch details via `careerAPI.getCareerInsights` or new endpoint; populate tabs; link “Start Simulation” to existing client simulator.
- `/saved-careers`: show cards and link to career detail, using `savedCareers.getSavedCareers`.
- `/my-plan`: add UI to select timeframe, call Python plan generation, persist to Convex, and render phases.

## Configuration and Secrets
- `OPENAI_API_KEY` required for embeddings (`convex/embeddings.ts:45-48`) and chat (`convex/chat.ts:70-77`).
- `NEXT_PUBLIC_PYTHON_API_URL` for frontend Python calls (`src/lib/api.ts:1-2`).
- `PYTHON_API_URL` for Convex actions proxy (`convex/voice.ts:4`, `convex/spoonos.ts:4`).
- `CLERK_JWT_ISSUER_DOMAIN` for Convex auth provider (`convex/auth.config.ts:17-19`).

## Verification
- Manual flows:
  - New user logs in → defaults created (`convex/init.ts`); navigate to `/onboarding`.
  - Submit onboarding (text) → Convex profile updated; recommendations created; `/dashboard` shows selected career state.
  - View `/recommendations` → choose and save career; `/saved-careers` reflects saved list.
  - Navigate to `/career/[id]` → tabs render details and salary curve.
  - Generate plan from dashboard → plan appears in `/my-plan`.
- Programmatic checks:
  - Unit test Convex queries/mutations where feasible; smoke-test Python endpoints return expected JSON shapes.
  - Embedding generation and search return results for saved careers.

## Risks and Simplifications
- Keep voice loop non-streaming for demo stability; upgrade later.
- Use mocked salary/resources in Python; replace with live sources post-demo.
- Start with single-prompt analysis, then split to multi-agent orchestrator.

## Acceptance Criteria
- Authenticated user can complete onboarding (text/voice), see recommendations, choose a career, view a populated career detail page, save careers, search saved careers, and generate a multi-phase action plan that persists and renders in `/my-plan`.
- All calls are routed Frontend → Convex → Python; no unauthenticated direct calls to Python.
