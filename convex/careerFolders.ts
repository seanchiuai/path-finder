import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

const MAX_FOLDER_DEPTH = 5;

// Helper to calculate folder depth with cycle detection
async function getFolderDepth(
  ctx: QueryCtx | MutationCtx,
  folderId: Id<"folders"> | undefined
): Promise<number> {
  if (!folderId) return 0;

  const visited = new Set<string>();
  let currentId: Id<"folders"> | undefined = folderId;
  let depth = 0;

  while (currentId && depth < MAX_FOLDER_DEPTH) {
    if (visited.has(currentId)) {
      // Cycle detected
      throw new Error("Circular folder reference detected");
    }

    visited.add(currentId);
    const folder: Doc<"folders"> | null = await ctx.db.get(currentId);

    if (!folder) break;

    depth++;
    currentId = folder.parentFolderId;
  }

  // If currentId is still set, we hit the depth limit
  if (currentId) {
    throw new Error("Folder depth exceeds maximum limit");
  }

  return depth;
}

// Helper to check if moving would create a circular reference
async function wouldCreateCircularReference(
  ctx: QueryCtx | MutationCtx,
  folderId: Id<"folders">,
  newParentId: Id<"folders"> | undefined
): Promise<boolean> {
  if (!newParentId) return false;
  if (folderId === newParentId) return true;

  const visited = new Set<string>();
  // Safety buffer: 10x the expected folder depth to catch corrupted data without masking issues
  const maxDepth = MAX_FOLDER_DEPTH * 10;
  let depth = 0;
  let currentParent = await ctx.db.get(newParentId);

  while (currentParent && depth < maxDepth) {
    // Check if we've seen this ID before (cycle detected)
    if (visited.has(currentParent._id)) {
      return true; // Existing cycle in newParent chain
    }

    if (currentParent._id === folderId) return true;

    visited.add(currentParent._id);
    depth++;

    if (!currentParent.parentFolderId) break;
    currentParent = await ctx.db.get(currentParent.parentFolderId);
  }

  if (depth >= maxDepth) {
    return true; // Potential cycle or too deep
  }

  return false;
}

// Helper to build folder tree structure
interface FolderNode extends Doc<"folders"> {
  children: FolderNode[];
  bookmarkCount: number;
}

async function buildFolderTree(
  ctx: QueryCtx | MutationCtx,
  folders: Doc<"folders">[],
  userId: string
): Promise<FolderNode[]> {
  const folderMap = new Map<Id<"folders">, FolderNode>();

  // Fetch all saved careers for this user in a single query
  const allSavedCareers = await ctx.db
    .query("savedCareers")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();

  // Build a map counting saved careers per folder
  const savedCareerCountByFolder = new Map<Id<"folders">, number>();
  for (const savedCareer of allSavedCareers) {
    const count = savedCareerCountByFolder.get(savedCareer.folderId) || 0;
    savedCareerCountByFolder.set(savedCareer.folderId, count + 1);
  }

  // Initialize all folders with children array using the count map
  for (const folder of folders) {
    folderMap.set(folder._id, {
      ...folder,
      children: [],
      bookmarkCount: savedCareerCountByFolder.get(folder._id) || 0,
    });
  }

  // Build tree structure
  const rootFolders: FolderNode[] = [];

  for (const folder of folders) {
    const node = folderMap.get(folder._id)!;

    if (folder.parentFolderId) {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphaned folder, treat as root
        rootFolders.push(node);
      }
    } else {
      rootFolders.push(node);
    }
  }

  return rootFolders;
}

// Get all folders in a project as a tree structure
export const listFoldersInProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify project access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return await buildFolderTree(ctx, folders, identity.subject);
  },
});

// Get default folder for a project (creates one if none exists)
export const getDefaultFolder = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify project access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Get the first folder in the project, or create a default one
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (folders.length > 0) {
      return folders[0]; // Return first folder
    }

    // Create a default folder if none exists
    const defaultFolderId = await ctx.db.insert("folders", {
      projectId: args.projectId,
      name: "My Careers",
      userId: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(defaultFolderId);
  },
});

// Get a single folder with auth check
export const getFolder = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== identity.subject) {
      throw new Error("Folder not found or unauthorized");
    }

    return folder;
  },
});

// Get breadcrumb path from root to folder
export const getFolderPath = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== identity.subject) {
      throw new Error("Folder not found or unauthorized");
    }

    const path: Doc<"folders">[] = [folder];
    let currentFolder = folder;
    const maxDepth = 100; // Safety limit to prevent infinite loops
    let depth = 0;

    while (currentFolder.parentFolderId && depth < maxDepth) {
      const parent = await ctx.db.get(currentFolder.parentFolderId);
      if (!parent) break;
      path.unshift(parent);
      currentFolder = parent;
      depth++;
    }

    if (depth >= maxDepth) {
      throw new Error("Folder path exceeded maximum depth - possible circular reference");
    }

    return path;
  },
});

// Create a new folder
export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify project access
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found or unauthorized");
    }

    // Validate name
    if (args.name.trim().length === 0) {
      throw new Error("Folder name cannot be empty");
    }
    if (args.name.length > 100) {
      throw new Error("Folder name must be 100 characters or less");
    }

    // Verify parent folder if specified
    if (args.parentFolderId) {
      const parentFolder = await ctx.db.get(args.parentFolderId);
      if (!parentFolder || parentFolder.userId !== identity.subject) {
        throw new Error("Parent folder not found or unauthorized");
      }
      if (parentFolder.projectId !== args.projectId) {
        throw new Error("Parent folder must be in the same project");
      }

      // Check depth limit
      const depth = await getFolderDepth(ctx, args.parentFolderId);
      if (depth >= MAX_FOLDER_DEPTH) {
        throw new Error(`Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`);
      }
    }

    // Trim name once and reuse
    const trimmedName = args.name.trim();

    // Check for duplicate name in the same parent using efficient index query
    const siblingFolders = await ctx.db
      .query("folders")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentFolderId", args.parentFolderId)
      )
      .collect();

    const hasDuplicate = siblingFolders.some((f) => f.name === trimmedName);

    if (hasDuplicate) {
      throw new Error("A folder with this name already exists in this location");
    }

    const now = Date.now();
    const folderId = await ctx.db.insert("folders", {
      projectId: args.projectId,
      parentFolderId: args.parentFolderId,
      name: trimmedName,
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return folderId;
  },
});

// Update a folder (rename)
export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== identity.subject) {
      throw new Error("Folder not found or unauthorized");
    }

    // Validate name
    const trimmedName = args.name.trim();
    if (trimmedName.length === 0) {
      throw new Error("Folder name cannot be empty");
    }
    if (trimmedName.length > 100) {
      throw new Error("Folder name must be 100 characters or less");
    }

    // Check for duplicate name in the same parent using efficient index query
    const siblingFolders = await ctx.db
      .query("folders")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", folder.projectId).eq("parentFolderId", folder.parentFolderId)
      )
      .collect();

    const hasDuplicate = siblingFolders.some(
      (f) => f.name === trimmedName && f._id !== args.folderId
    );

    if (hasDuplicate) {
      throw new Error("A folder with this name already exists in this location");
    }

    await ctx.db.patch(args.folderId, {
      name: trimmedName,
      updatedAt: Date.now(),
    });
  },
});

// Move a folder to a different parent
export const moveFolder = mutation({
  args: {
    folderId: v.id("folders"),
    newParentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== identity.subject) {
      throw new Error("Folder not found or unauthorized");
    }

    // Check for duplicate name in destination
    const siblingFolders = await ctx.db
      .query("folders")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", folder.projectId).eq("parentFolderId", args.newParentFolderId)
      )
      .collect();

    const hasDuplicate = siblingFolders.some(
      (f) => f.name === folder.name && f._id !== args.folderId
    );

    if (hasDuplicate) {
      throw new Error("A folder with this name already exists in the destination");
    }

    // Verify new parent if specified
    if (args.newParentFolderId) {
      const newParent = await ctx.db.get(args.newParentFolderId);
      if (!newParent || newParent.userId !== identity.subject) {
        throw new Error("New parent folder not found or unauthorized");
      }
      if (newParent.projectId !== folder.projectId) {
        throw new Error("Cannot move folder to a different project");
      }

      // Check for circular reference
      const wouldBeCircular = await wouldCreateCircularReference(
        ctx,
        args.folderId,
        args.newParentFolderId
      );
      if (wouldBeCircular) {
        throw new Error("Cannot move a folder into one of its own subfolders");
      }

      // Check depth limit
      const newDepth = await getFolderDepth(ctx, args.newParentFolderId);
      const folderSubtreeDepth = await getSubtreeDepth(ctx, args.folderId);
      if (newDepth + folderSubtreeDepth > MAX_FOLDER_DEPTH) {
        throw new Error(`Move would exceed maximum folder depth of ${MAX_FOLDER_DEPTH}`);
      }
    }

    await ctx.db.patch(args.folderId, {
      parentFolderId: args.newParentFolderId,
      updatedAt: Date.now(),
    });
  },
});

// Helper to get the maximum depth of a folder's subtree with recursion guard
async function getSubtreeDepth(
  ctx: QueryCtx | MutationCtx,
  folderId: Id<"folders">,
  remainingDepth: number = MAX_FOLDER_DEPTH
): Promise<number> {
  if (remainingDepth <= 0) {
    throw new Error("Maximum folder depth exceeded during subtree calculation");
  }

  const children = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentFolderId", folderId))
    .collect();

  if (children.length === 0) return 1;

  let maxChildDepth = 0;
  for (const child of children) {
    const childDepth = await getSubtreeDepth(ctx, child._id, remainingDepth - 1);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return 1 + maxChildDepth;
}

// Delete a folder and all its children and bookmarks
export const deleteFolder = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== identity.subject) {
      throw new Error("Folder not found or unauthorized");
    }

    // Recursively delete all descendants
    await deleteFolderRecursive(ctx, args.folderId);
  },
});

// Helper to recursively delete folder and all its children
async function deleteFolderRecursive(
  ctx: MutationCtx,
  folderId: Id<"folders">,
  depth: number = 0
): Promise<void> {
  // Recursion guard to prevent infinite loops from corrupted data
  if (depth > MAX_FOLDER_DEPTH) {
    throw new Error("Folder deletion exceeded maximum depth - possible data corruption");
  }

  // Get all child folders
  const children = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentFolderId", folderId))
    .collect();

  // Recursively delete children
  for (const child of children) {
    await deleteFolderRecursive(ctx, child._id, depth + 1);
  }

  // Delete all saved careers in this folder
  const savedCareers = await ctx.db
    .query("savedCareers")
    .filter((q) => q.eq(q.field("folderId"), folderId))
    .collect();

  for (const savedCareer of savedCareers) {
    await ctx.db.delete(savedCareer._id);
  }

  // Delete the folder itself
  await ctx.db.delete(folderId);
}
