import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a planning conversation (like this one) to the database
export const savePlanningConversation = mutation({
  args: {
    conversationId: v.string(),
    title: v.string(),
    fullConversation: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    return await ctx.db.insert("planningConversations", {
      userId,
      conversationId: args.conversationId,
      title: args.title,
      fullConversation: args.fullConversation,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Get all planning conversations for the current user
export const getPlanningConversationHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    return await ctx.db
      .query("planningConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get a specific planning conversation by ID
export const getPlanningConversationById = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = identity.subject;

    const conversation = await ctx.db
      .query("planningConversations")
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
