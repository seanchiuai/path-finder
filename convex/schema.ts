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
    // AI analysis results
    aiAnalysisResults: v.optional(v.object({
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
        riskTolerance: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        schedulePreference: v.optional(v.string()),
      })),
      values: v.optional(v.array(v.string())),
    })),
    recommendations: v.optional(v.array(v.object({
      industry: v.string(),
      role: v.string(),
      matchScore: v.number(),
      matchExplanation: v.string(),
    }))),
    // Add other relevant fields derived from onboarding questions
  }).index("by_userId", ["userId"]),

  // REPURPOSED: Projects now organize saved careers.
  projects: defineTable({
    userId: v.string(),
    name: v.string(), // e.g., "Dream Careers", "Applying To"
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]) // Keep for uniqueness
    .index("by_user_default", ["userId", "isDefault"]),

  // REPURPOSED: Folders now organize saved careers within projects.
  folders: defineTable({
    projectId: v.id("projects"),
    parentFolderId: v.optional(v.id("folders")), // e.g., "Tech Roles", "Creative Fields"
    name: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentFolderId"]) // For tree structure
    .index("by_user", ["userId"]) // For direct user access
    .index("by_project_parent", ["projectId", "parentFolderId"]),

  // REPURPOSED: Bookmarks now store saved career paths.
  // Renamed from 'bookmarks' to 'savedCareers' for clarity.
  savedCareers: defineTable({
    userId: v.string(),
    folderId: v.id("folders"), // Link to organized folders
    careerName: v.string(), // e.g., "Product Manager"
    industry: v.string(),
    matchScore: v.number(), // Percentage match to user profile
    matchExplanation: v.string(), // How the match was determined
    embedding: v.optional(v.array(v.float64())), // Vector embedding for search
    createdAt: v.number(),
  })
    .index("by_user_folder", ["userId", "folderId"])
    .searchIndex("by_embedding", {
      searchField: "embedding",
      filterFields: ["userId", "folderId"],
    }),

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

  // AI Chat System
  chatMessages: defineTable({
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    bookmarkReferences: v.optional(v.array(v.string())), // Bookmark IDs
    projectId: v.optional(v.string()), // Context: which project user was in
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  userMemory: defineTable({
    userId: v.string(),
    memoryType: v.union(v.literal("preference"), v.literal("context")),
    key: v.string(), // e.g., "favorite_language", "work_interests"
    value: v.string(), // e.g., "TypeScript", "React, Next.js", Convex"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "memoryType"]),

  // Bookmarks table with vector embeddings
  bookmarks: defineTable({
    folderId: v.id("folders"),
    userId: v.string(),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    previewImageId: v.optional(v.id("_storage")),
    faviconId: v.optional(v.id("_storage")),
    favicon: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())), // 1536 dimensions for text-embedding-3-small
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_folder", ["folderId"])
    .index("by_user", ["userId"])
    .index("by_folder_url", ["folderId", "url"])
    .index("by_user_url", ["userId", "url"]) // For duplicate URL detection
    .searchIndex("by_embedding", {
      searchField: "embedding",
      filterFields: ["userId", "folderId"],
    }),

  // Realtime Conversations (OpenAI Realtime API)
  realtimeConversations: defineTable({
    userId: v.string(),
    conversationId: v.string(), // Unique ID for each session
    agentName: v.string(), // e.g., "lisa"
    fullTranscript: v.string(), // Entire conversation as formatted string
    sessionDuration: v.optional(v.number()), // Duration in seconds
    messagesCount: v.number(), // Number of messages exchanged
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_conversation_id", ["conversationId"]),

  // Planning Conversations (Claude Code planning sessions)
  planningConversations: defineTable({
    userId: v.string(),
    conversationId: v.string(), // Unique ID for each planning session
    title: v.string(), // e.g., "OpenAI Realtime Integration Plan"
    fullConversation: v.string(), // Entire planning conversation as text
    metadata: v.optional(v.any()), // Optional metadata (files created, commits, etc.)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_conversation_id", ["conversationId"]),
});
