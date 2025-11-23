import { action } from "./_generated/server";
import { v } from "convex/values";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

/**
 * Process data using Spoon OS via Python backend
 */
export const processWithSpoonOS = action({
  args: {
    operation: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    try {
      const response = await fetch(`${PYTHON_API_URL}/api/spoonos/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: args.operation,
          data: args.data,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Spoon OS processing failed: ${error}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error("Spoon OS error:", error);
      throw new Error(`Failed to process with Spoon OS: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Health check for Python backend
 */
export const checkPythonBackendHealth = action({
  args: {},
  handler: async () => {
    try {
      const response = await fetch(`${PYTHON_API_URL}/health`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Python backend unhealthy");
      }

      const data = await response.json();
      return {
        status: data.status,
        elevenLabsConfigured: data.elevenlabs_configured,
        spoonosConfigured: data.spoonos_configured,
        version: data.version,
        url: PYTHON_API_URL,
      };
    } catch (error) {
      console.error("Python backend health check failed:", error);
      return {
        status: "unreachable",
        elevenLabsConfigured: false,
        spoonosConfigured: false,
        version: "unknown",
        url: PYTHON_API_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
