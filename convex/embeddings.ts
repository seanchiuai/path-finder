import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { api } from "./_generated/api";
import { encoding_for_model } from "tiktoken";

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
  const truncatedText = encoder.decode(truncatedTokens);
  encoder.free();

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

      return response.data[0].embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  },
});

/**
 * Retry function with exponential backoff for rate limits
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Generate embedding and update bookmark
 */
export const generateBookmarkEmbedding = action({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, { bookmarkId }): Promise<void> => {
    // Get bookmark
    const bookmark = await ctx.runQuery(api.bookmarks.getBookmark, {
      bookmarkId,
    });

    if (!bookmark) throw new Error("Bookmark not found");

    // Create text to embed
    const textToEmbed = [
      bookmark.title,
      bookmark.description || "",
      bookmark.url,
    ]
      .filter(Boolean)
      .join("\n");

    // Generate embedding with retry logic
    const embedding = await retryWithBackoff(() =>
      ctx.runAction(api.embeddings.generateEmbedding, { text: textToEmbed })
    );

    // Update bookmark with embedding
    await ctx.runMutation(api.bookmarks.updateBookmarkEmbedding, {
      bookmarkId,
      embedding,
    });
  },
});

/**
 * Batch generate embeddings for bookmarks without embeddings
 */
export const batchGenerateEmbeddings = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }): Promise<number> => {
    // Get all bookmarks without embeddings
    const bookmarks = await ctx.runQuery(
      api.bookmarks.listBookmarksWithoutEmbeddings,
      { userId }
    );

    let count = 0;
    for (const bookmark of bookmarks) {
      try {
        await ctx.runAction(api.embeddings.generateBookmarkEmbedding, { bookmarkId: bookmark._id });
        count++;
      } catch (error) {
        console.error(`Failed to generate embedding for ${bookmark._id}:`, error);
      }
    }

    return count;
  },
});
