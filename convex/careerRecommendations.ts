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
 * Get the user's selected career recommendation
 */
export const getSelectedCareer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const recommendation = await ctx.db
      .query("careerRecommendations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return recommendation?.selectedRecommendation || null;
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
 * Select a recommendation (user chooses their career path)
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

    // First, clear any existing selected recommendations for this user
    const userRecommendations = await ctx.db
      .query("careerRecommendations")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    await Promise.all(
      userRecommendations.map(rec =>
        ctx.db.patch(rec._id, { selectedRecommendation: undefined })
      )
    );

    // Then set the new selected recommendation
    await ctx.db.patch(args.recommendationId, {
      selectedRecommendation: {
        industry: args.industry,
        role: args.role,
      },
    });

    return await ctx.db.get(args.recommendationId);
  },
});

/**
 * Abandon recommendations and clear user profile analysis
 */
export const abandonRecommendations = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Delete all recommendations for this user
    const recommendations = await ctx.db
      .query("careerRecommendations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(recommendations.map(rec => ctx.db.delete(rec._id)));

    // Clear AI analysis results from user profile
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        aiAnalysisResults: undefined,
        rawOnboardingTranscript: undefined,
      });
    }

    return { success: true };
  },
});

/**
 * Remove a specific recommendation from the list
 */
export const removeRecommendation = mutation({
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

    // Filter out the specific recommendation
    const updatedRecommendations = recommendation.recommendations.filter(
      rec => !(rec.industry === args.industry && rec.role === args.role)
    );

    // Update the recommendations array
    await ctx.db.patch(args.recommendationId, {
      recommendations: updatedRecommendations,
    });

    return await ctx.db.get(args.recommendationId);
  },
});