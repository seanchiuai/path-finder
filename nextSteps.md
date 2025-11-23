# Career OS – Implementation Roadmap (v2 - Corrected)

This document outlines a practical roadmap for evolving the current Next.js/Convex/Python boilerplate into **Career OS**, a personalized career discovery platform. It leverages the existing stack, including Clerk, ElevenLabs, and SpoonOS.

## 1. High-Level Architecture Changes
The existing three-tier architecture (Frontend -> Convex -> Python) remains an excellent fit. The core changes are in the application logic and data models, not the infrastructure.

- **Frontend (React/Next.js)**:
  - **REFACTOR**: The UI will be completely repurposed. The "Tasks" dashboard becomes a "My Plan" dashboard, and the bookmarks/folders system is adapted for saving and organizing recommended careers.
  - **NEW**: A new voice-driven onboarding flow at `/onboarding` will be the primary entry point for new users.
  - **NEW**: A "Recommendations" page will display matched careers with percentage scores and bookmarking capabilities.
  - **NEW**: A comprehensive, tabbed "Career Detail" page will provide deep dives into roles, including an interactive salary bell curve, learning resources, and job simulators.

- **Convex Backend (TypeScript)**:
  - **RETAIN**: Convex remains the central data layer and secure API for the frontend.
  - **REPURPOSE & EXPAND**: The `projects`, `folders`, and `bookmarks` tables will be **repurposed** to organize saved careers. New tables for career profiles, learning resources, and detailed salary data will be added.
  - **NEW**: Convex actions will be the secure bridge to the Python backend for all AI/ML processing, including agent orchestration and data fetching.

- **Python Backend (FastAPI)**:
  - **RETAIN**: The Python service remains the specialized compute backend.
  - **EXPAND**: It will host the **SpoonOS multi-agent system** for user profile analysis, career matching, and action plan generation.
  - **EXPAND**: It will manage the full voice conversation loop by implementing Speech-to-Text (STT) and orchestrating the dialogue.

- **Communication Flow**:
  1. **Frontend** <-> **Convex**: The frontend communicates exclusively with Convex.
  2. **Convex** -> **Python**: Convex actions make authenticated `fetch` calls to the Python backend for all AI processing and external data fetching (or mocking).
  3. **Python** -> **External APIs**: The Python backend is the sole component interfacing with third-party services (ElevenLabs, SpoonOS-managed LLMs, YouTube API, etc.).

This architecture cleanly separates concerns: UI on the frontend, data storage/business logic in Convex, and intensive AI computation in Python.

## 2. Data Model & Convex Schema Updates
The schema in `convex/schema.ts` requires significant changes. We will **repurpose** the existing bookmarking system rather than deleting it entirely.

**Proposed New Schema (`convex/schema.ts`):**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // NEW: Stores the core user profile, created on first login.
  userProfiles: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    email: v.string(),
    onboardingComplete: v.boolean(),
  }).index("by_userId", ["userId"]),

  // NEW: Stores the detailed, AI-inferred profile of the user.
  careerProfiles: defineTable({
    userId: v.string(),
    rawOnboardingTranscript: v.optional(v.string()),
    resumeText: v.optional(v.string()),
    // Structured data from agents
    skills: v.optional(v.array(v.string())),
    personality: v.optional(v.object({
      openness: v.number(), // Example Big Five trait (0.0-1.0)
      conscientiousness: v.number(),
      extraversion: v.number(),
      agreeableness: v.number(),
      neuroticism: v.number(),
    })),
    passions: v.optional(v.array(v.string())),
    goals: v.optional(v.object({
      incomeTarget: v.optional(v.number()), // e.g., 80000
      location: v.optional(v.string()), // e.g., "Remote", "New York"
      workStyle: v.optional(v.union(v.literal("remote"), v.literal("hybrid"), v.literal("onsite"))),
      riskTolerance: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      schedulePreference: v.optional(v.string()), // e.g., "flexible", "9-5"
    })),
    values: v.optional(v.array(v.string())), // e.g., "Impact", "Stability", "Creativity"
    // Add other relevant fields derived from onboarding questions
  }).index("by_userId", ["userId"]),

  // REPURPOSED: Projects now organize saved careers.
  projects: defineTable({
    userId: v.string(),
    name: v.string(), // e.g., "Dream Careers", "Applying To"
    isDefault: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]), // Keep for uniqueness

  // REPURPOSED: Folders now organize saved careers within projects.
  folders: defineTable({
    projectId: v.id("projects"),
    parentFolderId: v.optional(v.id("folders")), // e.g., "Tech Roles", "Creative Fields"
    name: v.string(),
    userId: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentFolderId"]) // For tree structure
    .index("by_user", ["userId"]) // For direct user access

  // REPURPOSED: Bookmarks now store saved career paths.
  // Renamed from 'bookmarks' to 'savedCareers' for clarity.
  savedCareers: defineTable({
    userId: v.string(),
    folderId: v.id("folders"), // Link to organized folders
    careerName: v.string(), // e.g., "Product Manager"
    industry: v.string(),
    matchScore: v.number(), // Percentage match to user profile
    matchExplanation: v.string(), // How the match was determined
    createdAt: v.number(),
  }).index("by_user_folder", ["userId", "folderId"]),

  // NEW: Stores the results from the Orchestrator agent.
  careerRecommendations: defineTable({
    userId: v.string(),
    agentRunId: v.string(), // Link to a specific agent run
    recommendations: v.array(v.object({
      industry: v.string(),
      role: v.string(),
      matchScore: v.number(),
      matchExplanation: v.string(), // Detailed reasoning for the match
    })),
    selectedRecommendation: v.optional(v.object({ // User's final choice
      industry: v.string(),
      role: v.string(),
    })),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  
  // NEW: Stores the final generated action plan.
  actionPlans: defineTable({
    userId: v.string(),
    recommendationId: v.id("careerRecommendations"), // Link to the specific recommendation
    timeframe: v.string(), // e.g., "3 months", "1 year"
    generatedPlanMarkdown: v.string(), // The full markdown text of the plan
    phases: v.array(v.object({
        title: v.string(),
        duration: v.string(), // e.g., "1 month", "6 weeks"
        steps: v.array(v.string()), // e.g., "Learn Python", "Build a portfolio project"
    })),
    requiredSkills: v.array(v.string()),
    recommendedProjects: v.array(v.string()), // Names or links to project ideas
    suggestedInternshipsRoles: v.array(v.string()), // Intermediate steps
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // NEW: Logs the inputs and outputs of each SpoonOS agent run for history and debugging.
  agentRuns: defineTable({
    userId: v.string(),
    orchestratorSessionId: v.string(), // A unique ID for a full multi-agent session
    agentName: v.string(), // e.g., "SkillAgent", "OrchestratorAgent"
    input: v.any(), // JSON object of the input
    output: v.any(), // JSON object of the output
    status: v.union(v.literal("success"), v.literal("failure"), v.literal("in_progress")),
    errorMessage: v.optional(v.string()),
    durationMs: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orchestratorSessionId", ["orchestratorSessionId"]),

  // NEW: Powers the interactive salary bell curve.
  salaryDataPoints: defineTable({
    role: v.string(), // e.g., "Software Engineer"
    industry: v.string(), // e.g., "Tech"
    percentile: v.number(), // e.g., 10, 25, 50, 75, 90
    salaryRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    avgYearsExperience: v.number(),
    commonCertifications: v.array(v.string()),
    exampleCompanies: v.array(v.string()),
  }).index("by_role_industry", ["role", "industry"]),

  // NEW: A generic table for all learning/experimentation resources.
  resources: defineTable({
    role: v.string(), // Target career role
    type: v.union(
      v.literal("simulator"), v.literal("local_expert"), v.literal("online_expert"),
      v.literal("article"), v.literal("blog"), v.literal("video"), v.literal("try_on_own")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.string(), // Can be a URL, markdown text, or stringified JSON for simulators
    externalLink: v.optional(v.string()), // Direct link if content is external
    metadata: v.optional(v.object({ // E.g., for experts: name, location, contact
      name: v.optional(v.string()),
      location: v.optional(v.string()),
      contact: v.optional(v.string()),
      availability: v.optional(v.string()),
      intro: v.optional(v.string()),
    })),
    createdAt: v.number(),
  }).index("by_role_type", ["role", "type"]),

  // NEW: For networking map (can be simple config for now)
  collegeNetworks: defineTable({
    collegeName: v.string(),
    alumniNetworkUrl: v.optional(v.string()),
    clubs: v.optional(v.array(v.string())),
    // Could link to specific alumni contacts here if available
  }).index("by_collegeName", ["collegeName"]),

  // Existing table, could be kept for internal project management if needed, or removed.
  // For Career OS, it's not directly part of the core user-facing features.
  todos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    userId: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
```

- **Action Item**: Replace the content of `convex/schema.ts` with the above structure. **Keep** the existing `convex/projects.ts` and `convex/folders.ts` but adapt their logic to manage `savedCareers`. Create new Convex functions (queries/mutations) for `userProfiles`, `careerProfiles`, `savedCareers`, `careerRecommendations`, `actionPlans`, `agentRuns`, `salaryDataPoints`, `resources`, and `collegeNetworks`.

## 3. SpoonOS Agent Graph Design
The multi-agent system is the core of Career OS, now explicitly generating detailed structured data.

- **Location**: `python-backend/agents/`. Create an `orchestrator.py` and files for each specialized agent (e.g., `skill_agent.py`, `personality_agent.py`).
- **Agent Definitions & Flow**:
  1.  **Orchestrator (`orchestrator.py`)** receives the user's transcript and optional resume text from the onboarding flow.
  2.  It calls the **Skill, Personality, Passion, Goal & Lifestyle, and Values Agents** in parallel.
  3.  Each agent takes relevant parts of the input text and returns a structured JSON output (e.g., `{"skills": [...]}` for `SkillAgent`, the detailed Big Five `{"traits": {...}}` for `PersonalityAgent`).
  4.  The orchestrator aggregates these into a complete `careerProfile` JSON object.
  5.  It then calls a `RecommendationAgent` with this comprehensive profile. This agent's prompt will instruct it to:
      - First, identify matching **industries** based on the full profile.
      - Then, for each industry, identify **specific career paths/roles**.
      - For each recommended role, calculate a `matchScore` (0-100) and provide a detailed `matchExplanation` of *why* this role is a good fit, referring to the user's skills, personality, passions, goals, and values.
  6. The `ActionPlanAgent` (`action_plan_agent.py`) will be invoked when the user selects a role and timeframe. Its system prompt will be loaded with the extensive list of strategies you provided (debt, networking, side-door approaches, etc.) and tasked with generating a phased action plan based on the user's profile, chosen career, and desired timeframe.

## 4. ElevenLabs Integration & Voice Onboarding Flow
This flow is critical and builds upon the existing `voice-chat` feature.

1.  **Frontend**: Create a new `components/features/voice-onboarding.tsx`. This will manage the conversational state machine (e.g., asking question 1, waiting for answer, asking question 2...).
    - It will use `MediaRecorder` to capture the user's audio response, encode it to Base64, and send it to a new Convex action: `voice.processUserAudio`.
2.  **Convex**: The `voice.processUserAudio` action (in `convex/voice.ts`) will:
    - Call the Python backend's `/api/voice/stt` endpoint to transcribe the audio.
    - Pass the transcribed text to another Convex action, e.g., `onboarding.getNextStep({ userId: ..., currentQuestion: ..., userResponse: "..." })`. This Convex action will manage the state of the onboarding conversation.
3.  **Python Backend**:
    - The `/api/voice/stt` endpoint in `python-backend/main.py` must be fully implemented using the `openai` package to call the Whisper API (or another STT service).
    - An endpoint like `/api/onboarding/llm-response` will take the user's text and the conversation history, pass it to an LLM (via SpoonOS), and return the LLM's next question or statement.
4.  **The Loop Completes**: The agent's text response is returned to the frontend, which calls the existing `voice.textToSpeech` action to get the audio from ElevenLabs and play it, starting the cycle again.

- **Missing Config**: Ensure `OPENAI_API_KEY` (for Whisper/LLM) is added to the environment variables for both Convex (if using OpenAI embeddings/chat directly) and the Python backend.

## 5. Python Backend – LLM + Multi-Agent Orchestration
Refactor `python-backend/main.py` to be a clean API layer over the agent system and data integrators.

- **Proposed Endpoints**:
  - `POST /api/onboarding/start`: Receives `{"transcript": "...", "resume_text": "..."}`. Invokes the `Orchestrator` to run the full agent analysis. Returns `{ "orchestratorSessionId": "...", "careerProfile": {...}, "recommendedIndustries": [...], "recommendedRoles": [...] }`.
  - `POST /api/plan/generate`: Receives `{"careerProfile": {...}, "selectedRole": "...", "timeframe": "..."}`. Invokes the `ActionPlanAgent` and returns a structured action plan.
  - `GET /api/data/career-details`: Receives `{"role": "...", "industry": "..."}`. Fetches (or gets from mock files) detailed data for the career: salary bell curve data, YouTube videos, job listings, and learning resources. Returns it as a single JSON object.
  - `POST /api/voice/stt`: Fully implements Speech-to-Text using an external API.

## 6. Frontend UX Flows and Screens

- **`/onboarding`**: A new route `app/onboarding/page.tsx` with the `VoiceOnboarding` component (`components/features/voice-onboarding.tsx`). This page will guide the user through the initial voice chat to build their `careerProfile`.
- **`/recommendations`**: A new page `app/recommendations/page.tsx`.
  - Displays career recommendation cards, each showing a `careerName`, `industry`, and `matchScore`.
  - Each card has a bookmark icon (reusing `<IconBookmark>`) in the top right. Clicking it triggers a Convex mutation to save the career to the `savedCareers` table (linked to a user's `projects`/`folders`).
  - Clicking a card navigates to `/career/[id]`.
- **`/saved-careers`**: A new page `app/saved-careers/page.tsx` that displays the user's bookmarked careers, using adapted versions of `ProjectSwitcher`, `FolderTree`, and `FolderTreeItem` to organize saved careers.
- **`/career/[id]`**: A new dynamic route `app/career/[id]/page.tsx`. This will be a complex page with a tabbed layout (`<Tabs>`) to display detailed career information:
  - **Overview Tab**: Shows `matchExplanation`.
    - Includes a new `<SalaryBellCurve>` component (`components/features/salary-bell-curve.tsx`) that visualizes `salaryDataPoints`. Clicking on points reveals `avgYearsExperience`, `commonCertifications`, `exampleCompanies`.
    - Lists how the user's `skills`, `personality`, `passions`, `goals`, and `values` specifically match this career.
  - **Experiment Tab**: Components for `resources` of type `simulator` and `try_on_own`.
  - **Learn Tab**: Components to display `resources` of type `article`, `blog`, and `video`.
  - **Network Tab**: Components to display `resources` of type `local_expert`, `online_expert`, and `collegeNetworks`.
- **`/my-plan`**: (Rename `/dashboard` or create new) Displays the user's `actionPlans`, potentially with progress tracking.

- **Refactor/Reuse**:
  - `AppSidebar` (`components/app-sidebar.tsx`): Update navigation links to point to `/my-plan`, `/recommendations`, and `/saved-careers`.
  - `shadcn/ui` components (`components/ui/`): Excellent for rapid UI development of all new pages.

## 7. External Data Integrations
For a hackathon, **mocking is crucial for speed and reliability**.

- **Salary Data**: Create `python-backend/data/mock_salary_data.json` with detailed `salaryDataPoints` for various roles/industries. The `/api/data/career-details` endpoint will load data from here.
- **Learning/Experimentation Resources**: Create `python-backend/data/mock_resources.json` with entries for articles, videos, mock experts, and simulator scenarios, all linked to career roles. The `/api/data/career-details` endpoint will provide this.
- **YouTube Videos**: Mock by including static YouTube links in `mock_resources.json`.
- **Job/Internship Openings**: Mock by providing a list of fake job descriptions in `mock_resources.json`.
- **College Networking**: Seed the `collegeNetworks` table in Convex with a few example universities and their mock alumni/club data.

## 8. Phase-by-Phase Implementation Plan

- **Phase 0 – Clean Up & Baseline**
  - [ ] Delete Convex files `convex/todos.ts` and `convex/myFunctions.ts`.
  - [ ] **Rename** existing `convex/bookmarks.ts` to `convex/savedCareers.ts`, `convex/projects.ts` to `convex/careerProjects.ts`, `convex/folders.ts` to `convex/careerFolders.ts`. Adapt their functions to manage `savedCareers`.
  - [ ] Update `AppSidebar` navigation to reflect new routes.
  - [ ] Create a basic, empty `/my-plan` page.

- **Phase 1 – Data Model & Text Onboarding**
  - [ ] Implement the full, corrected new schema in `convex/schema.ts` and push with `npx convex dev`.
  - [ ] Create `convex/userProfiles.ts`, `convex/careerProfiles.ts`, `convex/careerRecommendations.ts`, `convex/actionPlans.ts`, `convex/agentRuns.ts`, `convex/salaryDataPoints.ts`, `convex/resources.ts`, `convex/collegeNetworks.ts` (with basic CRUD functions as needed).
  - [ ] Create a *text-only* onboarding form at `/onboarding` that saves responses to `careerProfiles`.

- **Phase 2 – Core Agent Inference & Recommendations Display**
  - [ ] In `python-backend/agents/`, create `skill_agent.py`, `personality_agent.py`, `passion_agent.py`, `goals_agent.py`, `values_agent.py`, `recommendation_agent.py` as Python functions/classes.
  - [ ] Create `python-backend/agents/orchestrator.py` to coordinate these.
  - [ ] Implement the `POST /api/onboarding/start` endpoint in `python-backend/main.py` to call the orchestrator.
  - [ ] Create a Convex action `onboarding.startAgentAnalysis` to call this Python endpoint and save results to `careerProfiles` and `careerRecommendations`.
  - [ ] Build the `/recommendations` page (frontend) to display these results from `careerRecommendations`, including `matchScore` and the bookmark icon.

- **Phase 3 – Voice Integration for Onboarding**
  - [ ] Implement the STT endpoint (`POST /api/voice/stt`) in `python-backend/main.py`.
  - [ ] Create `components/features/voice-onboarding.tsx`.
  - [ ] Replace the text form at `/onboarding` with the voice UI.
  - [ ] Wire the full voice loop (frontend audio capture -> Convex proxy -> Python STT -> Python LLM response -> Convex `onboarding.getNextStep` -> Convex `voice.textToSpeech` -> frontend audio playback).

- **Phase 4 – Detailed Career View (Static) & Action Plan Generation**
  - [ ] Create `python-backend/data/mock_salary_data.json` and `python-backend/data/mock_resources.json`.
  - [ ] Implement the `GET /api/data/career-details` endpoint in `python-backend/main.py` to serve this mock data.
  - [ ] Implement the `ActionPlanAgent` in `python-backend/agents/action_plan_agent.py`.
  - [ ] Implement the `POST /api/plan/generate` endpoint in `python-backend/main.py`.
  - [ ] Build the static layout for the `/career/[id]` page (all tabs) and the `/my-plan` page. Use Convex queries to fetch `careerRecommendations`, `salaryDataPoints`, and `resources` (or the mocked versions).

- **Phase 5 – Interactive Career Details & Polish**
  - [ ] Build the interactive `<SalaryBellCurve>` component for the `/career/[id]` page.
  - [ ] Implement saving/bookmarking of careers from the `/recommendations` page to the `savedCareers` table.
  - [ ] Create the `/saved-careers` page using adapted `ProjectSwitcher` and `FolderTree` components.
  - [ ] Implement basic functionality for "Simulator" and "Try on Your Own" (e.g., simple text-based interaction or status tracking).
  - [ ] Integrate resume upload functionality into the onboarding flow.
  - [ ] UX polish, error handling, and demo script.

## 9. Risks, Tradeoffs, and Suggested Simplifications for Hackathon

- **Risks**:
  - **Complexity of Multi-Agent System**: Building truly intelligent, robust SpoonOS agents and an orchestrator that consistently produces high-quality structured JSON can be challenging and time-consuming.
  - **Real-time Voice UX**: Achieving low-latency, natural voice interaction (STT + LLM + TTS) is difficult and prone to integration issues.
  - **Prompt Engineering**: The quality of AI outputs (profiles, recommendations, action plans) is heavily dependent on very precise and extensive prompt engineering.
  - **Data Volatility**: External API integrations (if used) can be unreliable.

- **Simplifications for Speed & Demo Impact**:
  - **Single LLM Call for Profile**: Instead of separate SpoonOS agents, initially use one large LLM prompt to extract all `careerProfile` details and recommendations in a single structured JSON output. This minimizes Python orchestration complexity.
  - **Request/Response Voice**: Focus on a clear "record, process, respond" voice interaction, rather than true streaming, to simplify frontend audio handling.
  - **Mock *All* External Data**: For the hackathon, **all** external data (YouTube videos, salary, job openings, expert directories) should be represented by static JSON files. This removes external dependencies and ensures a predictable demo.
  - **Basic Simulator**: The "Simulator" can be a simple text-based branching narrative or a prompt-response system powered by an LLM in the Python backend.
  - **Action Plan Scope**: Ensure the `ActionPlanAgent` prioritizes a few key actionable strategies rather than trying to cover every single item from the comprehensive list in the initial version.
  - **Minimal Error Handling**: Focus on happy path scenarios for the demo; robust error handling can be a post-hackathon task.