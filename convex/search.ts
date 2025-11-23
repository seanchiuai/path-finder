import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to get authenticated user ID
 */
async function getUserId(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

/**
 * Search saved careers using vector embeddings
 */
export const searchSavedCareers = query({
  args: {
    embedding: v.array(v.float64()),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = args.limit ?? 10;

    // If projectId provided, fetch folders first for filtering
    if (args.projectId !== undefined) {
      const folders = await ctx.db
        .query("folders")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
        .collect();

      const folderIds = new Set(folders.map((f) => f._id));

      // Fetch more results initially since we'll filter, then slice to limit
      const initialLimit = limit * 2;
      const allResults = await ctx.db
        .query("savedCareers")
        .withSearchIndex("by_embedding", (q) =>
          q.search("embedding", args.embedding as any).eq("userId", userId)
        )
        .take(initialLimit);

      // Filter by project folders and slice to original limit
      return allResults
        .filter((b) => folderIds.has(b.folderId))
        .slice(0, limit);
    }

    // No projectId filter - search normally
    return await ctx.db
      .query("savedCareers")
      .withSearchIndex("by_embedding", (q) =>
        q.search("embedding", args.embedding as any).eq("userId", userId)
      )
      .take(limit);
  },
});

/**
 * Search saved careers within a specific folder using vector embeddings
 */
export const searchSavedCareersInFolder = query({
  args: {
    embedding: v.array(v.float64()),
    folderId: v.id("folders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    return await ctx.db
      .query("savedCareers")
      .withSearchIndex("by_embedding", (q) =>
        q
          .search("embedding", args.embedding as any)
          .eq("userId", userId)
          .eq("folderId", args.folderId)
      )
      .take(args.limit ?? 10);
  },
});
