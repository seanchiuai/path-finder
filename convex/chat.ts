import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { api } from "./_generated/api";

// Configurable OpenAI parameters with validation
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 400;

// Validate and parse OPENAI_MODEL
let OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
if (!OPENAI_MODEL) {
  console.warn("OPENAI_MODEL is empty, using default:", DEFAULT_MODEL);
  OPENAI_MODEL = DEFAULT_MODEL;
}

// Validate and parse CHAT_TEMPERATURE
let CHAT_TEMPERATURE = parseFloat(process.env.CHAT_TEMPERATURE || String(DEFAULT_TEMPERATURE));
if (!Number.isFinite(CHAT_TEMPERATURE) || CHAT_TEMPERATURE < 0.0 || CHAT_TEMPERATURE > 2.0) {
  console.warn(`Invalid CHAT_TEMPERATURE (${process.env.CHAT_TEMPERATURE}), using default:`, DEFAULT_TEMPERATURE);
  CHAT_TEMPERATURE = DEFAULT_TEMPERATURE;
}

// Validate and parse CHAT_MAX_TOKENS
let CHAT_MAX_TOKENS = parseInt(process.env.CHAT_MAX_TOKENS || String(DEFAULT_MAX_TOKENS), 10);
if (!Number.isInteger(CHAT_MAX_TOKENS) || CHAT_MAX_TOKENS < 1 || CHAT_MAX_TOKENS > 32768) {
  console.warn(`Invalid CHAT_MAX_TOKENS (${process.env.CHAT_MAX_TOKENS}), using default:`, DEFAULT_MAX_TOKENS);
  CHAT_MAX_TOKENS = DEFAULT_MAX_TOKENS;
}

// Type guard for OpenAI errors
function isOpenAIError(e: unknown): e is { status?: number; message?: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    ("status" in e || "message" in e)
  );
}

// Sanitize memory value to prevent formatting issues while preserving Unicode
function sanitizeMemoryValue(value: string): string {
  return value
    .replace(/[\n\r\t]+/g, " ") // Replace newlines/tabs with space
    .replace(/[\p{C}]/gu, "") // Remove Unicode control characters only
    .trim()
    .slice(0, 500); // Truncate to max 500 chars
}

export const getChatResponse = action({
  args: {
    userMessage: v.string(),
    projectId: v.optional(v.string()),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    bookmarkIds: string[];
  }> => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    // Validate OpenAI API key early
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get user memory/preferences
    const userMemories = await ctx.runQuery(api.memory.getUserMemories);

    // Build context with sanitized memory values
    const memoriesContext = userMemories
      .map((m) => `${m.key}: ${sanitizeMemoryValue(m.value)}`)
      .join("\n");

    // System prompt (simplified without bookmark context for now)
    const systemPrompt = `You are a helpful AI assistant for a bookmark manager. Your job is to help users find and organize their saved bookmarks.

User's saved interests and preferences:
${memoriesContext || "None yet"}

Guidelines:
- Be concise and friendly (2-3 sentences max)
- If you notice patterns in user interests, you can suggest new memories to save
- Help users organize their thoughts and bookmarks`;

    // Get GPT response
    let response: string;
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...(args.conversationHistory || []).slice(-10), // Last 10 messages
          { role: "user", content: args.userMessage },
        ],
        temperature: CHAT_TEMPERATURE,
        max_tokens: CHAT_MAX_TOKENS,
      });

      response = completion.choices[0].message.content || "I couldn't generate a response.";
    } catch (error: unknown) {
      if (isOpenAIError(error)) {
        if (error.status === 429) {
          response = "I'm a bit overloaded right now. Please try again in a moment.";
        } else if (error.status === 401) {
          response = "Authentication error. Please contact support.";
        } else {
          response = `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please try again.`;
        }
      } else {
        response = "Sorry, I encountered an error. Please try again.";
      }
    }

    // Save chat messages
    await ctx.runMutation(api.chatMessages.saveMessage, {
      role: "user",
      content: args.userMessage,
      projectId: args.projectId,
    });

    await ctx.runMutation(api.chatMessages.saveMessage, {
      role: "assistant",
      content: response,
      projectId: args.projectId,
    });

    // TODO: Implement RAG bookmark search
    // 1. Generate embedding for user query using OpenAI embeddings API
    // 2. Search bookmarks table using vector similarity (requires embeddings table)
    // 3. Score candidates by cosine similarity
    // 4. Return top-N (e.g., 5) most relevant bookmark IDs
    // 5. Include bookmark context in system prompt for better responses
    const bookmarkIds: string[] = [];

    return {
      response,
      bookmarkIds,
    };
  },
});
