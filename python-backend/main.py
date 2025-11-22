from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs
import io

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Path Finder Python Backend",
    description="Python microservice for ElevenLabs and Spoon OS integrations",
    version="1.0.0"
)

# CORS configuration - restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ElevenLabs client
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    logger.warning("ELEVENLABS_API_KEY not set - voice features will be disabled")
    elevenlabs_client = None
else:
    elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# Request/Response Models
class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    voice_id: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="ElevenLabs voice ID")
    model_id: str = Field(default="eleven_multilingual_v2", description="ElevenLabs model ID")
    stability: float = Field(default=0.5, ge=0.0, le=1.0, description="Voice stability")
    similarity_boost: float = Field(default=0.75, ge=0.0, le=1.0, description="Voice similarity boost")
    style: float = Field(default=0.0, ge=0.0, le=1.0, description="Voice style exaggeration")
    use_speaker_boost: bool = Field(default=True, description="Enable speaker boost")

class TextToSpeechResponse(BaseModel):
    audio_base64: Optional[str] = None
    error: Optional[str] = None
    character_count: int
    voice_id: str

class SpeechToTextRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio data")
    model: str = Field(default="whisper-1", description="Speech recognition model")

class SpeechToTextResponse(BaseModel):
    text: str
    error: Optional[str] = None

class SpoonOSProcessRequest(BaseModel):
    operation: str = Field(..., description="Operation type for Spoon OS")
    data: dict = Field(..., description="Data to process")

class SpoonOSProcessResponse(BaseModel):
    result: dict
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    elevenlabs_configured: bool
    spoonos_configured: bool
    version: str

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify service status"""
    return HealthResponse(
        status="healthy",
        elevenlabs_configured=ELEVENLABS_API_KEY is not None,
        spoonos_configured=os.getenv("SPOONOS_API_KEY") is not None,
        version="1.0.0"
    )

# ElevenLabs Text-to-Speech
@app.post("/api/voice/tts", response_model=TextToSpeechResponse)
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech using ElevenLabs API

    Returns audio as base64 encoded string for easy transport
    """
    if not elevenlabs_client:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API not configured. Set ELEVENLABS_API_KEY environment variable."
        )

    try:
        logger.info(f"Generating speech for {len(request.text)} characters with voice {request.voice_id}")

        # Generate audio
        audio_generator = elevenlabs_client.text_to_speech.convert(
            text=request.text,
            voice_id=request.voice_id,
            model_id=request.model_id,
            voice_settings=VoiceSettings(
                stability=request.stability,
                similarity_boost=request.similarity_boost,
                style=request.style,
                use_speaker_boost=request.use_speaker_boost,
            ),
        )

        # Collect audio bytes
        audio_bytes = b"".join(chunk for chunk in audio_generator)

        # Convert to base64 for JSON response
        import base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        logger.info(f"Successfully generated {len(audio_bytes)} bytes of audio")

        return TextToSpeechResponse(
            audio_base64=audio_base64,
            character_count=len(request.text),
            voice_id=request.voice_id
        )

    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text-to-speech generation failed: {str(e)}")

# ElevenLabs Text-to-Speech Streaming
@app.post("/api/voice/tts-stream")
async def text_to_speech_stream(request: TextToSpeechRequest):
    """
    Convert text to speech using ElevenLabs API with streaming response

    Returns audio stream directly for lower latency
    """
    if not elevenlabs_client:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API not configured"
        )

    try:
        logger.info(f"Streaming speech for {len(request.text)} characters")

        audio_generator = elevenlabs_client.text_to_speech.convert(
            text=request.text,
            voice_id=request.voice_id,
            model_id=request.model_id,
            voice_settings=VoiceSettings(
                stability=request.stability,
                similarity_boost=request.similarity_boost,
                style=request.style,
                use_speaker_boost=request.use_speaker_boost,
            ),
        )

        return StreamingResponse(
            audio_generator,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )

    except Exception as e:
        logger.error(f"TTS streaming error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

# Get available voices
@app.get("/api/voice/voices")
async def get_voices():
    """Get list of available ElevenLabs voices"""
    if not elevenlabs_client:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API not configured"
        )

    try:
        voices = elevenlabs_client.voices.get_all()
        return {
            "voices": [
                {
                    "voice_id": voice.voice_id,
                    "name": voice.name,
                    "category": voice.category,
                    "description": voice.description,
                }
                for voice in voices.voices
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching voices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")

# Speech-to-Text (using OpenAI Whisper via ElevenLabs or direct integration)
@app.post("/api/voice/stt", response_model=SpeechToTextResponse)
async def speech_to_text(request: SpeechToTextRequest):
    """
    Convert speech to text

    Note: This is a placeholder. You can integrate:
    - OpenAI Whisper API
    - ElevenLabs speech recognition (if available)
    - Google Speech-to-Text
    - Assembly AI
    """
    try:
        # Decode base64 audio
        import base64
        audio_bytes = base64.b64decode(request.audio_base64)

        # TODO: Implement actual speech-to-text integration
        # For now, return placeholder
        logger.warning("Speech-to-text not yet implemented - returning placeholder")

        return SpeechToTextResponse(
            text="[Speech-to-text not yet implemented - integrate Whisper/Assembly AI here]",
            error="Not implemented"
        )

    except Exception as e:
        logger.error(f"STT error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Speech-to-text failed: {str(e)}")

# Spoon OS Integration
@app.post("/api/spoonos/process", response_model=SpoonOSProcessResponse)
async def process_with_spoonos(request: SpoonOSProcessRequest):
    """
    Process data using Spoon OS

    This is a placeholder for your Spoon OS integration.
    Replace with actual Spoon OS SDK calls.
    """
    try:
        logger.info(f"Processing Spoon OS operation: {request.operation}")

        # TODO: Replace with actual Spoon OS integration
        # Example:
        # import spoonos
        # client = spoonos.Client(api_key=os.getenv("SPOONOS_API_KEY"))
        # result = client.process(request.operation, request.data)

        # Placeholder response
        result = {
            "operation": request.operation,
            "status": "success",
            "message": "Spoon OS integration placeholder - replace with actual implementation",
            "processed_data": request.data
        }

        return SpoonOSProcessResponse(result=result)

    except Exception as e:
        logger.error(f"Spoon OS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Spoon OS processing failed: {str(e)}")

# Advanced ML endpoint example
@app.post("/api/ml/analyze")
async def analyze_content(
    text: str = Form(...),
    analysis_type: str = Form(default="sentiment")
):
    """
    Perform advanced ML analysis

    This is where you can add heavy ML processing that's better suited for Python:
    - Sentiment analysis
    - Named entity recognition
    - Topic modeling
    - Custom model inference
    """
    try:
        logger.info(f"Analyzing content: type={analysis_type}, length={len(text)}")

        # TODO: Add your ML models here
        # Example with transformers:
        # from transformers import pipeline
        # analyzer = pipeline(analysis_type)
        # result = analyzer(text)

        result = {
            "analysis_type": analysis_type,
            "text_length": len(text),
            "result": "ML analysis placeholder - add your models here"
        }

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"ML analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
