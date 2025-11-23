# PathFinder (Career OS)

AI-powered career discovery platform using voice-based onboarding to understand users, then leveraging multi-agent analysis to match them with ideal career paths and provide actionable recommendations.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router, Tailwind CSS 4
- **Backend**: Hybrid architecture
  - Convex (real-time database, serverless functions, auth integration)
  - Python/FastAPI (ElevenLabs integration, SpoonOS multi-agent orchestration)
- **Voice AI**: ElevenLabs Conversational AI (React SDK)
- **Multi-Agent**: SpoonOS StateGraph for career analysis pipeline
- **Authentication**: Clerk
- **Language**: TypeScript (frontend), Python (backend services)
- **Styling**: Tailwind CSS 4 with shadcn/ui components

## 📋 Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- Python 3.9+ installed
- npm or yarn package manager
- A Clerk account (free)
- A Convex account (free)
- An ElevenLabs account with API key
- OpenAI or Anthropic API key (for SpoonOS agents)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd path-finder
npm install

# Install Python dependencies
cd python-backend
pip install -r requirements.txt
cd ..
```

### 2. Set Up Convex

1. **Create a Convex account**: Go to [convex.dev](https://convex.dev) and sign up
2. **Install Convex CLI**:
   ```bash
   npm install -g convex
   ```
3. **Login to Convex**:
   ```bash
   npx convex login
   ```
4. **Initialize your project**:
   ```bash
   npx convex dev
   ```
   - This will create a new Convex project and give you a deployment URL
   - Copy the deployment URL (it looks like `https://your-project.convex.cloud`)

### 3. Set Up Clerk

1. **Create a Clerk account**: Go to [clerk.com](https://clerk.com) and sign up
2. **Create a new application** in your Clerk dashboard
3. **Get your keys** from the Clerk dashboard:
   - Go to "API Keys" in your Clerk dashboard
   - Copy the "Publishable key" and "Secret key"

### 4. Configure JWT Template in Clerk

This is **critical** for Clerk to work with Convex:

1. In your Clerk dashboard, go to **"JWT Templates"**
2. Click **"New template"**
3. Select **"Convex"** from the list
4. Name it `convex` (lowercase)
5. Set the **Issuer** to your Clerk domain (e.g., `https://your-app.clerk.accounts.dev`)
6. Save the template

### 5. Set Up ElevenLabs

1. **Create an ElevenLabs account**: Go to [elevenlabs.io](https://elevenlabs.io) and sign up
2. **Get your API key** from the ElevenLabs dashboard
3. **Create a conversational AI agent** in your ElevenLabs dashboard

### 6. Environment Variables

Create a `.env.local` file in your project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ElevenLabs
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_api_key

# Python Backend
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:8000
```

Create a `.env` file in the `python-backend/` directory:

```env
# ElevenLabs
ELEVENLABS_API_KEY=your_api_key

# LLM (OpenAI or Anthropic)
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key

# Convex
CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your_deploy_key

# Clerk
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
```

**Where to find these:**
- `NEXT_PUBLIC_CONVEX_URL`: From step 2 when you ran `npx convex dev`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk dashboard → API Keys → Publishable key
- `CLERK_SECRET_KEY`: Clerk dashboard → API Keys → Secret key
- `ELEVENLABS_API_KEY` & `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: ElevenLabs dashboard
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: OpenAI/Anthropic dashboard
- `CONVEX_DEPLOY_KEY`: Convex dashboard → Settings → Deploy Keys

### 7. Configure Convex Environment Variables

1. Go to your [Convex dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Add this variable:
   ```
   CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
   ```
   (Replace with your actual Clerk issuer domain from step 4)

### 8. Update Convex Auth Config

Update `convex/auth.config.ts` with your Clerk domain:

```typescript
export default {
  providers: [
    {
      domain: "https://your-app.clerk.accounts.dev", // Replace with your domain
      applicationID: "convex",
    },
  ]
};
```

## 🏃‍♂️ Running the Application

### Development Mode

You need to run three services:

```bash
# Terminal 1: Next.js frontend
npm run dev

# Terminal 2: Python backend
cd python-backend
uvicorn main:app --reload --port 8000

# Terminal 3: Convex backend (if not auto-started)
npx convex dev
```

This starts:
- Next.js frontend at `http://localhost:3000`
- Python/FastAPI backend at `http://localhost:8000`
- Convex backend (dashboard opens automatically)

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run dev:frontend` - Start only Next.js frontend
- `npm run dev:backend` - Start only Convex backend
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
├── app/                      # Next.js pages (App Router)
│   ├── (auth)/              # Public routes (sign-in, sign-up)
│   └── (protected)/         # Protected routes (dashboard, onboarding)
├── components/               # React components
│   ├── ui/                  # shadcn/ui components
│   └── voice/               # Voice interview components
├── convex/                   # Convex backend
│   ├── auth.config.ts       # Clerk authentication config
│   ├── schema.ts            # Database schema
│   ├── users.ts             # User management functions
│   ├── careerProfiles.ts    # Career profile functions
│   └── voice.ts             # Voice session proxies
├── python-backend/           # Python/FastAPI microservice
│   ├── main.py              # FastAPI app
│   ├── spoonos/             # SpoonOS agent workflows
│   ├── elevenlabs/          # ElevenLabs integration
│   └── requirements.txt     # Python dependencies
├── docs/                     # Documentation
│   ├── CHANGELOG.md         # Project changelog
│   ├── reports/             # Status reports
│   └── *.md                 # Architecture docs
├── .claude/                  # Claude Code configuration
│   ├── agents/              # Specialized agents
│   ├── commands/            # Slash commands
│   ├── skills/              # Skills
│   └── plans/               # Implementation plans
├── middleware.ts             # Route protection
└── PRD.json                  # Product requirements
```

## ✨ Key Features

### Voice-Based Onboarding
- ElevenLabs Conversational AI conducts natural voice interviews
- Asks structured questions about skills, personality, passions, goals, values
- Real-time audio streaming with sub-second latency
- Automatic transcription and data extraction

### Multi-Agent Career Analysis
- **ProfileAnalyzer**: Extracts and structures user data from voice transcripts
- **CareerMatcher**: Matches profile against career database with ML scoring
- **Orchestrator**: Coordinates agents using SpoonOS StateGraph
- Real-time processing status updates

### Career Recommendations
- Ranked career matches with percentage fit scores
- Detailed explanations of why each career fits
- Card-based UI with hover states and animations
- Action plan generator with personalized roadmaps

## 🔐 Authentication Flow

- Sign up/Sign in pages via Clerk
- Protected routes using middleware
- User session management
- JWT tokens shared between Clerk, Convex, and Python backend
- Row-level security in Convex queries

## 🗄️ Database Architecture

### Convex (Primary Database)
- `users`: Clerk user data synced via webhooks
- `careerProfiles`: Structured data from voice interviews
- `agentOutputs`: SpoonOS agent execution logs
- `careerRecommendations`: Ranked career matches with scores
- Real-time subscriptions for live updates
- TypeScript-native schema with automatic migrations

### Python Backend
- Stateless FastAPI endpoints
- Reads/writes to Convex via HTTP actions
- Orchestrates SpoonOS agent workflows
- Handles ElevenLabs signed URL generation

## 🆘 Troubleshooting

### Common Issues

1. **"Convex client not configured"**
   - Check your `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
   - Make sure Convex dev server is running (`npx convex dev`)

2. **Authentication not working**
   - Verify JWT template is created in Clerk with issuer domain
   - Check `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard
   - Ensure `convex/auth.config.ts` has correct domain

3. **Python backend connection errors**
   - Ensure Python backend is running on port 8000
   - Check `NEXT_PUBLIC_PYTHON_BACKEND_URL` in `.env.local`
   - Verify CORS settings in `python-backend/main.py`

4. **ElevenLabs voice not working**
   - Verify `ELEVENLABS_API_KEY` is set in both `.env.local` and `python-backend/.env`
   - Check agent ID is correct in `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
   - Ensure microphone permissions are enabled in browser

5. **SpoonOS agent errors**
   - Check LLM API keys (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) in `python-backend/.env`
   - Review Python backend logs for agent execution errors
   - Verify Convex deploy key has write permissions

### Getting Help

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
   - `ELEVENLABS_API_KEY`
   - `NEXT_PUBLIC_PYTHON_BACKEND_URL` (update to production URL)
4. Deploy!

### Python Backend (Railway/Render)

**Railway:**
1. Push code to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Select `python-backend` as root directory
4. Add environment variables (see step 6 above)
5. Deploy and note the production URL

**Render:**
1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Set root directory to `python-backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy and note the production URL

### Convex Backend

Convex automatically deploys when you push to your main branch. Configure this in your Convex dashboard under "Settings" → "Deploy Settings".

### Post-Deployment

1. Update `NEXT_PUBLIC_PYTHON_BACKEND_URL` in Vercel to production Python backend URL
2. Update CORS settings in `python-backend/main.py` to allow Vercel domain
3. Test voice onboarding flow end-to-end
4. Monitor Python backend logs for agent execution errors

## 📚 Documentation

For detailed documentation, see:
- `docs/python-backend-integration.md` - Python backend setup and API endpoints
- `docs/frontend-architecture.md` - Frontend routing and page structure
- `docs/convex-patterns.md` - Convex schema and function patterns
- `docs/CHANGELOG.md` - Recent updates and changes
- `PRD.json` - Complete product requirements
- `CLAUDE.md` - Development workflow and patterns

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**PathFinder - Discover Your Career Path with AI 🎯**

For questions or issues, please open a GitHub issue or check the documentation links above.