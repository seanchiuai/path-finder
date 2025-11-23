import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Save a realtime conversation to the database
export const saveConversation = mutation({
  args: {
    conversationId: v.string(),
    agentName: v.string(),
    fullTranscript: v.string(),
    sessionDuration: v.optional(v.number()),
    messagesCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("realtimeConversations", {
      userId,
      conversationId: args.conversationId,
      agentName: args.agentName,
      fullTranscript: args.fullTranscript,
      sessionDuration: args.sessionDuration,
      messagesCount: args.messagesCount,
      createdAt: Date.now(),
    });
  },
});

// Get all conversations for the current user
export const getConversationHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("realtimeConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get a specific conversation by ID
export const getConversationById = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const conversation = await ctx.db
      .query("realtimeConversations")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    // Ensure the conversation belongs to the current user
    if (conversation && conversation.userId !== userId) {
      return null;
    }

    return conversation;
  },
});

// Get recent conversations (last 10)
export const getRecentConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("realtimeConversations")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
