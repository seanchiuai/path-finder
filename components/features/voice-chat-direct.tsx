"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";

export function VoiceChatDirect() {
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleCheckHealth = async () => {
    try {
      const response = await fetch(`${PYTHON_API_URL}/health`);
      const health = await response.json();

      if (health.status === "healthy") {
        toast.success(
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Python Backend Healthy ✓</div>
            <div className="text-sm text-muted-foreground">
              ElevenLabs: {health.elevenlabs_configured ? "✓" : "✗"} |
              Spoon AI: {health.spoon_ai_available ? "✓" : "✗"}
            </div>
          </div>
        );
      } else {
        toast.error(`Backend Status: ${health.status}`);
      }
    } catch (error) {
      toast.error("Python backend not reachable. Make sure it's running on port 8000.");
      console.error("Health check error:", error);
    }
  };

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${PYTHON_API_URL}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoiceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();

      // Convert base64 to audio blob
      const audioBlob = base64ToBlob(result.audio_base64, "audio/mpeg");
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast.success(`Generated speech for ${result.character_count} characters`);
    } catch (error) {
      toast.error(`Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("TTS error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Chat (Direct to Python)
        </CardTitle>
        <CardDescription>
          Direct connection to Python backend for local testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Check */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCheckHealth}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Check Backend Status
          </Button>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice</label>
          <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Default)</SelectItem>
              <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella</SelectItem>
              <SelectItem value="ErXwobaYiN019PkySvjV">Antoni</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Text to Speak</label>
          <Textarea
            placeholder="Enter text to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={5000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {text.length} / 5000 characters
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateSpeech}
          disabled={isGenerating || !text.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Speech...
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Generate Speech
            </>
          )}
        </Button>

        {/* Audio Player */}
        {audioUrl && (
          <audio
            src={audioUrl}
            controls
            className="w-full"
            autoPlay
          />
        )}

        {/* Info Alert */}
        <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Direct Connection Mode</p>
            <p>This version connects directly to Python backend at: <code className="bg-background px-1 rounded">{PYTHON_API_URL}</code></p>
            <p>Make sure Python backend is running: <code className="bg-background px-1 rounded">cd python-backend && python main.py</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
