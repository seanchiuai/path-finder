from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import sys
from pathlib import Path
import os
from dotenv import load_dotenv
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Environment variable to toggle between Career Compass and SpoonOS
USE_CAREER_COMPASS = os.getenv("USE_CAREER_COMPASS", "true").lower() == "true"

# Import Career Compass pipeline (new system)
if USE_CAREER_COMPASS:
    try:
        sys.path.append(str(Path(__file__).parent))
        from agents_v2.pipeline import CareerAnalysisPipeline
        from agents_v2.plan_detail_agent import PlanDetailAgent
        from utils.gemini_chatbot import GeminiChatBot
        from utils.plan_generator import (
            generate_action_plan,
            calculate_xp_for_level,
            calculate_level_from_xp
        )
        from models.schemas import (
            Skill, PersonalityTrait, Passion, GoalLifestyle, Value,
            CareerProfile, CareerRecommendation, Task, Phase, Progress
        )
        CAREER_COMPASS_AVAILABLE = True
        logger.info("Career Compass pipeline loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Career Compass pipeline: {e}")
        CAREER_COMPASS_AVAILABLE = False
        USE_CAREER_COMPASS = False
else:
    CAREER_COMPASS_AVAILABLE = False

# Import legacy SpoonOS agents (backup system)
SPOON_AVAILABLE = False
if not USE_CAREER_COMPASS or not CAREER_COMPASS_AVAILABLE:
    try:
        from spoon_career_agents import CareerAnalysisOrchestrator, ActionPlanAgent  # type: ignore
        SPOON_AVAILABLE = True
        logger.info("SpoonOS agents loaded as backup")
    except Exception:
        # Ensure local agents can be imported from current directory
        sys.path.append(str(Path(__file__).parent))
        from career_agents import AgentOrchestrator as LocalAgentOrchestrator, ActionPlanAgent as LocalActionPlanAgent
        SPOON_AVAILABLE = False
        logger.info("Using local career_agents orchestrator (fallback)")

app = FastAPI(title="Career OS AI Agents", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents based on configuration
career_compass_pipeline = None
orchestrator = None
action_plan_agent = None

if USE_CAREER_COMPASS and CAREER_COMPASS_AVAILABLE:
    try:
        # Use Gemini 2.0-flash for Career Compass pipeline
        career_compass_pipeline = CareerAnalysisPipeline(
            llm_provider="gemini",
            model_name="gemini-2.0-flash"
        )
        logger.info("Using Career Compass pipeline with Gemini 2.0-flash")
    except Exception as e:
        logger.error(f"Failed to initialize Career Compass pipeline: {e}")
        USE_CAREER_COMPASS = False

# Initialize legacy agents if Career Compass not available
if not USE_CAREER_COMPASS:
    if SPOON_AVAILABLE:
        try:
            orchestrator = CareerAnalysisOrchestrator()
            action_plan_agent = ActionPlanAgent()
            logger.info("Using SpoonOS orchestrator")
        except Exception:
            orchestrator = LocalAgentOrchestrator()
            action_plan_agent = LocalActionPlanAgent()
            logger.info("Using local career_agents orchestrator (init fallback)")
    else:
        orchestrator = LocalAgentOrchestrator()
        action_plan_agent = LocalActionPlanAgent()
        logger.info("Using local career_agents orchestrator")

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

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

class OnboardingStartRequest(BaseModel):
    transcript: str
    resume_text: Optional[str] = None

class SelectCareersRequest(BaseModel):
    userId: str
    careerIds: List[str]

class UpdateTaskRequest(BaseModel):
    userId: str
    careerId: str
    taskId: str
    status: str  # "not_started" | "in_progress" | "completed"

# ============================================================================
# CORE ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "Career OS AI Agents API",
        "status": "running",
        "pipeline": "Career Compass" if USE_CAREER_COMPASS else "SpoonOS/Local"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Convex and frontend monitoring"""
    return {
        "status": "healthy",
        "service": "Career OS AI Agents",
        "pipeline": "Career Compass" if USE_CAREER_COMPASS else "SpoonOS",
        "timestamp": asyncio.get_event_loop().time(),
        "agents_ready": True
    }

# ============================================================================
# ONBOARDING ENDPOINTS
# ============================================================================

@app.post("/api/onboarding/start")
async def onboarding_start(req: OnboardingStartRequest):
    """
    Run full analysis and return structured profile and recommendations.
    Uses Career Compass pipeline by default, falls back to SpoonOS if unavailable.
    """
    try:
        if USE_CAREER_COMPASS and career_compass_pipeline:
            # Use Career Compass pipeline
            logger.info("Running Career Compass analysis pipeline")
            result = await career_compass_pipeline.analyze(
                transcript=req.transcript,
                resume_text=req.resume_text or ""
            )

            career_profile = result["careerProfile"]
            recommendations = result["careerRecommendations"]
            session_id = str(uuid.uuid4())

            # Transform Career Compass format to path-finder format
            return {
                "success": True,
                "orchestratorSessionId": session_id,
                "careerProfile": {
                    "skills": career_profile.get("skills", []),
                    "personality": career_profile.get("personality", []),
                    "passions": career_profile.get("passions", []),
                    "goals": career_profile.get("goals", {}),
                    "values": career_profile.get("values", [])
                },
                "recommendedRoles": [
                    {
                        "careerId": rec.get("careerId"),
                        "industry": rec.get("industry"),
                        "role": rec.get("careerName"),
                        "matchScore": rec.get("fitScore", 0),
                        "matchExplanation": rec.get("whyGoodFit", ""),
                        # Career Compass-specific fields
                        "medianSalary": rec.get("medianSalary"),
                        "growthOutlook": rec.get("growthOutlook"),
                        "estimatedTime": rec.get("estimatedTime"),
                        "summary": rec.get("summary")
                    }
                    for rec in recommendations
                ]
            }
        else:
            # Fallback to legacy SpoonOS agents
            logger.info("Running legacy SpoonOS analysis")
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
                session_id = combined.get("analysis_id", str(uuid.uuid4()))
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
        logger.error(f"Onboarding start failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Onboarding start failed: {str(e)}")

@app.post("/api/analyze-onboarding")
async def analyze_onboarding(data: OnboardingData):
    """Analyze user onboarding data and generate career recommendations (legacy endpoint)."""
    try:
        # Run the orchestrator to analyze user data
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
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/onboarding/llm-response")
async def onboarding_llm_response(req: dict):
    """Return the next onboarding question based on simple state machine."""
    try:
        questions = [
            "Tell me about your background and experience.",
            "What skills do you have and enjoy using?",
            "What industries or domains interest you?",
            "What are your near-term career goals?",
            "What work values matter most to you?"
        ]
        history = req.get("history", [])
        user_turns = [m for m in history if m.get("role") == "user"]
        if len(user_turns) >= len(questions):
            return {"success": True, "next": "Great! You're all set—press Finish & Analyze."}
        idx = len(user_turns)
        next_q = questions[idx]
        return {"success": True, "next": next_q}
    except Exception as e:
        logger.error(f"LLM response failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM response failed: {str(e)}")

# ============================================================================
# CAREER COMPASS ENDPOINTS (New System)
# ============================================================================

@app.post("/api/selected-careers")
async def select_careers(request: SelectCareersRequest):
    """
    Generate action plans for selected careers (max 3).
    Returns data that frontend will save to Convex.
    """
    try:
        if len(request.careerIds) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 careers can be selected")

        if not USE_CAREER_COMPASS or not CAREER_COMPASS_AVAILABLE:
            # For legacy system, return basic structure
            logger.info("Using legacy action plan generation")
            selected_careers = []
            for career_id in request.careerIds:
                # Basic action plan structure
                selected_careers.append({
                    "careerId": career_id,
                    "phases": [],
                    "tasks": [],
                    "progress": {
                        "xp": 0,
                        "level": 1,
                        "completionPercent": 0.0,
                        "streak": 0,
                        "tasksCompletedThisWeek": 0,
                        "xpToNextLevel": 1000
                    }
                })
            return {"success": True, "selectedCareers": selected_careers}

        # Use Career Compass to generate detailed plans
        logger.info(f"Generating action plans for {len(request.careerIds)} careers")

        # Initialize plan detail agent
        llm = GeminiChatBot(llm_provider="gemini", model_name="gemini-2.0-flash")
        plan_agent = PlanDetailAgent(llm)

        selected_careers = []
        for career_id in request.careerIds:
            # Generate basic action plan structure
            plan = generate_action_plan(career_id, f"Career {career_id}")

            # Generate detailed plan with real resources
            try:
                logger.info(f"Generating detailed plan for career {career_id}")
                detailed_plan = await plan_agent.generate_detailed_plan(
                    career_name=f"Career {career_id}",
                    career_details={"careerId": career_id},
                    user_profile={}
                )
            except Exception as e:
                logger.error(f"Failed to generate detailed plan: {e}", exc_info=True)
                detailed_plan = {}

            # Initialize progress
            progress = {
                "careerId": career_id,
                "xp": 0,
                "level": 1,
                "completionPercent": 0.0,
                "streak": 0,
                "tasksCompletedThisWeek": 0,
                "xpToNextLevel": 1000
            }

            selected_career = {
                "careerId": career_id,
                "phases": plan["phases"],
                "tasks": plan["tasks"],
                "progress": progress,
                "detailedPlan": detailed_plan,
                "videos": detailed_plan.get("videos", [])
            }

            selected_careers.append(selected_career)

        logger.info(f"Generated plans for {len(selected_careers)} careers")
        return {"success": True, "selectedCareers": selected_careers}

    except Exception as e:
        logger.error(f"Failed to select careers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to select careers: {str(e)}")

@app.get("/api/dashboard")
async def get_dashboard(userId: str = Query(...)):
    """
    Get dashboard data for all selected careers.
    Note: This endpoint expects Convex to provide the data.
    In the current architecture, the frontend queries Convex directly.
    This is a placeholder for future Python-side dashboard logic.
    """
    return {
        "message": "Dashboard data is managed by Convex. Query Convex directly from frontend.",
        "userId": userId
    }

@app.get("/api/careers/{careerId}")
async def get_career_detail(careerId: str, userId: str = Query(...)):
    """
    Get detailed career information.
    Note: This endpoint expects Convex to provide the data.
    Frontend should query Convex directly for career details.
    """
    return {
        "message": "Career details are managed by Convex. Query Convex directly from frontend.",
        "careerId": careerId,
        "userId": userId
    }

@app.post("/api/tasks/update")
async def update_task(request: UpdateTaskRequest):
    """
    Update task status and recalculate progress.
    Returns updated progress data that frontend will save to Convex.
    """
    try:
        if not USE_CAREER_COMPASS:
            return {
                "success": True,
                "message": "Task updates are managed by Convex in legacy mode"
            }

        # Calculate XP changes based on task status
        # This is placeholder logic - frontend should handle the full update
        return {
            "success": True,
            "message": "Task status updated. Frontend should recalculate progress in Convex."
        }

    except Exception as e:
        logger.error(f"Failed to update task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

# ============================================================================
# LEGACY ENDPOINTS (SpoonOS/Local Agents)
# ============================================================================

@app.post("/api/generate-action-plan")
async def generate_action_plan_legacy(request: CareerAnalysisRequest):
    """Generate a detailed action plan for a specific career path (legacy)."""
    try:
        # Get career details (mock for now)
        career_data = {
            "career_id": request.careerId,
            "title": "Software Engineer",
            "current_skills": ["JavaScript", "React", "HTML/CSS"],
            "target_skills": ["Python", "Machine Learning", "Data Structures"],
            "salary_range": "$80,000 - $120,000",
            "growth_potential": "High"
        }

        # Generate action plan
        if action_plan_agent:
            action_plan = await action_plan_agent.generate_plan(
                career_data=career_data,
                timeframe=request.timeframe
            )
        else:
            action_plan = {"message": "Action plan agent not available"}

        return {
            "success": True,
            "userId": request.userId,
            "careerId": request.careerId,
            "timeframe": request.timeframe,
            "actionPlan": action_plan,
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Action plan generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Action plan generation failed: {str(e)}")

@app.get("/api/data/career-details")
async def career_details(role: str, industry: Optional[str] = None):
    """Return salary bell curve and learning/network resources for a role."""
    try:
        import json
        from pathlib import Path
        base = Path(__file__).parent / "data"
        salary_path = base / "mock_salary_data.json"
        resources_path = base / "mock_resources.json"

        if not salary_path.exists() or not resources_path.exists():
            raise HTTPException(status_code=404, detail="Mock data files not found")

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
        logger.error(f"Failed to get career details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get career details: {str(e)}")

@app.get("/api/career-insights/{career_id}")
async def get_career_insights(career_id: str):
    """Get detailed insights for a specific career path."""
    try:
        # Mock career insights
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
        logger.error(f"Failed to get career insights: {e}", exc_info=True)
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

        if USE_CAREER_COMPASS and career_compass_pipeline:
            result = await career_compass_pipeline.analyze(
                transcript=f"Background: {test_data['background']}\nSkills: {test_data['skills']}\nInterests: {test_data['interests']}\nGoals: {test_data['goals']}\nValues: {test_data['values']}",
                resume_text=""
            )
        elif orchestrator:
            result = await orchestrator.analyze_career(f"""
            Background: {test_data['background']}
            Skills: {test_data['skills']}
            Interests: {test_data['interests']}
            Goals: {test_data['goals']}
            Values: {test_data['values']}
            """)
        else:
            result = {"error": "No agents available"}

        return {
            "success": True,
            "pipeline": "Career Compass" if USE_CAREER_COMPASS else "SpoonOS/Local",
            "test_result": result
        }
    except Exception as e:
        logger.error(f"Agent test failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent test failed: {str(e)}")

# ============================================================================
# VOICE ENDPOINTS (Placeholder/Mock)
# ============================================================================

class VoiceTTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"
    speed: Optional[float] = 1.0

@app.post("/api/voice/tts")
async def text_to_speech(request: VoiceTTSRequest):
    """Convert text to speech using OpenAI TTS (mock)"""
    try:
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
    """Convert speech to text using OpenAI Whisper (mock)"""
    try:
        payload = await req.json()
        language = payload.get("language", "en")
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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
