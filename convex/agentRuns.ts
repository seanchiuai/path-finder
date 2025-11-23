import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log agent run
 */
export const logAgentRun = mutation({
  args: {
    orchestratorSessionId: v.string(),
    agentName: v.string(),
    input: v.any(),
    output: v.any(),
    status: v.union(v.literal("success"), v.literal("failure"), v.literal("in_progress")),
    errorMessage: v.optional(v.string()),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const agentRunId = await ctx.db.insert("agentRuns", {
      userId: identity.subject,
      orchestratorSessionId: args.orchestratorSessionId,
      agentName: args.agentName,
      input: args.input,
      output: args.output,
      status: args.status,
      errorMessage: args.errorMessage,
      durationMs: args.durationMs,
      createdAt: Date.now(),
    });

    return await ctx.db.get(agentRunId);
  },
});

/**
 * Get agent runs for current user
 */
export const getAgentRuns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("agentRuns")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/**
 * Get agent runs for a specific orchestrator session
 */
export const getAgentRunsBySession = query({
  args: {
    orchestratorSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("agentRuns")
      .withIndex("by_orchestratorSessionId", (q) => q.eq("orchestratorSessionId", args.orchestratorSessionId))
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .order("desc")
      .collect();
  },
});