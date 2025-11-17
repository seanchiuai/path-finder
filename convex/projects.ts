import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all projects for the current user
export const listUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get a single project with auth check
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    return project;
  },
});

// Get the user's default project
export const getDefaultProject = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const defaultProject = await ctx.db
      .query("projects")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", identity.subject).eq("isDefault", true)
      )
      .first();

    return defaultProject;
  },
});

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Trim name once and reuse
    const trimmedName = args.name.trim();

    // Validate name length
    if (trimmedName.length === 0) {
      throw new Error("Project name cannot be empty");
    }
    if (trimmedName.length > 100) {
      throw new Error("Project name must be 100 characters or less");
    }

    // If setting as default, unset other default projects
    if (args.isDefault) {
      const currentDefault = await ctx.db
        .query("projects")
        .withIndex("by_user_default", (q) =>
          q.eq("userId", identity.subject).eq("isDefault", true)
        )
        .first();

      if (currentDefault) {
        await ctx.db.patch(currentDefault._id, { isDefault: false });
      }
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      userId: identity.subject,
      name: trimmedName,
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });

    // Post-insert validation: check for duplicate name
    const duplicateProjects = await ctx.db
      .query("projects")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", trimmedName)
      )
      .collect();

    // If we find more than one project with this name, we have a race condition
    if (duplicateProjects.length > 1) {
      // Delete the newly inserted project
      await ctx.db.delete(projectId);
      throw new Error("A project with this name already exists");
    }

    return projectId;
  },
});

// Update a project (rename)
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Trim name once and reuse
    const trimmedName = args.name.trim();

    // Validate name
    if (trimmedName.length === 0) {
      throw new Error("Project name cannot be empty");
    }
    if (trimmedName.length > 100) {
      throw new Error("Project name must be 100 characters or less");
    }

    // Store original name for potential rollback
    const originalName = project.name;

    // Perform the update
    await ctx.db.patch(args.projectId, {
      name: trimmedName,
      updatedAt: Date.now(),
    });

    // Post-update validation: check for duplicate name
    const duplicateProjects = await ctx.db
      .query("projects")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", trimmedName)
      )
      .collect();

    // If we find more than one project with this name, we have a duplicate
    if (duplicateProjects.length > 1) {
      // Rollback the change
      await ctx.db.patch(args.projectId, {
        name: originalName,
        updatedAt: Date.now(),
      });
      throw new Error("A project with this name already exists");
    }
  },
});

// Delete a project and all its folders/bookmarks
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Handle default project deletion
    if (project.isDefault) {
      // Find another project to promote
      const otherProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      const fallbackProject = otherProjects.find((p) => p._id !== args.projectId);

      if (!fallbackProject) {
        throw new Error(
          "Cannot delete the only project. Please create another project first."
        );
      }

      // Promote fallback project to default before deleting
      await ctx.db.patch(fallbackProject._id, { isDefault: true });
    }

    // Get all folders in this project
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Collect all bookmark IDs across all folders in parallel
    const bookmarksByFolder = await Promise.all(
      folders.map(async (folder) => {
        const bookmarks = await ctx.db
          .query("bookmarks")
          .withIndex("by_folder", (q) => q.eq("folderId", folder._id))
          .collect();
        return bookmarks;
      })
    );

    // Flatten and delete all bookmarks in parallel
    const allBookmarks = bookmarksByFolder.flat();
    await Promise.all(allBookmarks.map((bookmark) => ctx.db.delete(bookmark._id)));

    // Delete all folders in parallel
    await Promise.all(folders.map((folder) => ctx.db.delete(folder._id)));

    // Delete the project
    await ctx.db.delete(args.projectId);
  },
});

// Set a project as the default
export const setDefaultProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Unset current default
    const currentDefault = await ctx.db
      .query("projects")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", identity.subject).eq("isDefault", true)
      )
      .first();

    if (currentDefault && currentDefault._id !== args.projectId) {
      await ctx.db.patch(currentDefault._id, { isDefault: false });
    }

    // Set new default
    await ctx.db.patch(args.projectId, { isDefault: true });
  },
});
