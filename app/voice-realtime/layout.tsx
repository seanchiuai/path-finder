"use client";

import { Authenticated } from "convex/react";

export default function VoiceRealtimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticated>
      {children}
    </Authenticated>
  );
}
