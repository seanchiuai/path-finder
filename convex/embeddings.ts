import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { api } from "./_generated/api";
import { encoding_for_model } from "tiktoken";
import type { Doc } from "./_generated/dataModel";

const MAX_TOKENS = 8192; // Token limit for text-embedding-3-small

/**
 * Truncate text to fit within token limit
 */
function truncateToTokenLimit(text: string): string {
  const encoder = encoding_for_model("text-embedding-3-small");
  const tokens = encoder.encode(text);

  if (tokens.length <= MAX_TOKENS) {
    encoder.free();
    return text;
  }

  // Truncate to max tokens
  const truncatedTokens = tokens.slice(0, MAX_TOKENS);
  const decoded = encoder.decode(truncatedTokens);
  encoder.free();

  // Convert Uint8Array to string if needed
  const truncatedText = typeof decoded === "string" ? decoded : new TextDecoder().decode(decoded);
  return truncatedText;
}

/**
 * Generate embedding for text using OpenAI's text-embedding-3-small model
 */
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, { text }): Promise<number[]> => {
    // Authorization check - ensure authenticated or service context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authorized to generate embeddings");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
      apiKey,
    });

    try {
      const truncatedText = truncateToTokenLimit(text);
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: truncatedText,
      });

      const embedding = response.data[0].embedding;

      // Validate embedding length
      if (embedding.length !== 1536) {
        throw new Error(`Invalid embedding length from OpenAI: expected 1536, got ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  },
});

/**
 * Type guard to check if error has status property
 */
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && "status" in error;
}

/**
 * Type guard to check if error has code property
 */
function hasCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  // Check HTTP status codes
  if (hasStatus(error)) {
    const status = error.status;
    // Retry on rate limits and server errors
    if (status === 429 || status === 500 || status === 502 || status === 503) {
      return true;
    }
  }

  // Check network error codes
  if (hasCode(error)) {
    const code = error.code;
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
      return true;
    }
  }

  return false;
}

/**
 * Retry function with exponential backoff and jitter for rate limits and transient errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isLastAttempt = i === maxRetries - 1;

      if (!isRetryableError(error) || isLastAttempt) {
        throw error;
      }

      // Exponential backoff with jitter: base delay * 2^i + random jitter
      const baseDelay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, 8s, 16s
      const jitter = Math.random() * 1000; // 0-1s random jitter
      const delay = baseDelay + jitter;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to throw in last iteration
  throw new Error("Max retries exceeded");
}

/**
 * Generate embedding and update bookmark
 */
export const generateSavedCareerEmbedding = action({
  args: {
    savedCareerId: v.id("savedCareers"),
  },
  handler: async (ctx, { savedCareerId }): Promise<void> => {
    // Get saved career
    const savedCareer = await ctx.runQuery(api.savedCareers.getSavedCareer, {
      savedCareerId,
    });

    if (!savedCareer) throw new Error("Saved career not found");

    // Create text to embed
    const textToEmbed = [
      savedCareer.careerName,
      savedCareer.industry,
      `Match Score: ${savedCareer.matchScore}`,
      savedCareer.matchExplanation,
    ]
      .filter(Boolean)
      .join("\n");

    // Generate embedding with retry logic
    const embedding = await retryWithBackoff(() =>
      ctx.runAction(api.embeddings.generateEmbedding, { text: textToEmbed })
    );

    // Update saved career with embedding
    await ctx.runMutation(api.savedCareers.updateSavedCareerEmbedding, {
      savedCareerId,
      embedding,
    });
  },
});

/**
 * Batch generate embeddings for saved careers without embeddings
 * Processes saved careers in concurrent batches with rate limiting
 */
export const batchGenerateSavedCareerEmbeddings = action({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 100 }): Promise<{ success: number; failed: string[] }> => {
    // Get all saved careers without embeddings
    const allSavedCareers = await ctx.runQuery(
      api.savedCareers.listSavedCareersWithoutEmbeddings,
      { userId }
    );

    // Limit number of saved careers to process
    const savedCareers: Doc<"savedCareers">[] = allSavedCareers.slice(0, limit);

    let successCount = 0;
    const failedIds: string[] = [];

    // Process in batches of 3 for concurrent processing
    const BATCH_SIZE = 3;
    const BATCH_DELAY = 1000; // 1s delay between batches

    for (let i = 0; i < savedCareers.length; i += BATCH_SIZE) {
      const batch: Doc<"savedCareers">[] = savedCareers.slice(i, i + BATCH_SIZE);

      // Process batch concurrently
      const results = await Promise.allSettled(
        batch.map((savedCareer: Doc<"savedCareers">) =>
          ctx.runAction(api.embeddings.generateSavedCareerEmbedding, {
            savedCareerId: savedCareer._id,
          })
        )
      );

      // Track success/failure
      results.forEach((result: PromiseSettledResult<unknown>, index: number) => {
        const savedCareerId = batch[index]._id;
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          failedIds.push(savedCareerId);
          console.error(`Failed to generate embedding for ${savedCareerId}:`, result.reason);
        }
      });

      // Add delay between batches (except after last batch)
      if (i + BATCH_SIZE < savedCareers.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    return { success: successCount, failed: failedIds };
  },
});
