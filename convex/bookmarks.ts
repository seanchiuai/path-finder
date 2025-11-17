import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Helper to get authenticated user ID
 */
async function getUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

/**
 * Get a single bookmark by ID
 */
export const getBookmark = query({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const bookmark = await ctx.db.get(args.bookmarkId);

    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found or unauthorized");
    }

    return bookmark;
  },
});

/**
 * List all bookmarks in a folder
 */
export const listBookmarksInFolder = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

/**
 * List all bookmarks for a user that don't have embeddings
 */
export const listBookmarksWithoutEmbeddings = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("embedding"), undefined))
      .collect();
  },
});

/**
 * Create a new bookmark
 */
export const createBookmark = mutation({
  args: {
    folderId: v.id("folders"),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    previewImageId: v.optional(v.id("_storage")),
    faviconId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Verify folder exists and belongs to user
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or unauthorized");
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      folderId: args.folderId,
      userId,
      url: args.url,
      title: args.title,
      description: args.description,
      previewImageId: args.previewImageId,
      faviconId: args.faviconId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return bookmarkId;
  },
});

/**
 * Update bookmark embedding
 */
export const updateBookmarkEmbedding = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found or unauthorized");
    }

    await ctx.db.patch(args.bookmarkId, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update bookmark details
 */
export const updateBookmark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found or unauthorized");
    }

    // If moving to new folder, verify it exists and belongs to user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error("Folder not found or unauthorized");
      }
    }

    const updates: Partial<Doc<"bookmarks">> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.folderId !== undefined) updates.folderId = args.folderId;

    await ctx.db.patch(args.bookmarkId, updates);
  },
});

/**
 * Delete a bookmark
 */
export const deleteBookmark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const bookmark = await ctx.db.get(args.bookmarkId);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found or unauthorized");
    }

    await ctx.db.delete(args.bookmarkId);
  },
});
