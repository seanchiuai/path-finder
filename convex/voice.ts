import { action } from "./_generated/server";
import { v } from "convex/values";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8001";

/**
 * Text-to-Speech using ElevenLabs via Python backend
 */
export const textToSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.optional(v.string()),
    stability: v.optional(v.number()),
    similarityBoost: v.optional(v.number()),
    style: v.optional(v.number()),
    useSpeakerBoost: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    try {
      const response = await fetch(`${PYTHON_API_URL}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: args.text,
          voice_id: args.voiceId || "21m00Tcm4TlvDq8ikWAM",
          stability: args.stability ?? 0.5,
          similarity_boost: args.similarityBoost ?? 0.75,
          style: args.style ?? 0.0,
          use_speaker_boost: args.useSpeakerBoost ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TTS failed: ${error}`);
      }

      const data = await response.json();
      return {
        audioBase64: data.audio_base64,
        characterCount: data.character_count,
        voiceId: data.voice_id,
      };
    } catch (error) {
      console.error("Text-to-speech error:", error);
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Get available ElevenLabs voices
 */
export const getVoices = action({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    try {
      const response = await fetch(`${PYTHON_API_URL}/api/voice/voices`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error("Get voices error:", error);
      throw new Error(`Failed to fetch voices: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Speech-to-Text (placeholder for now)
 */
export const speechToText = action({
  args: {
    audioBase64: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    try {
      const response = await fetch(`${PYTHON_API_URL}/api/voice/stt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_base64: args.audioBase64,
          model: args.model || "whisper-1",
        }),
      });

      if (!response.ok) {
        throw new Error("STT failed");
      }

      const data = await response.json();
      return {
        text: data.text,
        error: data.error,
      };
    } catch (error) {
      console.error("Speech-to-text error:", error);
      throw new Error(`Failed to transcribe speech: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});
