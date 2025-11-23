import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

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

/**
 * Generate action plan by calling Python backend
 */
export const generateActionPlan = action({
  args: {
    recommendationId: v.id("careerRecommendations"),
    timeframe: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"actionPlans">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    
    // Get the latest recommendation details (actions cannot access db directly)
    const recommendationRes: Doc<"careerRecommendations"> | null = await ctx.runQuery(api.careerRecommendations.getCareerRecommendations, {});
    if (!recommendationRes || recommendationRes.userId !== userId) {
      throw new Error("Recommendation not found or unauthorized");
    }
    const recommendation: Doc<"careerRecommendations"> = recommendationRes;

    // Get career profile for additional context
    const careerProfileRes: Doc<"careerProfiles"> | null = await ctx.runQuery(api.careerProfiles.getCareerProfile, {});
    if (!careerProfileRes) {
      throw new Error("Career profile not found");
    }
    const careerProfile: Doc<"careerProfiles"> = careerProfileRes;

    try {
      // Call Python backend to generate action plan
      const response: Response = await fetch(`${process.env.PYTHON_API_URL || process.env.PYTHON_BACKEND_URL}/api/generate-action-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          careerId: recommendation._id,
          timeframe: args.timeframe,
          careerData: {
            industry: recommendation.selectedRecommendation?.industry || recommendation.recommendations[0]?.industry,
            role: recommendation.selectedRecommendation?.role || recommendation.recommendations[0]?.role,
            currentSkills: careerProfile.skills || [],
            goals: careerProfile.goals || {},
            values: careerProfile.values || []
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: any = await response.json();
      
      if (!result.success) {
        throw new Error("Action plan generation failed");
      }

      // Store the generated action plan in Convex via mutation
      const created = await ctx.runMutation(api.actionPlans.createActionPlan, {
        recommendationId: recommendation._id as any,
        timeframe: args.timeframe,
        generatedPlanMarkdown: result.actionPlan.markdown || "",
        phases: result.actionPlan.phases || [],
        requiredSkills: result.actionPlan.requiredSkills || [],
        recommendedProjects: result.actionPlan.recommendedProjects || [],
        suggestedInternshipsRoles: result.actionPlan.suggestedInternshipsRoles || [],
      });
      if (!created) {
        throw new Error("Failed to persist generated action plan");
      }
      return created as Doc<"actionPlans">;
    } catch (error) {
      console.error("Failed to generate action plan:", error);
      
      // Fallback to mock action plan for demo purposes
      const created = await ctx.runMutation(api.actionPlans.createActionPlan, {
        recommendationId: recommendation._id as any,
        timeframe: args.timeframe,
        generatedPlanMarkdown: `# ${args.timeframe} Action Plan for ${recommendation.selectedRecommendation?.role || "Your Career"}\n\n## Phase 1: Foundation (Month 1-2)\n- Complete online courses in your target field\n- Build a portfolio with 2-3 projects\n- Update your LinkedIn profile\n\n## Phase 2: Skill Building (Month 3-4)\n- Practice technical skills daily\n- Join relevant communities and forums\n- Start networking with professionals\n\n## Phase 3: Application (Month 5-6)\n- Apply to 5-10 positions per week\n- Prepare for interviews\n- Follow up on applications`,
        phases: [
          {
            title: "Foundation",
            duration: "2 months",
            steps: ["Complete online courses", "Build portfolio projects", "Update LinkedIn"]
          },
          {
            title: "Skill Building", 
            duration: "2 months",
            steps: ["Practice technical skills", "Join communities", "Start networking"]
          },
          {
            title: "Application",
            duration: "2 months", 
            steps: ["Apply to positions", "Prepare for interviews", "Follow up"]
          }
        ],
        requiredSkills: ["Technical skills", "Communication", "Problem solving"],
        recommendedProjects: ["Portfolio website", "Open source contributions"],
        suggestedInternshipsRoles: ["Junior developer", "Internship", "Entry-level position"],
      });
      if (!created) {
        throw new Error("Failed to persist fallback action plan");
      }
      return created as Doc<"actionPlans">;
    }
  },
});

/**
 * Get action plan by careerId (Career Compass)
 */
export const getActionPlanByCareer = query({
  args: {
    careerId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("actionPlans")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", identity.subject).eq("careerId", args.careerId)
      )
      .first();
  },
});

/**
 * Create or update action plan with Career Compass structure
 */
export const upsertCareerCompassPlan = mutation({
  args: {
    careerId: v.string(),
    phases: v.array(
      v.object({
        phaseId: v.number(),
        name: v.string(),
        order: v.number(),
        status: v.string(),
        title: v.optional(v.string()),
        duration: v.optional(v.string()),
        steps: v.optional(v.array(v.string())),
      })
    ),
    tasks: v.array(
      v.object({
        taskId: v.string(),
        title: v.string(),
        track: v.string(),
        phase: v.number(),
        xp: v.number(),
        status: v.string(),
        description: v.optional(v.string()),
      })
    ),
    videos: v.optional(
      v.array(
        v.object({
          videoId: v.string(),
          title: v.string(),
          channel: v.optional(v.string()),
          url: v.string(),
        })
      )
    ),
    detailedPlan: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Check if action plan already exists for this career
    const existing = await ctx.db
      .query("actionPlans")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", userId).eq("careerId", args.careerId)
      )
      .first();

    if (existing) {
      // Update existing plan
      await ctx.db.patch(existing._id, {
        phases: args.phases,
        tasks: args.tasks,
        videos: args.videos,
        detailedPlan: args.detailedPlan,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    } else {
      // Create new plan
      const planId = await ctx.db.insert("actionPlans", {
        userId,
        careerId: args.careerId,
        phases: args.phases,
        tasks: args.tasks,
        videos: args.videos,
        detailedPlan: args.detailedPlan,
        createdAt: Date.now(),
      });
      return await ctx.db.get(planId);
    }
  },
});

/**
 * Update task status within an action plan
 */
export const updateTaskStatus = mutation({
  args: {
    careerId: v.string(),
    taskId: v.string(),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const actionPlan = await ctx.db
      .query("actionPlans")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", identity.subject).eq("careerId", args.careerId)
      )
      .first();

    if (!actionPlan) {
      throw new Error("Action plan not found");
    }

    // Update the task status
    const updatedTasks = actionPlan.tasks.map((task: any) =>
      task.taskId === args.taskId ? { ...task, status: args.newStatus } : task
    );

    // Update phases based on task completion
    const updatedPhases = actionPlan.phases.map((phase: any) => {
      const phaseTasks = updatedTasks.filter((t: any) => t.phase === phase.phaseId);
      if (phaseTasks.length > 0) {
        const completed = phaseTasks.filter((t: any) => t.status === "completed").length;
        const completionRate = completed / phaseTasks.length;

        if (completionRate >= 0.7) {
          return { ...phase, status: "completed" };
        } else if (completionRate > 0) {
          return { ...phase, status: "in-progress" };
        }
      }
      return phase;
    });

    // Unlock next phase if current phase is completed
    for (let i = 0; i < updatedPhases.length; i++) {
      if (updatedPhases[i].status === "completed" && i + 1 < updatedPhases.length) {
        if (updatedPhases[i + 1].status === "locked") {
          updatedPhases[i + 1] = { ...updatedPhases[i + 1], status: "unlocked" };
        }
      }
    }

    await ctx.db.patch(actionPlan._id, {
      tasks: updatedTasks,
      phases: updatedPhases,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(actionPlan._id);
  },
});
