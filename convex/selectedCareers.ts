import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all selected careers for the current user (max 1)
 */
export const getSelectedCareers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("selectedCareers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/**
 * Get active selected careers (not abandoned or completed)
 */
export const getActiveSelectedCareers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("selectedCareers")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", identity.subject).eq("status", "active")
      )
      .collect();
  },
});

/**
 * Select careers for action plan generation (max 1)
 */
export const selectCareers = mutation({
  args: {
    careerIds: v.array(v.string()),
    careers: v.array(
      v.object({
        careerId: v.string(),
        careerName: v.string(),
        industry: v.string(),
        fitScore: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (args.careerIds.length > 1) {
      throw new Error("Maximum 1 career can be selected");
    }

    const userId = identity.subject;

    // Check if user already has 1 active career
    const existingCareers = await ctx.db
      .query("selectedCareers")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .collect();

    if (existingCareers.length + args.careers.length > 1) {
      throw new Error("Cannot select more than 1 active career");
    }

    const selectedIds = [];
    for (const career of args.careers) {
      const id = await ctx.db.insert("selectedCareers", {
        userId,
        careerId: career.careerId,
        careerName: career.careerName,
        industry: career.industry,
        fitScore: career.fitScore,
        selectedAt: Date.now(),
        status: "active",
      });
      selectedIds.push(id);
    }

    return selectedIds;
  },
});

/**
 * Update career status (active, completed, abandoned)
 */
export const updateCareerStatus = mutation({
  args: {
    careerId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const career = await ctx.db
      .query("selectedCareers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("careerId"), args.careerId))
      .first();

    if (!career) {
      throw new Error("Career not found");
    }

    await ctx.db.patch(career._id, {
      status: args.status,
    });

    return career._id;
  },
});

/**
 * Remove a selected career
 */
export const removeSelectedCareer = mutation({
  args: {
    careerId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const career = await ctx.db
      .query("selectedCareers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("careerId"), args.careerId))
      .first();

    if (!career) {
      throw new Error("Career not found");
    }

    await ctx.db.delete(career._id);

    return { success: true };
  },
});
