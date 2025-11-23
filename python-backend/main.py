from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import sys
from pathlib import Path
try:
    from spoon_career_agents import CareerAnalysisOrchestrator, ActionPlanAgent  # type: ignore
    SPOON_AVAILABLE = True
except Exception:
    # Ensure local agents can be imported from current directory
    sys.path.append(str(Path(__file__).parent))
    from career_agents import AgentOrchestrator as LocalAgentOrchestrator, ActionPlanAgent as LocalActionPlanAgent
    SPOON_AVAILABLE = False
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Career OS AI Agents", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
if SPOON_AVAILABLE:
    try:
        orchestrator = CareerAnalysisOrchestrator()
        action_plan_agent = ActionPlanAgent()
        logger.info("Using spoon_career_agents orchestrator")
    except Exception:
        orchestrator = LocalAgentOrchestrator()
        action_plan_agent = LocalActionPlanAgent()
        logger.info("Using local career_agents orchestrator (init fallback)")
else:
    orchestrator = LocalAgentOrchestrator()
    action_plan_agent = LocalActionPlanAgent()
    logger.info("Using local career_agents orchestrator (import fallback)")

class OnboardingData(BaseModel):
    userId: str
    background: str
    skills: str
    interests: str
    goals: str
    values: str
    personality: Optional[str] = None

class CareerAnalysisRequest(BaseModel):
    userId: str
    careerId: str
    timeframe: str = "6_months"  # 3_months, 6_months, 1_year

@app.get("/")
async def root():
    return {"message": "Career OS AI Agents API", "status": "running"}

@app.post("/api/analyze-onboarding")
async def analyze_onboarding(data: OnboardingData):
    """Analyze user onboarding data and generate career recommendations."""
    try:
        # Run the orchestrator to analyze user data
        # Support both spoon_career_agents style and local AgentOrchestrator
        if hasattr(orchestrator, "analyze_career"):
            analysis_result = await orchestrator.analyze_career(f"""
            Background: {data.background}
            Skills: {data.skills}
            Interests: {data.interests}
            Goals: {data.goals}
            Values: {data.values}
            Personality: {data.personality or 'Not specified'}
            """)
            recommendations = analysis_result.get("recommendations", [])
            summary = analysis_result
        else:
            combined = await orchestrator.run_full_analysis({
                "background": data.background,
                "skills": data.skills,
                "interests": data.interests,
                "goals": data.goals,
                "values": data.values,
                "personality": data.personality or ""
            })
            recommendations = combined.get("recommendations", [])
            summary = combined.get("analysis_summary", {})
        
        return {
            "success": True,
            "userId": data.userId,
            "analysis": summary,
            "recommendations": recommendations,
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/generate-action-plan")
async def generate_action_plan(request: CareerAnalysisRequest):
    """Generate a detailed action plan for a specific career path."""
    try:
        # Get career details and user profile from Convex (mock for now)
        career_data = {
            "career_id": request.careerId,
            "title": "Software Engineer",  # This would come from Convex
            "current_skills": ["JavaScript", "React", "HTML/CSS"],
            "target_skills": ["Python", "Machine Learning", "Data Structures"],
            "salary_range": "$80,000 - $120,000",
            "growth_potential": "High"
        }
        
        # Generate action plan
        action_plan = await action_plan_agent.generate_plan(
            career_data=career_data,
            timeframe=request.timeframe
        )
        
        return {
            "success": True,
            "userId": request.userId,
            "careerId": request.careerId,
            "timeframe": request.timeframe,
            "actionPlan": action_plan,
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action plan generation failed: {str(e)}")

class OnboardingStartRequest(BaseModel):
    transcript: str
    resume_text: Optional[str] = None

@app.post("/api/onboarding/start")
async def onboarding_start(req: OnboardingStartRequest):
    """Run full analysis and return structured profile and recommendations."""
    try:
        if hasattr(orchestrator, "run_full_analysis"):
            combined = await orchestrator.run_full_analysis({
                "background": req.transcript,
                "skills": req.transcript,
                "interests": req.transcript,
                "goals": req.transcript,
                "values": req.transcript,
                "resume": req.resume_text or ""
            })
            career_profile = combined.get("analysis_summary", {})
            recommendations = combined.get("recommendations", [])
            session_id = combined.get("analysis_id")
        else:
            analysis_result = await orchestrator.analyze_career(req.transcript)
            career_profile = analysis_result
            recommendations = analysis_result.get("recommendations", [])
            session_id = "session-" + str(hash(req.transcript))

        return {
            "success": True,
            "orchestratorSessionId": session_id,
            "careerProfile": career_profile,
            "recommendedRoles": recommendations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Onboarding start failed: {str(e)}")

class OnboardingLLMRequest(BaseModel):
    history: List[Dict[str, str]]  # [{role: "user"|"assistant", content: "..."}]

@app.post("/api/onboarding/llm-response")
async def onboarding_llm_response(req: OnboardingLLMRequest):
    """Return the next onboarding question based on simple state machine."""
    try:
        questions = [
            "Tell me about your background and experience.",
            "What skills do you have and enjoy using?",
            "What industries or domains interest you?",
            "What are your near-term career goals?",
            "What work values matter most to you?"
        ]
        # Count user turns to select next question
        user_turns = [m for m in req.history if m.get("role") == "user"]
        if len(user_turns) >= len(questions):
            return {"success": True, "next": "Great! You're all set—press Finish & Analyze."}
        idx = len(user_turns)
        next_q = questions[idx]
        return {"success": True, "next": next_q}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM response failed: {str(e)}")

@app.get("/api/data/career-details")
async def career_details(role: str, industry: Optional[str] = None):
    """Return salary bell curve and learning/network resources for a role."""
    try:
        import json
        from pathlib import Path
        base = Path(__file__).parent / "data"
        salary_path = base / "mock_salary_data.json"
        resources_path = base / "mock_resources.json"
        salary = json.loads(salary_path.read_text())
        resources = json.loads(resources_path.read_text())

        career_salary = salary["careers"].get(role)
        career_resources = resources["careers"].get(role, {"resources": []})
        if not career_salary:
            raise HTTPException(status_code=404, detail="Role not found")

        return {
            "success": True,
            "role": role,
            "industry": industry or career_salary.get("industry"),
            "salaryDataPoints": career_salary.get("salaryDataPoints", []),
            "resources": career_resources.get("resources", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get career details: {str(e)}")

@app.get("/api/career-insights/{career_id}")
async def get_career_insights(career_id: str):
    """Get detailed insights for a specific career path."""
    try:
        # Mock career insights (in real implementation, this would query a database)
        insights = {
            "career_id": career_id,
            "title": "Data Scientist",
            "description": "Analyze complex data to help organizations make better decisions",
            "required_skills": ["Python", "Statistics", "Machine Learning", "SQL", "Data Visualization"],
            "average_salary": "$95,000 - $140,000",
            "job_growth": "35% (Much faster than average)",
            "education_requirements": "Bachelor's degree minimum, Master's preferred",
            "work_environment": "Office, Remote, Hybrid",
            "typical_day": [
                "Analyze datasets using statistical methods",
                "Build predictive models",
                "Create data visualizations and reports",
                "Collaborate with cross-functional teams",
                "Present findings to stakeholders"
            ],
            "career_path": [
                "Junior Data Analyst",
                "Data Analyst",
                "Senior Data Analyst",
                "Data Scientist",
                "Senior Data Scientist",
                "Principal Data Scientist"
            ]
        }
        
        return {
            "success": True,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get career insights: {str(e)}")

@app.post("/api/test-agents")
async def test_agents():
    """Test endpoint to verify all agents are working correctly."""
    try:
        test_data = {
            "background": "Computer Science graduate with 2 years of web development experience",
            "skills": "JavaScript, React, Node.js, HTML/CSS, Git",
            "interests": "AI, machine learning, data visualization, user experience design",
            "goals": "Want to transition into AI/ML engineering role within 1 year",
            "values": "Innovation, continuous learning, work-life balance, meaningful impact"
        }
        
        result = await orchestrator.analyze_career(f"""
        Background: {test_data['background']}
        Skills: {test_data['skills']}
        Interests: {test_data['interests']}
        Goals: {test_data['goals']}
        Values: {test_data['values']}
        """)
        return {
            "success": True,
            "test_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent test failed: {str(e)}")

# Voice integration endpoints
class VoiceTTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"
    speed: Optional[float] = 1.0

class VoiceSTTRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    language: Optional[str] = "en"

@app.get("/health")
async def health_check():
    """Health check endpoint for Convex and frontend monitoring"""
    return {
        "status": "healthy",
        "service": "Career OS AI Agents",
        "timestamp": asyncio.get_event_loop().time(),
        "agents_ready": True
    }

@app.post("/api/voice/tts")
async def text_to_speech(request: VoiceTTSRequest):
    """Convert text to speech using OpenAI TTS"""
    try:
        # For now, return a mock response
        # In production, integrate with OpenAI TTS API
        return {
            "success": True,
            "audio_url": f"https://mock-tts.audio/{hash(request.text)}.mp3",
            "voice": request.voice,
            "text": request.text
        }
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@app.get("/api/voice/voices")
async def list_voices():
    """List available TTS voices"""
    return {
        "voices": [
            {"id": "alloy", "name": "Alloy", "language": "en", "gender": "neutral"},
            {"id": "echo", "name": "Echo", "language": "en", "gender": "male"},
            {"id": "fable", "name": "Fable", "language": "en", "gender": "neutral"},
            {"id": "onyx", "name": "Onyx", "language": "en", "gender": "male"},
            {"id": "nova", "name": "Nova", "language": "en", "gender": "female"},
            {"id": "shimmer", "name": "Shimmer", "language": "en", "gender": "female"}
        ]
    }

@app.post("/api/voice/stt")
async def speech_to_text(req: Request):
    """Convert speech to text using OpenAI Whisper (mock). Accepts audio_data or audio_base64."""
    try:
        payload = await req.json()
        language = payload.get("language", "en")
        # For now, return a mock transcription
        mock_transcriptions = [
            "I'm interested in transitioning from marketing to product management.",
            "I have five years of experience in software development and want to move into AI.",
            "My background is in finance but I'm passionate about environmental sustainability.",
            "I'm a recent graduate looking to start a career in data science.",
            "I want to leverage my design skills to move into UX research."
        ]
        import random
        transcription = random.choice(mock_transcriptions)
        return {
            "success": True,
            "text": transcription,
            "language": language,
            "confidence": 0.95
        }
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
