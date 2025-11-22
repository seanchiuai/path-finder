"use client";

import { VoiceChatDirect } from "@/components/features/voice-chat-direct";

export default function VoiceDemoDirectPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Chat Demo (Direct)</h1>
        <p className="text-muted-foreground">
          Test ElevenLabs integration with direct Python backend connection (local testing)
        </p>
      </div>
      <VoiceChatDirect />
    </div>
  );
}
