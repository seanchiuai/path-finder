# Career OS – Implementation Roadmap

This document outlines a practical roadmap for evolving the current Next.js/Convex/Python boilerplate into **Career OS**, a personalized career discovery platform. It leverages the existing stack, including Clerk, ElevenLabs, and SpoonOS.

## 1. High-Level Architecture Changes
The existing three-tier architecture (Frontend -> Convex -> Python) is well-suited for this product and should be retained. The primary changes will be in the application logic within each tier.

- **Frontend (React/Next.js)**:
  - **REFACTOR**: The current dashboard (`/tasks`) and bookmark management (`/bookmarks`) will be replaced.
  - **NEW**: A new voice-driven onboarding flow will be the primary entry point for new users.
  - **NEW**: A "Career Hub" will display recommendations and the final action plan.

- **Convex Backend (TypeScript)**:
  - **RETAIN**: Convex will remain the primary data layer and API for the frontend.
  - **REFACTOR**: The schema will be heavily modified. Tables like `todos`, `bookmarks`, `folders`, and `projects` will be replaced with new tables for career profiles, recommendations, and action plans.
  - **NEW**: New queries, mutations, and actions will be created to manage the Career OS data lifecycle. Convex actions will serve as the secure bridge to the Python backend for all AI/ML processing.

- **Python Backend (FastAPI)**:
  - **RETAIN**: The Python service will continue to act as a specialized compute backend for tasks unsuitable for the Convex environment.
  - **EXPAND**: This backend will become the "brain" of the application, hosting the **SpoonOS multi-agent system** for user profile analysis and career matching.
  - **EXPAND**: It will handle the full voice interaction loop by implementing the missing Speech-to-Text (STT) functionality and orchestrating the conversation with the LLM.

- **Communication Flow**:
  1. **Frontend** <-> **Convex**: The frontend will only communicate with Convex via its generated client (`useQuery`, `useMutation`, `useAction`).
  2. **Convex** -> **Python**: Convex actions will make authenticated `fetch` calls to the Python backend for all agent-based analysis, voice processing, and external data fetching.
  3. **Python** -> **External APIs**: The Python backend will be the only component that communicates with third-party services like ElevenLabs, OpenAI/Gemini (via SpoonOS), YouTube, etc.

This architecture keeps the frontend simple, centralizes data and business logic in Convex, and isolates heavy computation and third-party secrets in the Python backend.

## 2. Data Model & Convex Schema Updates
The current schema in `convex/schema.ts` is geared towards a bookmarking app and should be replaced.

**Proposed New Schema (`convex/schema.ts`):**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Stores the core user profile, created on first login.
  userProfiles: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    email: v.string(),
    onboardingComplete: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Stores the detailed, AI-inferred profile of the user.
  careerProfiles: defineTable({
    userId: v.string(),
    rawOnboardingTranscript: v.optional(v.string()),
    resumeText: v.optional(v.string()),
    // Structured data from agents
    skills: v.optional(v.array(v.string())),
    personality: v.optional(v.object({
      openness: v.number(),
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    })),
    passions: v.optional(v.array(v.string())),
    goals: v.optional(v.object({
      incomeTarget: v.optional(v.number()),
      location: v.optional(v.string()),
      workStyle: v.optional(v.union(v.literal("remote"), v.literal("hybrid"), v.literal("onsite"))),
    })),
    values: v.optional(v.array(v.string())),
  }).index("by_userId", ["userId"]),

  // Logs the output of each agent run for history and debugging.
  agentRuns: defineTable({
    userId: v.string(),
    orchestratorRunId: v.string(), // A unique ID for a full multi-agent run
    agentName: v.string(), // e.g., "SkillAgent", "OrchestratorAgent"
    input: v.string(), // JSON string of the input
    output: v.string(), // JSON string of the output
    status: v.union(v.literal("success"), v.literal("failure")),
    durationMs: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orchestratorRunId", ["orchestratorRunId"]),

  // Stores the final recommendations and the user's choices.
  careerChoices: defineTable({
    userId: v.string(),
    agentRunId: v.id("agentRuns"),
    recommendedIndustries: v.array(v.string()),
    selectedIndustry: v.optional(v.string()),
    recommendedRoles: v.array(v.string()),
    selectedRole: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // Stores the personalized action plan for the user.
  actionPlans: defineTable({
    userId: v.string(),
    choiceId: v.id("careerChoices"),
    timeframe: v.string(), // e.g., "3 months", "1 year"
    generatedPlan: v.string(), // The full markdown or structured text of the plan
    phases: v.array(v.object({
        title: v.string(),
        duration: v.string(),
        steps: v.array(v.string()),
    })),
  }).index("by_userId", ["userId"]),
});
```

- **Action Item**: Replace the content of `convex/schema.ts` with the above structure. Delete the now-unused files: `convex/todos.ts`, `convex/bookmarks.ts`, `convex/folders.ts`, and `convex/projects.ts`.

## 3. SpoonOS Agent Graph Design
The multi-agent system is the core of Career OS. It should be implemented in the Python backend.

- **Location**: Create a new directory `python-backend/agents/`. Inside, create files for each agent (e.g., `skill_agent.py`, `personality_agent.py`) and a main `orchestrator.py`.

- **Agent Definitions**:
  - **Skill Agent (`skill_agent.py`)**:
    - **Input**: `{"text": "User's transcript and/or resume"}`
    - **Output**: `{"skills": ["Python", "Data Analysis", "Public Speaking"]}`
  - **Personality Agent (`personality_agent.py`)**:
    - **Input**: `{"text": "User's transcript"}`
    - **Output**: `{"traits": {"openness": 0.8, "conscientiousness": 0.9, ...}}`
  - **Passion, Goal, and Values Agents**: Similar input/output structures.

- **Orchestrator (`orchestrator.py`)**:
  - This is not a single agent but a master function that coordinates calls to the specialized agents.
  - **Flow**:
    1. The main endpoint (`/api/onboarding/start`) will call the orchestrator function.
    2. The orchestrator receives the raw user transcript and resume text.
    3. It calls the `SkillAgent`, `PersonalityAgent`, `PassionAgent`, etc. in parallel, passing the relevant text to each.
    4. It aggregates the structured JSON outputs from all agents.
    5. It calls a final `RecommendationAgent` with the complete structured profile.
    6. This agent first returns a list of matching **industries**.
    7. A separate call (e.g., to `/api/onboarding/select-industry`) will pass the profile and chosen industry back to the `RecommendationAgent` to get a list of **specific roles**.

- **State Management**: The agents themselves will be stateless. The orchestrator will hold state for a single run. All long-term state (user profiles, final recommendations) will be passed back to and stored in Convex.

## 4. ElevenLabs Integration & Voice Onboarding Flow
The existing TTS setup is a great start. We need to implement the other half of the conversation: Speech-to-Text (STT).

1.  **Create Frontend UI**: Create a new file `app/onboarding/page.tsx` with a component `components/features/voice-onboarding.tsx`. This component will:
    - Use a library like `react-media-recorder` or the browser's native `MediaRecorder` API to capture audio.
    - On voice input, it will encode the audio to Base64.
2.  **Implement STT**:
    - The frontend will call a new Convex action `voice.transcribeSpeech`.
    - This action in `convex/voice.ts` will proxy the Base64 audio to the Python backend's `/api/voice/stt` endpoint.
    - In `python-backend/main.py`, fully implement the `/api/voice/stt` endpoint. Use the `openai` package (already in `requirements.txt`) to call the Whisper API.
3.  **Complete the Loop**:
    - The transcribed text from STT is sent to the SpoonOS agent system.
    - The agent's text response is sent back to the frontend.
    - The frontend then calls the existing `voice.textToSpeech` action (in `convex/voice.ts`) to convert the agent's response to audio and play it back.

- **Missing Config**: Ensure `OPENAI_API_KEY` is added to the environment variables for both Convex (for embeddings) and the Python backend (for Whisper and SpoonOS).

## 5. Python Backend – LLM + Multi-Agent Orchestration
Refactor `python-backend/main.py` to be the entry point for the agent system.

- **Proposed Endpoints in `main.py`**:
  - `POST /api/onboarding/start`:
    - Receives `{"transcript": "...", "resume_text": "..."}`.
    - Invokes the `Orchestrator` to run the full agent analysis.
    - Returns `{ "agentRunId": "...", "careerProfile": {...}, "recommendedIndustries": [...] }`.
  - `POST /api/onboarding/select-industry`:
    - Receives `{"agentRunId": "...", "selectedIndustry": "..."}`.
    - Invokes the `Orchestrator`'s role-matching step.
    - Returns `{ "recommendedRoles": [...] }`.
  - `POST /api/plan/generate`:
    - Receives `{ "careerProfile": {...}, "selectedRole": "..." }`.
    - Invokes a new `ActionPlanAgent`.
    - Fetches external data (or mocks).
    - Returns `{ "actionPlan": { ... } }`.

- **Code Structure**:
  - The agent logic should live in `python-backend/agents/`.
  - `main.py` will import and call these agents. It should primarily handle HTTP requests/responses and Pydantic validation.
- **Data Persistence**: The Python backend **should not** write to Convex directly. It returns structured JSON. The calling Convex action is responsible for taking this JSON and saving it to the appropriate tables (`careerProfiles`, `actionPlans`, etc.). This maintains a clean and secure architecture.

## 6. Frontend UX Flows and Screens
The current UI is component-based and can be adapted.

- **New Pages & Components**:
  - **Onboarding Page (`app/onboarding/page.tsx`)**: Create this new route. It will house the `VoiceOnboarding` component.
  - **Dashboard (`/dashboard`)**:
    - **Rename** `app/tasks` to `app/dashboard`.
    - **Replace** `components/TodoDashboard.tsx` with a new `components/features/MyPlanDashboard.tsx` that displays the user's `actionPlan` from Convex.
  - **Recommendations Page (`app/recommendations/page.tsx`)**: A new page to display recommended industries and roles from `careerChoices`.
  - **Career Detail Page (`app/career/[id]/page.tsx`)**: A new dynamic route that displays the fetched "day in the life" videos, salary data, job listings, and the final action plan for a selected career.

- **Refactor/Reuse**:
  - **`AppSidebar` (`components/app-sidebar.tsx`)**: Update the navigation links to point to `/dashboard` and `/recommendations` instead of `/tasks`.
  - **`shadcn/ui` components**: The existing UI components in `components/ui/` are perfect for building the new screens.

## 7. External Data Integrations
For a hackathon, mocking is key.

- **YouTube**: In the Python `ActionPlanAgent`, instead of calling the API, `return` a hardcoded list of relevant video URLs.
- **Salary/Growth Data**: Create a mock file `python-backend/data/salary.json` and have the agent read from it based on the career role.
- **Job/Internship Search**: Create a mock file `python-backend/data/jobs.json`.
- **Networking Map**: Create a new `collegeNetworks` table in `convex/schema.ts` and seed it with 1-2 examples. The `ActionPlanAgent` can query this via a new Convex query.

**Recommendation**: Mock all of these for the initial build to focus on the core AI and voice flow. Real integrations can be plugged in later.

## 8. Phase-by-Phase Implementation Plan

- **Phase 0 – Clean Up & Baseline**
  - [ ] Delete or archive unused components and routes related to bookmarks and the old todo dashboard (`app/bookmarks`, `app/tasks`, `components/TodoDashboard.tsx`, `components/data-table.tsx`).
  - [ ] Delete unused Convex files (`convex/bookmarks.ts`, `convex/todos.ts`, etc.).
  - [ ] Update `AppSidebar` navigation.
  - [ ] Ensure Clerk login flows to a simple, empty `/dashboard` page.

- **Phase 1 – Data Model & Text-Based Onboarding**
  - [ ] Implement the new schema in `convex/schema.ts` and push with `npx convex dev`.
  - [ ] Create a new page at `/onboarding` with a simple multi-step form (using `Textarea`) that asks the onboarding questions.
  - [ ] On submit, save the raw answers to a new `careerProfiles` table in Convex.

- **Phase 2 – Multi-Agent Career Inference**
  - [ ] In `python-backend/agents/`, create the `SkillAgent`, `PersonalityAgent`, etc. as simple functions that call an LLM via SpoonOS.
  - [ ] Create the `Orchestrator` in `python-backend/agents/orchestrator.py`.
  - [ ] Implement the `/api/onboarding/start` endpoint in `python-backend/main.py`.
  - [ ] Create a Convex action that calls this endpoint, using the data from Phase 1.
  - [ ] Store the agent outputs in the `careerProfiles` and `careerChoices` tables.
  - [ ] Build the `/recommendations` page on the frontend to display the results.

- **Phase 3 – Voice + ElevenLabs Integration**
  - [ ] Implement the `/api/voice/stt` endpoint in the Python backend using the Whisper API.
  - [ ] Replace the text form at `/onboarding` with the `VoiceOnboarding` component.
  - [ ] Wire the full voice loop: Frontend (capture audio) -> Convex (proxy) -> Python (STT) -> Python (Agent) -> Convex (save) -> Frontend (TTS).

- **Phase 4 – Career Detail & Action Plan**
  - [ ] Implement the `/api/plan/generate` endpoint in the Python backend.
  - [ ] Create the `ActionPlanAgent` that uses mocked data for jobs, videos, and salary.
  - [ ] Build the dynamic career detail page at `/career/[id]`.
  - [ ] Build the `MyPlanDashboard` to display the final plan stored in Convex.

- **Phase 5 – Polish & Demo Experience**
  - [ ] Ensure a smooth, end-to-end user flow from signup to action plan.
  - [ ] Add loading indicators and better error handling.
  - [ ] Seed the database with one complete, high-quality example user profile and plan for a reliable demo.

## 9. Risks, Tradeoffs, and Suggested Simplifications for Hackathon

- **Risks**:
  - **Multi-Agent Complexity**: Orchestrating multiple agents can be complex and slow.
  - **Voice Latency**: A full record -> STT -> LLM -> TTS -> play loop can feel slow.
  - **Prompt Engineering**: Getting high-quality, structured output from the agents will require significant prompt tuning.

- **Simplifications for Speed**:
  - **Single Super-Agent**: Instead of a multi-agent system, start with a single, powerful agent with a very detailed system prompt that asks it to *act* like a specialist for each section (skills, personality, etc.) and return a single, large JSON object. This drastically reduces complexity.
  - **Request/Response Voice**: Do not attempt real-time streaming. A simple "record your answer, wait for my response" loop is much easier and still very impressive.
  - **Mock All External Data**: This is the most critical simplification. Do not spend any time on integrating live APIs for jobs, videos, or salary. Hardcode realistic-looking data in JSON files.
  - **Focus the Flow**: The "money demo" is the voice onboarding leading to a generated action plan. Focus 90% of the effort on making that flow feel magical. The other pages can be simple displays of the data.
