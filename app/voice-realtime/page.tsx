"use client";

import App from "./App";
import { EventProvider } from "@/contexts/realtime/EventContext";
import { TranscriptProvider } from "@/contexts/realtime/TranscriptContext";

export default function VoiceRealtimePage() {
  return (
    <EventProvider>
      <TranscriptProvider>
        <App />
      </TranscriptProvider>
    </EventProvider>
  );
}
