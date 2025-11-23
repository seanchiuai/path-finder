import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Helper to get authenticated user ID
 */
async function getUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

/**
 * Get a single saved career by ID
 */
export const getSavedCareer = query({
  args: {
    savedCareerId: v.id("savedCareers"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const savedCareer = await ctx.db.get(args.savedCareerId);

    if (!savedCareer || savedCareer.userId !== userId) {
      throw new Error("Saved career not found or unauthorized");
    }

    return savedCareer;
  },
});

/**
 * List all saved careers in a folder
 */
export const listSavedCareersInFolder = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Verify folder exists and belongs to user
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or unauthorized");
    }

    return await ctx.db
      .query("savedCareers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("folderId"), args.folderId))
      .collect();
  },
});

/**
 * Get all saved careers for the current user
 */
export const getSavedCareers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    
    return await ctx.db
      .query("savedCareers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

/**
 * List all saved careers for a user
 */
export const listUserSavedCareers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    
    return await ctx.db
      .query("savedCareers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

/**
 * Create a new saved career
 */
export const createSavedCareer = mutation({
  args: {
    folderId: v.id("folders"),
    careerId: v.string(),
    careerName: v.string(),
    industry: v.string(),
    matchScore: v.number(),
    matchExplanation: v.string(),
    isGenerating: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Verify folder exists and belongs to user
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {

      throw new Error("Folder not found or unauthorized");
    }

    const savedCareerId = await ctx.db.insert("savedCareers", {
      userId,
      folderId: args.folderId,
      careerId: args.careerId,
      careerName: args.careerName,
      industry: args.industry,
      matchScore: args.matchScore,
      matchExplanation: args.matchExplanation,
      isGenerating: args.isGenerating,
      createdAt: Date.now(),
    });

    return savedCareerId;
  },
});

/**
 * Update saved career details
 */
export const updateSavedCareer = mutation({
  args: {
    savedCareerId: v.id("savedCareers"),
    careerName: v.optional(v.string()),
    industry: v.optional(v.string()),
    matchScore: v.optional(v.number()),
    matchExplanation: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    isGenerating: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const savedCareer = await ctx.db.get(args.savedCareerId);
    if (!savedCareer || savedCareer.userId !== userId) {
      throw new Error("Saved career not found or unauthorized");
    }

    // If moving to new folder, verify it exists and belongs to user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error("Folder not found or unauthorized");
      }
    }

    const updates: Partial<Doc<"savedCareers">> = {};
    if (args.careerName !== undefined) updates.careerName = args.careerName;
    if (args.industry !== undefined) updates.industry = args.industry;
    if (args.isGenerating !== undefined) updates.isGenerating = args.isGenerating;
    if (args.matchScore !== undefined) updates.matchScore = args.matchScore;
    if (args.matchExplanation !== undefined) updates.matchExplanation = args.matchExplanation;
    if (args.folderId !== undefined) updates.folderId = args.folderId;

    await ctx.db.patch(args.savedCareerId, updates);
  },
});

/**
 * Delete a saved career
 */
export const deleteSavedCareer = mutation({
  args: {
    savedCareerId: v.id("savedCareers"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const savedCareer = await ctx.db.get(args.savedCareerId);
    if (!savedCareer || savedCareer.userId !== userId) {
      throw new Error("Saved career not found or unauthorized");
    }

    await ctx.db.delete(args.savedCareerId);
  },
});

/**
 * Update isGenerating status by careerId
 */
export const updateGeneratingStatus = mutation({
  args: {
    careerId: v.string(),
    isGenerating: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Find the saved career by careerId
    const savedCareer = await ctx.db
      .query("savedCareers")
      .withIndex("by_careerId", (q) => q.eq("userId", userId).eq("careerId", args.careerId))
      .first();

    if (!savedCareer) {
      // Career not found, silently skip (might not have been saved yet)
      return;
    }

    await ctx.db.patch(savedCareer._id, {
      isGenerating: args.isGenerating,
    });
  },
});

/**
 * Update saved career embedding
 */
export const updateSavedCareerEmbedding = mutation({
  args: {
    savedCareerId: v.id("savedCareers"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const savedCareer = await ctx.db.get(args.savedCareerId);
    if (!savedCareer || savedCareer.userId !== userId) {
      throw new Error("Saved career not found or unauthorized");
    }

    await ctx.db.patch(args.savedCareerId, {
      embedding: args.embedding,
    });
  },
});

/**
 * List saved careers without embeddings
 */
export const listSavedCareersWithoutEmbeddings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedCareers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("embedding"), undefined))
      .collect();
  },
});
