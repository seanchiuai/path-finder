import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Initialize default project and folder for new users
 * This should be called once when a user first logs in
 */
export const initializeUserDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already has a "Main" project (name-specific check to prevent races)
    const existingMainProject = await ctx.db
      .query("projects")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", "Main")
      )
      .first();

    if (existingMainProject) {
      // User already has Main project, skip initialization
      return {
        initialized: false,
        message: "Main project already exists",
        projectId: existingMainProject._id
      };
    }

    const now = Date.now();

    // Create default "Main" project
    let projectId;
    try {
      projectId = await ctx.db.insert("projects", {
        userId: identity.subject,
        name: "Main",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // If insert fails due to concurrent creation, query again and return existing
      const mainProject = await ctx.db
        .query("projects")
        .withIndex("by_user_name", (q) =>
          q.eq("userId", identity.subject).eq("name", "Main")
        )
        .first();

      if (mainProject) {
        return {
          initialized: false,
          message: "Main project was created concurrently",
          projectId: mainProject._id
        };
      }
      throw error;
    }

    // Create default "Uncategorized" folder
    await ctx.db.insert("folders", {
      projectId,
      parentFolderId: undefined,
      name: "Uncategorized",
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return {
      initialized: true,
      message: "Default project and folder created",
      projectId
    };
  },
});
