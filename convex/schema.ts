import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  todos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    userId: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

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

  // Projects table
  // Note: isDefault uniqueness per user is enforced in mutations (only one default project per user)
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"])
    .index("by_user_name", ["userId", "name"]),

  // Folders table
  // Note: Cycle detection for parentFolderId is enforced in mutations
  folders: defineTable({
    projectId: v.id("projects"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentFolderId"])
    .index("by_user", ["userId"])
    .index("by_project_parent", ["projectId", "parentFolderId"]),

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
