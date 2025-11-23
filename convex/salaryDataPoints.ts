import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get salary data points for a role and industry
 */
export const getSalaryDataPoints = query({
  args: {
    role: v.string(),
    industry: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salaryDataPoints")
      .withIndex("by_role_industry", (q) => q.eq("role", args.role).eq("industry", args.industry))
      .collect();
  },
});

/**
 * Create salary data point
 */
export const createSalaryDataPoint = mutation({
  args: {
    role: v.string(),
    industry: v.string(),
    percentile: v.number(),
    salaryRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    avgYearsExperience: v.number(),
    commonCertifications: v.array(v.string()),
    exampleCompanies: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const dataPointId = await ctx.db.insert("salaryDataPoints", {
      role: args.role,
      industry: args.industry,
      percentile: args.percentile,
      salaryRange: args.salaryRange,
      avgYearsExperience: args.avgYearsExperience,
      commonCertifications: args.commonCertifications,
      exampleCompanies: args.exampleCompanies,
    });

    return await ctx.db.get(dataPointId);
  },
});