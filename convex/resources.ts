import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get resources for a role and type
 */
export const getResources = query({
  args: {
    role: v.string(),
    type: v.optional(v.union(
      v.literal("simulator"), v.literal("local_expert"), v.literal("online_expert"),
      v.literal("article"), v.literal("blog"), v.literal("video"), v.literal("try_on_own")
    )),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("resources")
        .withIndex("by_role_type", (q) => q.eq("role", args.role).eq("type", args.type!))
        .collect();
    } else {
      return await ctx.db
        .query("resources")
        .filter((q) => q.eq(q.field("role"), args.role))
        .collect();
    }
  },
});

/**
 * Create resource
 */
export const createResource = mutation({
  args: {
    role: v.string(),
    type: v.union(
      v.literal("simulator"), v.literal("local_expert"), v.literal("online_expert"),
      v.literal("article"), v.literal("blog"), v.literal("video"), v.literal("try_on_own")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    externalLink: v.optional(v.string()),
    metadata: v.optional(v.object({
      name: v.optional(v.string()),
      location: v.optional(v.string()),
      contact: v.optional(v.string()),
      availability: v.optional(v.string()),
      intro: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const resourceId = await ctx.db.insert("resources", {
      role: args.role,
      type: args.type,
      title: args.title,
      description: args.description,
      content: args.content,
      externalLink: args.externalLink,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return await ctx.db.get(resourceId);
  },
});