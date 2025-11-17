import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    bookmarkReferences: v.optional(v.array(v.string())),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const messageId = await ctx.db.insert("chatMessages", {
      userId: identity.subject,
      role: args.role,
      content: args.content,
      bookmarkReferences: args.bookmarkReferences,
      projectId: args.projectId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const listRecentMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const clearHistory = mutation({
  args: {
    maxAgeDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const BATCH_SIZE = 100;
    const cutoffTime = args.maxAgeDays
      ? Date.now() - args.maxAgeDays * 24 * 60 * 60 * 1000
      : 0;

    // Delete in batches to avoid memory issues
    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      let query = ctx.db
        .query("chatMessages")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject));

      // Only apply time filter if cutoffTime is specified
      if (cutoffTime > 0) {
        query = query.filter((q) => q.lt(q.field("createdAt"), cutoffTime));
      }

      const messages = await query.take(BATCH_SIZE);

      if (messages.length === 0) {
        hasMore = false;
      } else {
        for (const msg of messages) {
          await ctx.db.delete(msg._id);
        }
        totalDeleted += messages.length;

        // If we got less than batch size, we're done
        if (messages.length < BATCH_SIZE) {
          hasMore = false;
        }
      }
    }

    return { deletedCount: totalDeleted };
  },
});
