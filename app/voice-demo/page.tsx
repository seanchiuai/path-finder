"use client";

import { VoiceChat } from "@/components/features/voice-chat";

export default function VoiceDemoPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Chat Demo</h1>
        <p className="text-muted-foreground">
          Test ElevenLabs text-to-speech integration via Python backend
        </p>
      </div>
      <VoiceChat />
    </div>
  );
}
