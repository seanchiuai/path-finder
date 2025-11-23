import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create career profile
 */
export const getOrCreateCareerProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Not authorized for this user");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("careerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile
    const profileId = await ctx.db.insert("careerProfiles", {
      userId: args.userId,
    });

    return await ctx.db.get(profileId);
  },
});

/**
 * Get career profile for current user
 */
export const getCareerProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("careerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

/**
 * Update career profile
 */
export const updateCareerProfile = mutation({
  args: {
    rawOnboardingTranscript: v.optional(v.string()),
    resumeText: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Get existing profile
    const profile = await ctx.db
      .query("careerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Career profile not found");
    }

    const updates: any = {};
    if (args.rawOnboardingTranscript !== undefined) updates.rawOnboardingTranscript = args.rawOnboardingTranscript;
    if (args.resumeText !== undefined) updates.resumeText = args.resumeText;
    if (args.skills !== undefined) updates.skills = args.skills;
    if (args.personality !== undefined) updates.personality = args.personality;
    if (args.passions !== undefined) updates.passions = args.passions;
    if (args.goals !== undefined) updates.goals = args.goals;
    if (args.values !== undefined) updates.values = args.values;
    if (args.aiAnalysisResults !== undefined) updates.aiAnalysisResults = args.aiAnalysisResults;
    if (args.recommendations !== undefined) updates.recommendations = args.recommendations;

    await ctx.db.patch(profile._id, updates);

    return await ctx.db.get(profile._id);
  },
});

/**
 * Remove a specific recommendation from career profile
 */
export const removeRecommendationFromProfile = mutation({
  args: {
    career: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Get existing profile
    const profile = await ctx.db
      .query("careerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Career profile not found");
    }

    // Filter out the specific recommendation from the recommendations array
    if (profile.recommendations) {
      const updatedRecommendations = profile.recommendations.filter(
        rec => rec.role !== args.career
      );

      await ctx.db.patch(profile._id, {
        recommendations: updatedRecommendations,
      });
    }

    return await ctx.db.get(profile._id);
  },
});