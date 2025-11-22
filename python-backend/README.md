# Python Backend for Path Finder

FastAPI microservice for ElevenLabs voice integration and Spoon AI (xSpoon OS) processing.

## 🚀 Quick Start

### Prerequisites
- **Python 3.12 or higher** (required for Spoon AI SDK)
- Git
- Virtual environment (recommended)

### 1. Set Up Virtual Environment

```bash
cd python-backend
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
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

**Required environment variables:**
- `ELEVENLABS_API_KEY` - Get from [ElevenLabs Dashboard](https://elevenlabs.io/)
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey) (Recommended for Spoon AI)
- `ALLOWED_ORIGINS` - Frontend URLs (comma-separated)

**Optional Spoon AI providers (choose at least one):**
- `OPENAI_API_KEY` - For OpenAI models
- `ANTHROPIC_API_KEY` - For Claude models
- `DEEPSEEK_API_KEY` - For DeepSeek models
- `OPENROUTER_API_KEY` - For OpenRouter service

### 4. Verify Spoon AI Configuration

```bash
python -c "from spoon_ai.utils.config_manager import ConfigManager; print('✅ Configuration loaded successfully')"
```

### 5. Run Development Server

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
# Returns: {status, elevenlabs_configured, spoon_ai_available, spoon_ai_providers, version}
```

### ElevenLabs Voice Endpoints

#### Text-to-Speech
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

#### Text-to-Speech Streaming
```bash
POST /api/voice/tts-stream
# Returns audio stream directly for lower latency
```

#### Get Available Voices
```bash
GET /api/voice/voices
```

#### Speech-to-Text (Placeholder)
```bash
POST /api/voice/stt
Content-Type: application/json

{
  "audio_base64": "base64_encoded_audio_data",
  "model": "whisper-1"
}
```

### Spoon AI Endpoints

#### Execute Agent
```bash
POST /api/spoon-ai/execute
Content-Type: application/json

{
  "prompt": "Analyze this text for sentiment",
  "agent_type": "general",
  "context": {
    "project": "path-finder",
    "user_id": "123"
  },
  "provider": "gemini",  # Optional: gemini, openai, anthropic, deepseek, openrouter
  "model": "gemini-2.5-pro"  # Optional
}
```

#### Use Toolkit
```bash
POST /api/spoon-ai/toolkit
Content-Type: multipart/form-data

toolkit_name=web_scraping
operation=extract
params={"url": "https://example.com"}
```

## 🔧 Integration with Convex

The Python backend is called from Convex actions. See:
- `convex/voice.ts` - ElevenLabs proxy actions
- `convex/spoonos.ts` - Spoon AI proxy actions

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

# Set secrets
fly secrets set ELEVENLABS_API_KEY=xxx
fly secrets set GEMINI_API_KEY=xxx
```

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

### Deploy to AWS Lambda

Use [Mangum](https://mangum.io/) to wrap FastAPI for Lambda:

```bash
pip install mangum
```

```python
# lambda_handler.py
from mangum import Mangum
from main import app

handler = Mangum(app)
```

### Environment Variables in Production

Set these in your deployment platform:
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY` (or other LLM provider keys)
- `DEFAULT_LLM_PROVIDER` (gemini, openai, anthropic, etc.)
- `DEFAULT_MODEL` (model identifier)
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

# Test Spoon AI agent
curl -X POST http://localhost:8000/api/spoon-ai/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2+2?","agent_type":"general"}'
```

## 📝 Spoon AI Integration Guide

### Installation

Spoon AI is already included in `requirements.txt`:

```bash
pip install spoon-ai-sdk>=0.1.0
pip install spoon-toolkits>=0.1.0  # Optional: Extended tools
```

### Configuration

Spoon AI uses an **env-first approach** - it reads from `.env` file:

```env
# At least one LLM provider required
GEMINI_API_KEY=your_key_here  # Recommended
OPENAI_API_KEY=your_key_here  # Alternative

# Optional configuration
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_MODEL=gemini-2.5-pro
GEMINI_MAX_TOKENS=32768
```

### Using Spoon AI Agents

```python
from spoon_ai.core.agent import Agent
from spoon_ai.core.llm import LLMProvider

# Initialize LLM provider
llm_provider = LLMProvider(provider="gemini", model="gemini-2.5-pro")

# Create agent
agent = Agent(
    name="data_analyst",
    llm_provider=llm_provider,
    system_prompt="You are a data analysis expert."
)

# Execute
response = agent.execute("Analyze this dataset...")
```

### Using Spoon AI Toolkits

```python
# TODO: Implement based on spoon-toolkits documentation
# Example pattern:
# from spoon_toolkits.web_scraping import WebScrapingToolkit
# toolkit = WebScrapingToolkit()
# result = toolkit.execute("extract", {"url": "https://example.com"})
```

## 🔒 Security Notes

- Never commit `.env` file (included in `.gitignore`)
- Use environment variables for all secrets
- Restrict CORS origins in production
- Add rate limiting for production (use `slowapi`)
- Add API authentication if needed
- Validate all inputs with Pydantic models

## 🐛 Troubleshooting

**Python version error:**
```bash
# Spoon AI requires Python 3.12+
python --version
# Upgrade if needed
```

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

**Spoon AI configuration error:**
```bash
# Verify API keys are set
echo $GEMINI_API_KEY

# Test configuration
python -c "from spoon_ai.utils.config_manager import ConfigManager; print('✅ OK')"
```

**CORS errors:**
```bash
# Check ALLOWED_ORIGINS in .env includes your frontend URL
```

## 📖 Resources

- [Spoon AI Installation](https://xspoonai.github.io/docs/getting-started/installation/)
- [Spoon AI Configuration](https://xspoonai.github.io/docs/getting-started/configuration/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Convex Documentation](https://docs.convex.dev)
