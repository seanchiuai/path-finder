import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveMemory = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    memoryType: v.union(v.literal("preference"), v.literal("context")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if memory exists
    const existing = await ctx.db
      .query("userMemory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("userMemory", {
        userId: identity.subject,
        key: args.key,
        value: args.value,
        memoryType: args.memoryType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const getUserMemories = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Validate and normalize limit (default 50, max 100)
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    // Use server-side pagination with take()
    const memories = await ctx.db
      .query("userMemory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .take(limit);

    return memories;
  },
});

export const deleteMemory = mutation({
  args: {
    memoryId: v.id("userMemory"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const memory = await ctx.db.get(args.memoryId);
    if (!memory || memory.userId !== identity.subject) {
      throw new Error("Memory not found or unauthorized");
    }

    await ctx.db.delete(args.memoryId);
  },
});
