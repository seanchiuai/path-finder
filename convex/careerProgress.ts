import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Calculate level from XP using Career Compass formula
 */
function calculateLevelFromXP(xp: number): number {
  // Simple formula: Level = floor(sqrt(xp / 100))
  // Level 1: 0-99 XP
  // Level 2: 100-399 XP
  // Level 3: 400-899 XP
  // Level 4: 900-1599 XP
  // etc.
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)));
}

/**
 * Calculate XP required for a specific level
 */
function calculateXPForLevel(level: number): number {
  // Inverse of the level formula: xp = level^2 * 100
  return level * level * 100;
}

/**
 * Get progress for all selected careers
 */
export const getAllProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("careerProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/**
 * Get progress for a specific career
 */
export const getCareerProgress = query({
  args: {
    careerId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("careerProgress")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", identity.subject).eq("careerId", args.careerId)
      )
      .first();
  },
});

/**
 * Initialize progress for a new selected career
 */
export const initializeProgress = mutation({
  args: {
    careerId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Check if progress already exists
    const existing = await ctx.db
      .query("careerProgress")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", userId).eq("careerId", args.careerId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new progress
    const progressId = await ctx.db.insert("careerProgress", {
      userId,
      careerId: args.careerId,
      xp: 0,
      level: 1,
      completionPercent: 0,
      streak: 0,
      tasksCompletedThisWeek: 0,
      xpToNextLevel: 100, // Level 2 requires 100 XP
      updatedAt: Date.now(),
    });

    return progressId;
  },
});

/**
 * Update task status and recalculate progress
 */
export const updateTaskProgress = mutation({
  args: {
    careerId: v.string(),
    taskId: v.string(),
    taskXP: v.number(),
    oldStatus: v.string(),
    newStatus: v.string(),
    totalTasks: v.number(),
    completedTasks: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Get current progress
    const progress = await ctx.db
      .query("careerProgress")
      .withIndex("by_userId_careerId", (q) =>
        q.eq("userId", userId).eq("careerId", args.careerId)
      )
      .first();

    if (!progress) {
      throw new Error("Progress not found for this career");
    }

    let newXP = progress.xp;
    let newStreak = progress.streak;
    let newTasksThisWeek = progress.tasksCompletedThisWeek;

    // Update XP based on status change
    if (args.newStatus === "completed" && args.oldStatus !== "completed") {
      // Task was just completed - add XP
      newXP += args.taskXP;
      newStreak += 1;
      newTasksThisWeek += 1;
    } else if (args.newStatus !== "completed" && args.oldStatus === "completed") {
      // Task was uncompleted - subtract XP
      newXP = Math.max(0, newXP - args.taskXP);
      newTasksThisWeek = Math.max(0, newTasksThisWeek - 1);
    }

    // Calculate new level and XP to next level
    const newLevel = calculateLevelFromXP(newXP);
    const nextLevelXP = calculateXPForLevel(newLevel + 1);
    const xpToNextLevel = nextLevelXP - newXP;

    // Calculate completion percent
    const completionPercent = args.totalTasks > 0
      ? Math.round((args.completedTasks / args.totalTasks) * 100)
      : 0;

    // Update progress
    await ctx.db.patch(progress._id, {
      xp: newXP,
      level: newLevel,
      completionPercent,
      streak: newStreak,
      tasksCompletedThisWeek: newTasksThisWeek,
      xpToNextLevel,
      lastTaskCompletedAt: args.newStatus === "completed" ? Date.now() : progress.lastTaskCompletedAt,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(progress._id);
  },
});

/**
 * Reset weekly task counter (to be called weekly)
 */
export const resetWeeklyTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const allProgress = await ctx.db
      .query("careerProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    await Promise.all(
      allProgress.map((progress) =>
        ctx.db.patch(progress._id, {
          tasksCompletedThisWeek: 0,
          updatedAt: Date.now(),
        })
      )
    );

    return { success: true, count: allProgress.length };
  },
});

/**
 * Get dashboard summary (total XP, longest streak, etc.)
 */
export const getDashboardSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const allProgress = await ctx.db
      .query("careerProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const totalXP = allProgress.reduce((sum, p) => sum + p.xp, 0);
    const longestStreak = Math.max(...allProgress.map((p) => p.streak), 0);
    const totalTasksThisWeek = allProgress.reduce((sum, p) => sum + p.tasksCompletedThisWeek, 0);

    return {
      totalXP,
      longestStreak,
      totalTasksThisWeek,
      careersInProgress: allProgress.length,
    };
  },
});
