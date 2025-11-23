# SpoonOS AI Architecture Report
**Path-Finder (Career OS) - Multi-Agent Career Analysis System**

**Date:** 2025-01-23
**Status:** Current Implementation

---

## Executive Summary

Path-Finder uses a **hybrid AI architecture** with two parallel systems:

1. **Career Compass** (Primary) - Uses Gemini 2.0-flash with custom multi-agent pipeline
2. **SpoonOS Agents** (Legacy Fallback) - Uses SpoonOS ReActAgent framework with OpenAI/Anthropic

The system processes voice transcripts and resumes through specialized AI agents to generate personalized career recommendations with action plans.

---

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                       │
│  - Voice onboarding interface (ElevenLabs)                     │
│  - Career recommendations display                              │
│  - Action plan tracking & gamification                         │
└───────────────────┬────────────────────────────────────────────┘
                    │
                    ├─────── HTTP ────────┐
                    ↓                     ↓
         ┌─────────────────────┐  ┌──────────────────────┐
         │  Convex Backend     │  │  Python Backend      │
         │  (TypeScript)       │←─│  (FastAPI)           │
         │                     │  │  Port 8001           │
         │  - Real-time DB     │  └──────────────────────┘
         │  - Auth (Clerk)     │           │
         │  - Vector search    │           │
         │  - Proxy actions    │           ├─ Career Compass Pipeline
         └─────────────────────┘           │  (Gemini 2.0-flash)
                                           │
                                           └─ SpoonOS Agents
                                              (OpenAI/Anthropic)
```

**Key Files:**
- `python-backend/main.py:1-655` - FastAPI server
- `convex/spoonos.ts:1-77` - Convex → Python proxy
- `python-backend/agents_v2/pipeline.py:1-124` - Career Compass
- `python-backend/spoon_career_agents.py:1-941` - SpoonOS legacy

---

## 2. Dual System Architecture: Career Compass vs SpoonOS

### System Selection Logic
**File:** `python-backend/main.py:19-103`

```python
USE_CAREER_COMPASS = os.getenv("USE_CAREER_COMPASS", "true").lower() == "true"

if USE_CAREER_COMPASS:
    career_compass_pipeline = CareerAnalysisPipeline(
        llm_provider="gemini",
        model_name="gemini-2.0-flash"  # Primary model
    )
else:
    orchestrator = CareerAnalysisOrchestrator()  # SpoonOS fallback
```

### Comparison Matrix

| Feature | Career Compass | SpoonOS Agents |
|---------|---------------|----------------|
| **LLM Provider** | Gemini 2.0-flash | OpenAI/Anthropic/Gemini |
| **Agent Framework** | Custom async pipeline | SpoonOS ReActAgent |
| **Execution Pattern** | 5 agents parallel → orchestrator | 7 agents sequential |
| **Recommendation Count** | 20-25 careers | 3-5 careers |
| **Generation Method** | Dynamic LLM generation | Hardcoded logic + LLM |
| **Scoring Algorithm** | Weighted: 35% skills, 25% personality, 20% values, 15% passion, 5% goals | Basic match scoring |
| **State:** | **Active (Primary)** | **Deprecated (Fallback)** |

---

## 3. Career Compass Pipeline (Primary System)

### 3.1 Pipeline Architecture
**File:** `python-backend/agents_v2/pipeline.py:1-124`

**Initialization:**
```python
class CareerAnalysisPipeline:
    def __init__(self, llm_provider="gemini", model_name="gemini-2.5-flash"):
        self.llm = GeminiChatBot(llm_provider, model_name)

        # 5 specialized profile agents
        self.skill_agent = SkillAgent(self.llm)
        self.personality_agent = PersonalityAgent(self.llm)
        self.passion_agent = PassionAgent(self.llm)
        self.goal_lifestyle_agent = GoalLifestyleAgent(self.llm)
        self.values_agent = ValuesAgent(self.llm)

        # Orchestrator for career recommendations
        self.orchestrator_agent = CareerOrchestratorAgent(self.llm)
```

**Execution Flow:**
```python
async def analyze(transcript, resume_text):
    # Step 1: Run 5 agents in parallel (Line 68-75)
    results = await asyncio.gather(
        skill_agent.analyze(transcript, resume_text),
        personality_agent.analyze(transcript),
        passion_agent.analyze(transcript),
        goal_lifestyle_agent.analyze(transcript),
        values_agent.analyze(transcript)
    )

    # Step 2: Build complete profile (Line 84-91)
    career_profile = {
        "skills": skills_result,
        "personality": personality_result,
        "passions": passions_result,
        "goals": goals_result,
        "values": values_result
    }

    # Step 3: Generate recommendations (Line 97)
    recommendations = await orchestrator_agent.recommend(career_profile)

    return {
        "careerProfile": career_profile,
        "careerRecommendations": recommendations  # 20-25 careers
    }
```

### 3.2 Career Compass Agents

#### Agent 1: SkillAgent
**File:** `python-backend/agents_v2/skill_agent.py:1-71`

**Purpose:** Extract skills with proficiency levels from transcript and resume

**Output Structure:**
```json
{
  "skills": [
    {
      "name": "Python",
      "level": "advanced",
      "yearsOfExperience": 3.5
    },
    {
      "name": "Leadership",
      "level": "intermediate",
      "yearsOfExperience": 2.0
    }
  ]
}
```

**Analysis Method:**
- Parses transcript + resume text
- Identifies technical skills (languages, tools, platforms)
- Identifies soft skills (communication, leadership)
- Infers proficiency from context clues (years, projects, depth)

---

#### Agent 2: PersonalityAgent
**File:** `python-backend/agents_v2/personality_agent.py:1-64`

**Purpose:** Infer Big Five personality traits

**Output Structure:**
```json
{
  "personality": [
    {
      "name": "Openness",
      "score": 8.5,
      "description": "High curiosity and creativity"
    },
    {
      "name": "Conscientiousness",
      "score": 7.0,
      "description": "Organized and detail-oriented"
    }
  ]
}
```

**Dimensions Analyzed:**
- Openness (creativity vs. routine)
- Conscientiousness (organized vs. flexible)
- Extraversion (social vs. solitary)
- Agreeableness (collaborative vs. competitive)
- Neuroticism (emotional stability)

---

#### Agent 3: PassionAgent
**File:** `python-backend/agents_v2/passion_agent.py`

**Purpose:** Identify intrinsic motivations and interests

**Output Structure:**
```json
{
  "passions": [
    {
      "name": "Artificial Intelligence",
      "score": 9.0,
      "description": "Strong interest in AI/ML technologies"
    },
    {
      "name": "Social Impact",
      "score": 7.5,
      "description": "Motivated by helping others"
    }
  ]
}
```

---

#### Agent 4: GoalLifestyleAgent
**File:** `python-backend/agents_v2/goal_lifestyle_agent.py`

**Purpose:** Parse career goals and lifestyle preferences

**Output Structure:**
```json
{
  "goals": {
    "shortTerm": ["Land AI engineering role", "Complete ML certification"],
    "longTerm": ["Lead AI team", "Start AI consulting firm"],
    "targetIncome": "$120,000 - $150,000",
    "workStyle": "Remote-first",
    "location": "San Francisco Bay Area or Remote",
    "workLifeBalance": "High priority"
  }
}
```

---

#### Agent 5: ValuesAgent
**File:** `python-backend/agents_v2/values_agent.py`

**Purpose:** Identify core work values and ethical principles

**Output Structure:**
```json
{
  "values": [
    {
      "name": "Innovation",
      "priority": "high",
      "description": "Cutting-edge technology and creativity"
    },
    {
      "name": "Autonomy",
      "priority": "high",
      "description": "Independence and ownership"
    },
    {
      "name": "Impact",
      "priority": "medium",
      "description": "Making a difference"
    }
  ]
}
```

---

#### Orchestrator: CareerOrchestratorAgent
**File:** `python-backend/agents_v2/orchestrator_agent.py:1-149`

**Purpose:** Dynamically generate 20-25 career recommendations using LLM

**Scoring Formula (Lines 63-67):**
```
fitScore = (skills_match * 0.35) +
           (personality_match * 0.25) +
           (values_match * 0.20) +
           (passion_match * 0.15) +
           (goals_match * 0.05)
```

**Recommendation Structure:**
```json
{
  "recommendations": [
    {
      "careerId": "ai-machine-learning-engineer",
      "careerName": "AI/Machine Learning Engineer",
      "industry": "Technology",
      "fitScore": 95,
      "summary": "Design and deploy ML models for production systems",
      "medianSalary": "$130,000 - $180,000",
      "growthOutlook": "32% growth (much faster than average)",
      "estimatedTime": "3-6 months with current Python skills",
      "whyGoodFit": "Your advanced Python skills, passion for AI, and...",
    },
    // ... 19-24 more careers
  ]
}
```

**Generation Strategy (Lines 50-72):**
- Generates recommendations across 9+ industry categories
- Includes 3 tiers:
  - Direct fits (scores 85-100)
  - Adjacent/lateral moves (scores 75-84)
  - Creative/unexpected options (scores 65-74)

---

## 4. SpoonOS Agents (Legacy System)

**File:** `python-backend/spoon_career_agents.py:1-941`

### 4.1 SpoonOS Framework

**Base Class:** `spoon_ai.agents.react.ReActAgent`

**Pattern:**
```python
class CustomAgent(ReActAgent):
    def __init__(self):
        chatbot = create_chatbot_with_fallback()  # OpenAI/Anthropic
        memory = Memory()
        super().__init__(
            name="AgentName",
            description="...",
            system_prompt="...",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )

    async def think(self) -> bool:
        # Determine if agent should act
        pass

    async def act(self) -> str:
        # Perform analysis and return results
        pass
```

### 4.2 SpoonOS Agent Catalog

| Agent | Lines | Purpose | Output |
|-------|-------|---------|--------|
| **SkillsAgent** | 49-155 | Extract skills & experience | JSON: technical_skills, transferable_skills, expertise_areas |
| **PersonalityAgent** | 157-258 | Big Five personality analysis | JSON: OCEAN scores + career implications |
| **PassionsAgent** | 260-357 | Identify passions & motivations | JSON: core_passions, energizing_activities, industry_alignments |
| **GoalsAgent** | 359-457 | Analyze career goals | JSON: short_term_goals, long_term_goals, timeline_preference |
| **ValuesAgent** | 459-560 | Identify core values | JSON: core_work_values, ethical_principles, value_aligned_careers |
| **RecommendationAgent** | 562-693 | Generate career recommendations | JSON: 3-5 careers with match_score, reasoning, next_steps |
| **ActionPlanAgent** | 695-874 | Create detailed action plans | JSON: immediate_actions, short_term_goals, resource_requirements |

### 4.3 SpoonOS Orchestration

**Class:** `CareerAnalysisOrchestrator` (Lines 876-941)

**Sequential Execution:**
```python
async def analyze_career(user_input):
    # Run agents in sequence (Line 898)
    for agent_name in ["skills", "personality", "passions",
                       "goals", "values", "recommendations", "action_plan"]:
        agent = self.agents[agent_name]
        await agent.add_message("user", user_input)
        result = await agent.run()
        self.results[agent_name] = result

    return {
        "success": True,
        "results": self.results,
        "summary": "Comprehensive career analysis completed"
    }
```

**Key Difference:** SpoonOS runs agents **sequentially** (each builds on previous context), while Career Compass runs **in parallel** (independent analysis, merged after).

---

## 5. Data Flow: End-to-End

### 5.1 Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                   │
│    - Voice interview (ElevenLabs) → transcript                  │
│    - Resume upload (optional) → resume_text                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (Next.js)                                           │
│    File: app/recommendations/page.tsx:23                        │
│    Calls: CareerAPI.onboardingStart(transcript, resume_text)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTP POST to Python
┌─────────────────────────────────────────────────────────────────┐
│ 3. PYTHON BACKEND (FastAPI)                                     │
│    File: python-backend/main.py:164-239                         │
│    Endpoint: POST /api/onboarding/start                         │
│                                                                  │
│    IF USE_CAREER_COMPASS:                                       │
│      result = await career_compass_pipeline.analyze()           │
│    ELSE:                                                         │
│      result = await orchestrator.analyze_career()               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Async execution
┌─────────────────────────────────────────────────────────────────┐
│ 4. CAREER COMPASS PIPELINE                                      │
│    File: python-backend/agents_v2/pipeline.py:49-118            │
│                                                                  │
│    Parallel Agent Execution:                                    │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│    │ SkillAgent   │  │PersonalityAg │  │ PassionAgent │       │
│    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│           │                  │                  │               │
│           └─────────┬────────┴──────────────────┘               │
│                     ↓                                           │
│          ┌─────────────────────────┐                            │
│          │  5 Agents Complete      │                            │
│          │  Build careerProfile    │                            │
│          └──────────┬──────────────┘                            │
│                     ↓                                           │
│          ┌─────────────────────────┐                            │
│          │ CareerOrchestratorAgent │                            │
│          │ Generate 20-25 careers  │                            │
│          └──────────┬──────────────┘                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
                      ↓ Return JSON
┌─────────────────────────────────────────────────────────────────┐
│ 5. PYTHON RESPONSE                                              │
│    {                                                             │
│      "success": true,                                            │
│      "orchestratorSessionId": "uuid",                            │
│      "careerProfile": {...},                                     │
│      "recommendedRoles": [20-25 careers]                         │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Save to database
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND SAVES TO CONVEX                                     │
│    File: app/recommendations/page.tsx:147-173                   │
│                                                                  │
│    await saveCareerProfile(careerProfile)                       │
│    await saveRecommendations(recommendedRoles)                  │
│                                                                  │
│    Convex Tables:                                               │
│    - careerProfiles (skills, personality, passions, etc.)       │
│    - careerRecommendations (20-25 careers with fitScores)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Render
┌─────────────────────────────────────────────────────────────────┐
│ 7. UI DISPLAY                                                   │
│    - Career cards with match percentages                        │
│    - Filter/sort by industry, salary, fit score                 │
│    - Select up to 3 careers for action plans                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Action Plan Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS 3 CAREERS                                       │
│    Frontend: app/recommendations/page.tsx:132                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│ 2. PYTHON BACKEND                                               │
│    File: main.py:306-388                                        │
│    Endpoint: POST /api/selected-careers                         │
│    Body: { userId, careerIds: [id1, id2, id3] }                 │
│                                                                  │
│    For each career:                                             │
│      1. plan = generate_action_plan(careerId)                   │
│      2. detailed = await PlanDetailAgent.generate_detailed_plan │
│         - 4 phases (Foundation, Building, Advanced, Mastery)    │
│         - 16+ tasks per career                                  │
│         - Learning resources + YouTube videos                   │
│         - Networking strategies                                 │
│                                                                  │
│    Return:                                                       │
│      {                                                           │
│        selectedCareers: [                                        │
│          {                                                       │
│            careerId, phases[], tasks[],                          │
│            progress: {xp:0, level:1, completionPercent:0},      │
│            detailedPlan, videos[]                                │
│          }                                                       │
│        ]                                                         │
│      }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Save to Convex
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND SAVES TO CONVEX                                     │
│    Tables:                                                       │
│    - selectedCareers (userId, careerId, status)                 │
│    - actionPlans (phases, tasks, detailedPlan, videos)          │
│    - careerProgress (xp, level, streak, tasksCompleted)         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Navigate
┌─────────────────────────────────────────────────────────────────┐
│ 4. DASHBOARD VIEW                                               │
│    - 3 career cards with progress bars                          │
│    - Gamification: Level, XP, Streak                            │
│    - Task checklist with XP rewards                             │
│    - Phase unlocking system                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### 6.1 Python Backend Endpoints
**Base URL:** `http://localhost:8001` (dev) or `https://your-app.fly.dev` (prod)

#### Health Check
```
GET /health
Response: {
  "status": "healthy",
  "service": "Career OS AI Agents",
  "pipeline": "Career Compass",
  "timestamp": 1706032800.0,
  "agents_ready": true
}
```

#### Onboarding Start (Primary)
```
POST /api/onboarding/start
Body: {
  "transcript": "I'm a software engineer with 3 years of experience...",
  "resume_text": "JOHN DOE\nSoftware Engineer\n..."
}

Response: {
  "success": true,
  "orchestratorSessionId": "uuid-here",
  "careerProfile": {
    "skills": [{name, level, yearsOfExperience}],
    "personality": [{name, score, description}],
    "passions": [{name, score, description}],
    "goals": {shortTerm, longTerm, targetIncome, workStyle},
    "values": [{name, priority, description}]
  },
  "recommendedRoles": [
    {
      "careerId": "ai-ml-engineer",
      "role": "AI/Machine Learning Engineer",
      "industry": "Technology",
      "matchScore": 95,
      "matchExplanation": "...",
      "medianSalary": "$130k-$180k",
      "growthOutlook": "32% growth",
      "estimatedTime": "3-6 months"
    },
    // ... 19-24 more careers
  ]
}
```

#### Selected Careers (Action Plans)
```
POST /api/selected-careers
Body: {
  "userId": "user_123",
  "careerIds": ["ai-ml-engineer", "data-scientist", "product-manager"]
}

Response: {
  "success": true,
  "selectedCareers": [
    {
      "careerId": "ai-ml-engineer",
      "phases": [
        {
          "id": "phase-1",
          "name": "Foundation",
          "description": "Build core skills",
          "unlocked": true
        },
        // ... 3 more phases
      ],
      "tasks": [
        {
          "id": "task-1",
          "phaseId": "phase-1",
          "type": "learning",
          "title": "Complete Python for ML course",
          "description": "...",
          "xpReward": 250,
          "status": "not_started"
        },
        // ... 15+ more tasks
      ],
      "progress": {
        "xp": 0,
        "level": 1,
        "completionPercent": 0.0,
        "streak": 0,
        "xpToNextLevel": 1000
      },
      "detailedPlan": {...},
      "videos": [{title, url, duration}]
    },
    // ... 2 more careers
  ]
}
```

#### Legacy Endpoints
```
POST /api/analyze-onboarding  # Legacy SpoonOS analysis
POST /api/onboarding/llm-response  # Simple state machine for questions
POST /api/generate-action-plan  # Legacy action plan generation
GET /api/career-insights/{career_id}  # Mock career insights
POST /api/test-agents  # Agent testing endpoint
```

### 6.2 Convex Proxy Actions
**File:** `convex/spoonos.ts:1-77`

#### Process with SpoonOS
```typescript
const processWithSpoonOS = useAction(api.spoonos.processWithSpoonOS);

await processWithSpoonOS({
  operation: "analyze",
  data: { content: "..." }
});
```

**Implementation (Lines 9-40):**
- Checks Clerk auth
- Proxies to `${PYTHON_API_URL}/api/spoonos/process`
- Returns result or throws error

#### Health Check
```typescript
const checkHealth = useAction(api.spoonos.checkPythonBackendHealth);

const status = await checkHealth({});
// Returns: { status, elevenLabsConfigured, spoonosConfigured, version, url }
```

**Implementation (Lines 45-77):**
- Fetches `${PYTHON_API_URL}/health`
- Returns status or "unreachable" if backend down

---

## 7. Convex Database Schema

**File:** `convex/schema.ts:1-342`

### Key Tables

#### careerProfiles
```typescript
defineTable({
  userId: v.string(),
  skills: v.array(v.object({
    name: v.string(),
    level: v.string(),
    yearsOfExperience: v.optional(v.number())
  })),
  personality: v.array(v.object({
    name: v.string(),
    score: v.number(),
    description: v.string()
  })),
  passions: v.array(v.object({
    name: v.string(),
    score: v.number()
  })),
  goals: v.object({
    shortTerm: v.array(v.string()),
    longTerm: v.array(v.string()),
    targetIncome: v.optional(v.string()),
    workStyle: v.optional(v.string())
  }),
  values: v.array(v.object({
    name: v.string(),
    priority: v.string()
  })),
  createdAt: v.number(),
  updatedAt: v.number()
})
```

#### careerRecommendations
```typescript
defineTable({
  userId: v.string(),
  agentRunId: v.optional(v.string()),
  recommendations: v.array(v.object({
    careerId: v.string(),
    careerName: v.string(),
    industry: v.string(),
    fitScore: v.number(),
    medianSalary: v.string(),
    growthOutlook: v.string(),
    estimatedTime: v.string(),
    whyGoodFit: v.string()
  })),
  selectedRecommendation: v.optional(v.string()),
  createdAt: v.number()
})
```

#### selectedCareers
```typescript
defineTable({
  userId: v.string(),
  careerId: v.string(),
  careerName: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("abandoned")
  ),
  createdAt: v.number()
})
```

#### actionPlans
```typescript
defineTable({
  userId: v.string(),
  careerId: v.string(),
  phases: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    unlocked: v.boolean()
  })),
  tasks: v.array(v.object({
    id: v.string(),
    phaseId: v.string(),
    type: v.union(v.literal("learning"), v.literal("project"),
                  v.literal("networking"), v.literal("simulator")),
    title: v.string(),
    description: v.string(),
    xpReward: v.number(),
    status: v.string()
  })),
  detailedPlan: v.optional(v.any()),
  videos: v.optional(v.array(v.object({
    title: v.string(),
    url: v.string(),
    duration: v.optional(v.string())
  }))),
  createdAt: v.number()
})
```

#### careerProgress
```typescript
defineTable({
  userId: v.string(),
  careerId: v.string(),
  xp: v.number(),
  level: v.number(),
  completionPercent: v.number(),
  streak: v.number(),
  tasksCompletedThisWeek: v.number(),
  lastTaskCompletedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
})
```

---

## 8. Environment Configuration

### 8.1 Python Backend (.env)
**File:** `python-backend/.env`

```bash
# LLM Providers (required for Career Compass)
GEMINI_API_KEY=your_gemini_key_here  # Primary
OPENAI_API_KEY=your_openai_key       # SpoonOS fallback
ANTHROPIC_API_KEY=your_anthropic_key # SpoonOS fallback

# System Configuration
USE_CAREER_COMPASS=true  # Toggle: true (Gemini) or false (SpoonOS)
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_MODEL=gemini-2.0-flash

# Voice Integration
ELEVENLABS_API_KEY=your_elevenlabs_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Server
PORT=8001
```

### 8.2 Convex Environment Variables
**Set in:** Convex Dashboard → Settings → Environment Variables

```bash
PYTHON_API_URL=http://localhost:8001  # Dev
# PYTHON_API_URL=https://your-python-api.fly.dev  # Production
```

### 8.3 Frontend (.env.local)
```bash
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8001

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-convex-app.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment
```

---

## 9. Frontend Integration

### 9.1 Onboarding Component
**File:** `app/recommendations/page.tsx:1-240`

**Key Functions:**

```typescript
// Initialize Career API client
const careerAPI = new CareerAPI();

// Start onboarding analysis
const handleAnalysis = async () => {
  const result = await careerAPI.onboardingStart(
    transcript,
    resume_text
  );

  if (result.success) {
    // Save to Convex
    await saveCareerProfile(result.careerProfile);
    await saveRecommendations(result.recommendedRoles);

    // Navigate to recommendations
    router.push("/recommendations");
  }
};
```

### 9.2 Career Selection
```typescript
const handleSelectCareer = async (careerIds: string[]) => {
  // Call Python backend
  const response = await fetch(
    "http://localhost:8001/api/selected-careers",
    {
      method: "POST",
      body: JSON.stringify({ userId: user.id, careerIds })
    }
  );

  const data = await response.json();

  // Save to Convex
  for (const career of data.selectedCareers) {
    await selectCareersMutation({ careerId: career.careerId });
    await upsertCareerCompassPlan({
      careerId: career.careerId,
      phases: career.phases,
      tasks: career.tasks
    });
    await initializeProgress({ careerId: career.careerId });
  }

  router.push("/dashboard");
};
```

### 9.3 Progress Tracking
```typescript
const updateTaskStatus = async (taskId: string, status: string) => {
  // Update in Convex
  await updateTaskMutation({ taskId, status });

  // Recalculate XP and level
  if (status === "completed") {
    const xpGain = task.xpReward;
    await addXpMutation({ careerId, xpGain });
  }
};
```

---

## 10. Deployment Architecture

### 10.1 Production Stack

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend: Vercel (Next.js)                                   │
│ URL: https://path-finder.vercel.app                          │
│ - Automatic deployments from GitHub                          │
│ - Environment variables configured in dashboard              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ├─── HTTPS ────┐
                       ↓               ↓
         ┌──────────────────┐  ┌──────────────────┐
         │ Convex           │  │ Python Backend   │
         │ (Managed)        │  │ (Fly.io/Railway) │
         │                  │  │                  │
         │ - Database       │←─│ Port 8001        │
         │ - Auth           │  │ - Gemini API     │
         │ - Real-time      │  │ - ElevenLabs API │
         └──────────────────┘  └──────────────────┘
```

### 10.2 Python Backend Deployment (Fly.io)

**Steps:**
```bash
cd python-backend

# Deploy to Fly.io
fly launch
fly deploy

# Set secrets
fly secrets set GEMINI_API_KEY=xxx
fly secrets set OPENAI_API_KEY=xxx
fly secrets set ELEVENLABS_API_KEY=xxx
fly secrets set USE_CAREER_COMPASS=true
fly secrets set ALLOWED_ORIGINS=https://path-finder.vercel.app
```

**Update Convex:**
- Set `PYTHON_API_URL=https://your-app.fly.dev` in Convex dashboard

---

## 11. Performance Metrics

### Agent Execution Times (Estimated)

| Agent | Career Compass | SpoonOS |
|-------|----------------|---------|
| **Skill Analysis** | ~2-3s | ~3-4s |
| **Personality Analysis** | ~2-3s | ~3-4s |
| **Passion Analysis** | ~2-3s | ~3-4s |
| **Goals Analysis** | ~2-3s | ~3-4s |
| **Values Analysis** | ~2-3s | ~3-4s |
| **Orchestrator (20-25 careers)** | ~5-7s | N/A |
| **Recommendations (3-5 careers)** | N/A | ~4-5s |
| **Total Pipeline** | **~15-20s** | **~25-30s** |

**Optimization:**
- Career Compass runs 5 agents in parallel → faster
- SpoonOS runs 7 agents sequentially → slower

---

## 12. Security Considerations

### 12.1 Authentication Flow
```
User → Clerk → JWT → Convex → verify user identity
                     ↓
                     Python Backend (no auth, proxied through Convex)
```

**Critical:** Python backend should **never** be exposed directly to frontend. Always proxy through Convex actions with auth checks.

### 12.2 API Key Management
- **Never** commit `.env` files
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor API usage quotas

### 12.3 Rate Limiting
- Add `slowapi` to Python backend for production
- Set per-user rate limits in Convex
- Monitor for abuse patterns

---

## 13. Monitoring & Debugging

### 13.1 Health Checks
```typescript
// Regular health check (every 5 minutes)
setInterval(async () => {
  const health = await checkPythonBackendHealth({});
  if (health.status !== "healthy") {
    console.error("Python backend unhealthy", health);
    // Alert admins
  }
}, 5 * 60 * 1000);
```

### 13.2 Logging
**Python Backend:**
```python
import logging
logger = logging.getLogger(__name__)

logger.info("Starting career analysis pipeline")
logger.error(f"Pipeline error: {e}", exc_info=True)
```

**Convex:**
```typescript
console.log("Processing SpoonOS request", args);
console.error("SpoonOS error:", error);
```

### 13.3 Error Tracking
- Use Sentry for error tracking
- Log all agent execution failures
- Track API response times
- Monitor LLM token usage

---

## 14. Future Improvements

### 14.1 Planned Enhancements
1. **Hybrid Scoring:** Combine Career Compass recommendations with SpoonOS validation
2. **A/B Testing:** Compare Career Compass vs SpoonOS recommendation quality
3. **Caching:** Cache common career profiles to reduce LLM calls
4. **Streaming:** Stream career recommendations as they're generated
5. **Multi-modal Analysis:** Incorporate video interview analysis
6. **Real-time Collaboration:** Allow career coaches to collaborate with users

### 14.2 Technical Debt
- Remove SpoonOS legacy system once Career Compass fully validated
- Consolidate agent code (reduce duplication between systems)
- Add comprehensive error handling for all LLM calls
- Implement retry logic with exponential backoff
- Add telemetry for agent performance tracking

---

## 15. Key Takeaways

### Architecture Highlights
1. **Dual System:** Career Compass (primary) + SpoonOS (fallback) for reliability
2. **Parallel Execution:** Career Compass runs 5 agents simultaneously for speed
3. **Dynamic Generation:** Orchestrator LLM generates 20-25 careers (not hardcoded)
4. **Weighted Scoring:** Scientific algorithm (35% skills, 25% personality, 20% values...)
5. **Gamification:** XP/Level system with 4 phases per career
6. **Real-time Sync:** Convex provides instant updates to UI

### Critical Files
- `python-backend/main.py` - FastAPI server and routing
- `python-backend/agents_v2/pipeline.py` - Career Compass orchestration
- `python-backend/agents_v2/orchestrator_agent.py` - Dynamic career generation
- `python-backend/spoon_career_agents.py` - Legacy SpoonOS agents
- `convex/spoonos.ts` - Convex → Python proxy
- `convex/schema.ts` - Database schema definitions

---

**Report Generated:** 2025-01-23
**Version:** 1.0
**Author:** Claude (AI Assistant)
