# Python Backend for Path Finder

FastAPI microservice for ElevenLabs voice integration and Spoon OS processing.

## 🚀 Quick Start

### 1. Set Up Virtual Environment

```bash
cd python-backend
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and add your API keys
```

Required environment variables:
- `ELEVENLABS_API_KEY` - Get from [ElevenLabs Dashboard](https://elevenlabs.io/)
- `SPOONOS_API_KEY` - Your Spoon OS API key
- `ALLOWED_ORIGINS` - Frontend URLs (comma-separated)

### 4. Run Development Server

```bash
# Using uvicorn directly
uvicorn main:app --reload --port 8000

# Or using Python
python main.py
```

Server will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### Text-to-Speech
```bash
POST /api/voice/tts
Content-Type: application/json

{
  "text": "Hello, this is a test",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

### Text-to-Speech Streaming
```bash
POST /api/voice/tts-stream
# Returns audio stream directly
```

### Get Available Voices
```bash
GET /api/voice/voices
```

### Speech-to-Text (Placeholder)
```bash
POST /api/voice/stt
Content-Type: application/json

{
  "audio_base64": "base64_encoded_audio_data",
  "model": "whisper-1"
}
```

### Spoon OS Processing
```bash
POST /api/spoonos/process
Content-Type: application/json

{
  "operation": "your_operation",
  "data": { "key": "value" }
}
```

## 🔧 Integration with Convex

The Python backend is called from Convex actions. See `convex/voice.ts` for proxy actions.

## 📦 Deployment

### Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
fly deploy
```

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables in Production

Set these in your deployment platform:
- `ELEVENLABS_API_KEY`
- `SPOONOS_API_KEY`
- `ALLOWED_ORIGINS` (your production frontend URL)
- `PORT` (usually set automatically)

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test TTS endpoint
curl -X POST http://localhost:8000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice_id":"21m00Tcm4TlvDq8ikWAM"}'
```

## 📝 Adding Custom Integrations

### Add Spoon OS SDK

1. Install Spoon OS package:
```bash
pip install spoonos-sdk  # Replace with actual package name
```

2. Update `main.py`:
```python
import spoonos

@app.post("/api/spoonos/process")
async def process_with_spoonos(request: SpoonOSProcessRequest):
    client = spoonos.Client(api_key=os.getenv("SPOONOS_API_KEY"))
    result = client.process(request.operation, request.data)
    return SpoonOSProcessResponse(result=result)
```

### Add ML Models

```bash
pip install transformers torch
```

```python
from transformers import pipeline

analyzer = pipeline("sentiment-analysis")

@app.post("/api/ml/sentiment")
async def analyze_sentiment(text: str):
    result = analyzer(text)
    return result
```

## 🔒 Security Notes

- Never commit `.env` file
- Use environment variables for all secrets
- Restrict CORS origins in production
- Add rate limiting for production
- Add API authentication if needed

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change port
uvicorn main:app --reload --port 8001
```

**Import errors:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**CORS errors:**
```bash
# Check ALLOWED_ORIGINS in .env includes your frontend URL
```
