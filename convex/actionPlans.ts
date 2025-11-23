import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get action plans for current user
 */
export const getActionPlans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("actionPlans")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single action plan
 */
export const getActionPlan = query({
  args: {
    actionPlanId: v.id("actionPlans"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const actionPlan = await ctx.db.get(args.actionPlanId);
    if (!actionPlan || actionPlan.userId !== identity.subject) {
      throw new Error("Action plan not found or unauthorized");
    }

    return actionPlan;
  },
});

/**
 * Create action plan
 */
export const createActionPlan = mutation({
  args: {
    recommendationId: v.id("careerRecommendations"),
    timeframe: v.string(),
    generatedPlanMarkdown: v.string(),
    phases: v.array(v.object({
      title: v.string(),
      duration: v.string(),
      steps: v.array(v.string()),
    })),
    requiredSkills: v.array(v.string()),
    recommendedProjects: v.array(v.string()),
    suggestedInternshipsRoles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Verify recommendation belongs to user
    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation || recommendation.userId !== userId) {
      throw new Error("Recommendation not found or unauthorized");
    }

    const actionPlanId = await ctx.db.insert("actionPlans", {
      userId,
      recommendationId: args.recommendationId,
      timeframe: args.timeframe,
      generatedPlanMarkdown: args.generatedPlanMarkdown,
      phases: args.phases,
      requiredSkills: args.requiredSkills,
      recommendedProjects: args.recommendedProjects,
      suggestedInternshipsRoles: args.suggestedInternshipsRoles,
      createdAt: Date.now(),
    });

    return await ctx.db.get(actionPlanId);
  },
});