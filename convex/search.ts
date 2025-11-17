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
 * Search bookmarks using vector embeddings
 */
export const searchBookmarks = query({
  args: {
    embedding: v.array(v.float64()),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = args.limit ?? 10;

    // Search by embedding
    let results = await ctx.db
      .query("bookmarks")
      .withSearchIndex("by_embedding", (q) =>
        q.search("embedding", args.embedding).eq("userId", userId)
      )
      .take(limit);

    // If projectId provided, filter to that project's folders
    if (args.projectId) {
      const folders = await ctx.db
        .query("folders")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      const folderIds = new Set(folders.map((f) => f._id));
      results = results.filter((b) => folderIds.has(b.folderId));
    }

    return results;
  },
});

/**
 * Search bookmarks within a specific folder using vector embeddings
 */
export const searchBookmarksInFolder = query({
  args: {
    embedding: v.array(v.float64()),
    folderId: v.id("folders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    return await ctx.db
      .query("bookmarks")
      .withSearchIndex("by_embedding", (q) =>
        q
          .search("embedding", args.embedding)
          .eq("userId", userId)
          .eq("folderId", args.folderId)
      )
      .take(args.limit ?? 10);
  },
});
