import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get career recommendations for current user
 */
export const getCareerRecommendations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("careerRecommendations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .first();
  },
});

/**
 * Create career recommendations
 */
export const createCareerRecommendations = mutation({
  args: {
    agentRunId: v.string(),
    recommendations: v.array(v.object({
      industry: v.string(),
      role: v.string(),
      matchScore: v.number(),
      matchExplanation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Delete any existing recommendations for this user
    const existingRecommendations = await ctx.db
      .query("careerRecommendations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(existingRecommendations.map(rec => ctx.db.delete(rec._id)));

    // Create new recommendations
    const recommendationId = await ctx.db.insert("careerRecommendations", {
      userId,
      agentRunId: args.agentRunId,
      recommendations: args.recommendations,
      createdAt: Date.now(),
    });

    return await ctx.db.get(recommendationId);
  },
});

/**
 * Select a recommendation
 */
export const selectRecommendation = mutation({
  args: {
    recommendationId: v.id("careerRecommendations"),
    industry: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation || recommendation.userId !== identity.subject) {
      throw new Error("Recommendation not found or unauthorized");
    }

    await ctx.db.patch(args.recommendationId, {
      selectedRecommendation: {
        industry: args.industry,
        role: args.role,
      },
    });

    return await ctx.db.get(args.recommendationId);
  },
});