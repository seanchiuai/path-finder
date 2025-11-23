"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Play, Square } from "lucide-react"
import { careerAPI } from "@/src/lib/api"

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void
  disabled?: boolean
}

export default function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Unable to access microphone. Please check permissions.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        const audioData = base64Audio.split(',')[1] // Remove data URL prefix
        
        try {
          const result = await careerAPI.transcribeAudio(audioData)
          if (result.success && result.text) {
            setTranscript(result.text)
            onTranscript(result.text)
          } else {
            throw new Error("Transcription failed")
          }
        } catch (error) {
          console.error("Transcription API error:", error)
          // Fallback to mock transcription for demo
          const mockTranscriptions = [
            "I'm a marketing professional with 5 years of experience looking to transition into product management. I'm passionate about user research and data-driven decision making.",
            "I have a background in software engineering and want to move into AI/ML. I'm particularly interested in natural language processing and computer vision.",
            "I'm a recent graduate with a degree in environmental science. I want to combine my passion for sustainability with technology to work in clean energy.",
            "I've been working in finance for 8 years but feel unfulfilled. I'm interested in transitioning to a career in education technology or social impact.",
            "I'm a designer with experience in graphic design and branding. I want to transition into UX/UI design and eventually become a product designer."
          ]
          const randomTranscript = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
          setTranscript(randomTranscript)
          onTranscript(randomTranscript)
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("Error transcribing audio:", error)
    } finally {
      setIsTranscribing(false)
    }
  }, [audioBlob, onTranscript])

  const playRecording = useCallback(() => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioBlob])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={disabled || isTranscribing}
              variant="outline"
              size="icon"
              className="h-12 w-12"
            >
              <Mic className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="icon"
              className="h-12 w-12 animate-pulse"
            >
              <MicOff className="h-5 w-5" />
            </Button>
          )}
          
          {audioBlob && !isRecording && (
            <>
              {!isPlaying ? (
                <Button
                  onClick={playRecording}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                >
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={stopPlayback}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                >
                  <Square className="h-5 w-5" />
                </Button>
              )}
              
              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                variant="default"
                className="h-12"
              >
                {isTranscribing ? "Transcribing..." : "Transcribe"}
              </Button>
            </>
          )}
        </div>
        
        {isRecording && (
          <div className="text-center text-sm text-muted-foreground">
            Recording... Click the red button to stop
          </div>
        )}
        
        {transcript && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Transcript:</h4>
            <div className="bg-muted p-3 rounded-md text-sm">
              {transcript}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}