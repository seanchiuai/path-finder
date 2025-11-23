# Python Backend Integration Guide

## Architecture Overview

This project uses a **hybrid architecture** combining:
- **Convex** (TypeScript) - Primary backend for database, real-time, auth, vector search
- **Python FastAPI** - Microservice for ElevenLabs, Spoon OS, and heavy ML integrations

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js + React)             │
│  - UI components                        │
│  - Convex React hooks                   │
└─────────────┬───────────────────────────┘
              │
              ├─────────────────────┬─────────────────────┐
              ↓                     ↓                     ↓
    ┌─────────────────┐   ┌──────────────────┐  ┌──────────────────┐
    │ Convex (TS)     │   │ Python Backend   │  │ External APIs    │
    │ - Database      │←──│ (FastAPI)        │──│ - ElevenLabs     │
    │ - Real-time     │   │ - Voice AI       │  │ - Spoon OS       │
    │ - Auth          │   │ - ML Processing  │  │ - OpenAI         │
    │ - Vector search │   │                  │  └──────────────────┘
    └─────────────────┘   └──────────────────┘
```

## Why Hybrid?

**Keep in Convex:**
- ✅ Real-time WebSocket subscriptions
- ✅ Type-safe database with auto-generated types
- ✅ Vector search (Convex-native feature)
- ✅ Row-level security with Clerk auth
- ✅ Simple deployment (no infrastructure management)

**Use Python for:**
- ✅ ElevenLabs voice processing
- ✅ Spoon OS integrations
- ✅ Heavy ML models (transformers, PyTorch, etc.)
- ✅ Libraries only available in Python ecosystem

## Setup Instructions

### 1. Python Backend Setup

```bash
# Navigate to Python backend
cd python-backend

# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate
# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys
```

**Required Environment Variables:**
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SPOONOS_API_KEY=your_spoonos_api_key
ALLOWED_ORIGINS=http://localhost:3000
PORT=8000
```

### 2. Start Python Backend

```bash
# From python-backend directory
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

Server runs at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 3. Configure Convex Environment

Add to Convex dashboard (Settings → Environment Variables):
```
PYTHON_API_URL=http://localhost:8000  # Development
```

For production:
```
PYTHON_API_URL=https://your-python-api.fly.dev
```

### 4. Configure Frontend

Already set in `.env.local`:
```env
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

## Available Python Endpoints

### Health Check
```bash
GET /health
```
Returns backend status and API key configuration status.

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

### Get Voices
```bash
GET /api/voice/voices
```
Returns list of available ElevenLabs voices.

### Spoon OS Processing
```bash
POST /api/spoonos/process
Content-Type: application/json

{
  "operation": "your_operation",
  "data": { "key": "value" }
}
```

## Convex Proxy Actions

Frontend calls Convex actions, which proxy to Python:

### Text-to-Speech
```typescript
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const textToSpeech = useAction(api.voice.textToSpeech);

const result = await textToSpeech({
  text: "Hello world",
  voiceId: "21m00Tcm4TlvDq8ikWAM"
});
```

### Spoon OS
```typescript
const processWithSpoonOS = useAction(api.spoonos.processWithSpoonOS);

const result = await processWithSpoonOS({
  operation: "analyze",
  data: { content: "..." }
});
```

### Health Check
```typescript
const checkHealth = useAction(api.spoonos.checkPythonBackendHealth);

const status = await checkHealth({});
console.log(status); // { status: "healthy", elevenLabsConfigured: true, ... }
```

## Frontend Components

### Voice Chat Component
```tsx
import { VoiceChat } from "@/components/features/voice-chat";

export default function Page() {
  return <VoiceChat />;
}
```

### Demo Page
Visit: `http://localhost:3000/voice-demo`

## Data Flow Example

**Text-to-Speech Flow:**
```
User types text in VoiceChat component
  ↓
Clicks "Generate Speech"
  ↓
useAction(api.voice.textToSpeech) called
  ↓
Convex action (convex/voice.ts)
  ↓
HTTP POST to Python backend (http://localhost:8000/api/voice/tts)
  ↓
Python calls ElevenLabs API
  ↓
Returns base64 audio to Convex
  ↓
Convex returns to frontend
  ↓
Frontend decodes base64 → Audio Blob → plays in browser
```

## Adding Custom Python Integrations

### 1. Add Python Endpoint

```python
# python-backend/main.py

@app.post("/api/custom/endpoint")
async def custom_endpoint(data: dict):
    # Your custom logic
    result = process_data(data)
    return {"result": result}
```

### 2. Create Convex Proxy Action

```typescript
// convex/custom.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export const customAction = action({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    const response = await fetch(`${PYTHON_API_URL}/api/custom/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args.data),
    });

    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  },
});
```

### 3. Use in Frontend

```tsx
const customAction = useAction(api.custom.customAction);

const result = await customAction({ data: { ... } });
```

## Production Deployment

### Deploy Python Backend

**Option 1: Fly.io**
```bash
cd python-backend

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy

# Set environment variables
fly secrets set ELEVENLABS_API_KEY=xxx
fly secrets set SPOONOS_API_KEY=xxx
```

**Option 2: Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

**Option 3: AWS Lambda**
Use [Mangum](https://mangum.io/) to wrap FastAPI for Lambda.

### Update Convex Environment

In Convex dashboard, set:
```
PYTHON_API_URL=https://your-app.fly.dev
```

### CORS Configuration

For production, update Python backend:
```python
# python-backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://your-app.vercel.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Backend not reachable
```bash
# Check if Python server is running
curl http://localhost:8000/health

# Should return: {"status":"healthy",...}
```

### CORS errors
- Check `ALLOWED_ORIGINS` in Python backend `.env`
- Verify frontend URL matches allowed origins

### ElevenLabs errors
- Verify API key in `python-backend/.env`
- Check API quota/limits in ElevenLabs dashboard
- Test with: `curl http://localhost:8000/api/voice/voices`

### Type errors in Convex
```bash
# Regenerate Convex types
npx convex dev
```

## Security Considerations

1. **Never expose Python API directly to frontend** - Always proxy through Convex
2. **Use Convex auth** - All actions check `getUserIdentity()`
3. **Validate inputs** - Pydantic models validate all Python requests
4. **Rate limiting** - Add rate limiting for production (e.g., slowapi)
5. **API keys** - Store in environment variables, never commit

## Performance Optimization

1. **Audio caching** - Cache generated audio in Convex storage
2. **Batch processing** - Send multiple requests in parallel
3. **Streaming** - Use `/api/voice/tts-stream` for lower latency
4. **Connection pooling** - FastAPI handles this automatically

## Monitoring

### Health Checks
```typescript
// Regular health check (every 5 minutes)
setInterval(async () => {
  const health = await checkHealth({});
  if (health.status !== "healthy") {
    console.error("Python backend unhealthy", health);
  }
}, 5 * 60 * 1000);
```

### Logging
Python backend logs to console. In production, use:
- Sentry for error tracking
- LogTail/Papertrail for log aggregation
- Datadog/New Relic for APM

## Next Steps

1. **Add Spoon OS integration** - Replace placeholder in `python-backend/main.py`
2. **Implement Speech-to-Text** - Add Whisper or AssemblyAI
3. **Add ML models** - Install transformers/torch for custom models
4. **Set up monitoring** - Add error tracking and logging
5. **Deploy to production** - Deploy Python backend and update env vars

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Python Backend README](../python-backend/README.md)
