"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Volume2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
}

export function VoiceChat() {
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textToSpeech = useAction(api.voice.textToSpeech);
  const getVoices = useAction(api.voice.getVoices);
  const checkHealth = useAction(api.spoonos.checkPythonBackendHealth);

  const handleLoadVoices = async () => {
    setLoadingVoices(true);
    try {
      const voiceList = await getVoices({});
      setVoices(voiceList);
      toast.success(`Loaded ${voiceList.length} voices`);
    } catch (error) {
      toast.error("Failed to load voices. Make sure Python backend is running.");
      console.error("Load voices error:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleCheckHealth = async () => {
    try {
      const health = await checkHealth({});
      if (health.status === "healthy") {
        toast.success(
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Python Backend Healthy ✓</div>
            <div className="text-sm text-muted-foreground">
              ElevenLabs: {health.elevenLabsConfigured ? "✓" : "✗"} |
              Spoon OS: {health.spoonosConfigured ? "✓" : "✗"}
            </div>
          </div>
        );
      } else {
        toast.error(`Backend Status: ${health.status}`);
      }
    } catch (error) {
      toast.error("Python backend is not reachable. Make sure it's running on port 8000.");
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
      const result = await textToSpeech({
        text: text.trim(),
        voiceId: selectedVoiceId,
      });

      // Convert base64 to audio and play
      const audioBlob = base64ToBlob(result.audioBase64, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }

      toast.success(`Generated speech for ${result.characterCount} characters`);
    } catch (error) {
      toast.error("Failed to generate speech. Check Python backend is running.");
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
          Voice Chat
        </CardTitle>
        <CardDescription>
          Convert text to speech using ElevenLabs AI voices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Check */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckHealth}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Check Backend Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadVoices}
            disabled={loadingVoices}
          >
            {loadingVoices ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            Load Voices
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
              {voices.length > 0 ? (
                voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category})
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="21m00Tcm4TlvDq8ikWAM">
                    Rachel (Default)
                  </SelectItem>
                  <SelectItem value="EXAVITQu4vr4xnSDxMaL">
                    Bella
                  </SelectItem>
                  <SelectItem value="ErXwobaYiN019PkySvjV">
                    Antoni
                  </SelectItem>
                </>
              )}
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
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          className="w-full"
        />

        {/* Info Alert */}
        <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Start Python backend: <code className="bg-background px-1 rounded">cd python-backend && python main.py</code></li>
              <li>Add your ElevenLabs API key to <code className="bg-background px-1 rounded">python-backend/.env</code></li>
              <li>Click "Check Backend Status" to verify connection</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
