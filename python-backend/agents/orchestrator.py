import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

# Import all agents
try:
    from .skills_agent import SkillsAgent
    from .personality_agent import PersonalityAgent
    from .passions_agent import PassionsAgent
    from .goals_agent import GoalsAgent
    from .values_agent import ValuesAgent
    from .recommendation_agent import RecommendationAgent
    from .action_plan_agent import ActionPlanAgent
except ImportError:
    # Fallback for direct execution
    from skills_agent import SkillsAgent
    from personality_agent import PersonalityAgent
    from passions_agent import PassionsAgent
    from goals_agent import GoalsAgent
    from values_agent import ValuesAgent
    from recommendation_agent import RecommendationAgent
    from action_plan_agent import ActionPlanAgent

# Configure logging
logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates multiple AI agents to analyze user profiles and generate career recommendations.
    This is the core of the Career OS multi-agent system.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        self.session_id = str(uuid.uuid4())
        
        # Initialize all agents
        self.skills_agent = SkillsAgent(llm_manager)
        self.personality_agent = PersonalityAgent(llm_manager)
        self.passions_agent = PassionsAgent(llm_manager)
        self.goals_agent = GoalsAgent(llm_manager)
        self.values_agent = ValuesAgent(llm_manager)
        self.recommendation_agent = RecommendationAgent(llm_manager)
        self.action_plan_agent = ActionPlanAgent(llm_manager)
        
        logger.info(f"Initialized AgentOrchestrator with session: {self.session_id}")
    
    async def analyze_user_profile(self, transcript: str, resume_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Main orchestration method that coordinates all agents to analyze user profile.
        
        Args:
            transcript: User's onboarding transcript/text
            resume_text: Optional resume text
            
        Returns:
            Complete career profile with structured data
        """
        logger.info(f"Starting user profile analysis for session: {self.session_id}")
        
        try:
            # Run all agents in parallel for efficiency
            agents_tasks = [
                self._run_skills_agent(transcript, resume_text),
                self._run_personality_agent(transcript, resume_text),
                self._run_passions_agent(transcript, resume_text),
                self._run_goals_agent(transcript, resume_text),
                self._run_values_agent(transcript, resume_text)
            ]
            
            # Wait for all agents to complete
            results = await asyncio.gather(*agents_tasks)
            
            # Extract results
            skills_result, personality_result, passions_result, goals_result, values_result = results
            
            # Compile complete profile
            career_profile = {
                "session_id": self.session_id,
                "raw_onboarding_transcript": transcript,
                "resume_text": resume_text,
                "skills": skills_result.get("skills", []),
                "personality": personality_result.get("personality", {}),
                "passions": passions_result.get("passions", []),
                "goals": goals_result.get("goals", {}),
                "values": values_result.get("values", []),
                "analysis_timestamp": datetime.now().isoformat(),
                "agent_runs": [
                    {"agent": "skills", "status": "success", "duration_ms": skills_result.get("duration_ms", 0)},
                    {"agent": "personality", "status": "success", "duration_ms": personality_result.get("duration_ms", 0)},
                    {"agent": "passions", "status": "success", "duration_ms": passions_result.get("duration_ms", 0)},
                    {"agent": "goals", "status": "success", "duration_ms": goals_result.get("duration_ms", 0)},
                    {"agent": "values", "status": "success", "duration_ms": values_result.get("duration_ms", 0)}
                ]
            }
            
            logger.info(f"Completed user profile analysis for session: {self.session_id}")
            return career_profile
            
        except Exception as e:
            logger.error(f"Error in user profile analysis: {str(e)}")
            raise
    
    async def _run_skills_agent(self, transcript: str, resume_text: Optional[str]) -> Dict[str, Any]:
        """Extract technical and soft skills from user input."""
        logger.info("Running skills agent")
        start_time = datetime.now()
        
        try:
            # For now, return mock data
            # TODO: Integrate with actual LLM for skill extraction
            skills = [
                "Python", "JavaScript", "React", "Node.js", "SQL",
                "Problem Solving", "Communication", "Team Leadership"
            ]
            
            return {
                "skills": skills,
                "confidence": 0.85,
                "duration_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
        except Exception as e:
            logger.error(f"Skills agent error: {str(e)}")
            return {"skills": [], "confidence": 0.0, "duration_ms": 0}
    
    async def _run_personality_agent(self, transcript: str, resume_text: Optional[str]) -> Dict[str, Any]:
        """Analyze personality traits using Big Five model."""
        logger.info("Running personality agent")
        start_time = datetime.now()
        
        try:
            # Mock Big Five personality analysis
            # TODO: Integrate with actual LLM for personality analysis
            personality = {
                "openness": 0.75,
                "conscientiousness": 0.82,
                "extraversion": 0.65,
                "agreeableness": 0.78,
                "neuroticism": 0.35
            }
            
            return {
                "personality": personality,
                "confidence": 0.80,
                "duration_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
        except Exception as e:
            logger.error(f"Personality agent error: {str(e)}")
            return {"personality": {}, "confidence": 0.0, "duration_ms": 0}
    
    async def _run_passions_agent(self, transcript: str, resume_text: Optional[str]) -> Dict[str, Any]:
        """Extract interests and passions from user input."""
        logger.info("Running passions agent")
        start_time = datetime.now()
        
        try:
            # Mock passions extraction
            # TODO: Integrate with actual LLM for passion identification
            passions = [
                "Technology Innovation", "Sustainable Solutions", "Mentoring Others",
                "Creative Problem Solving", "Continuous Learning"
            ]
            
            return {
                "passions": passions,
                "confidence": 0.78,
                "duration_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
        except Exception as e:
            logger.error(f"Passions agent error: {str(e)}")
            return {"passions": [], "confidence": 0.0, "duration_ms": 0}
    
    async def _run_goals_agent(self, transcript: str, resume_text: Optional[str]) -> Dict[str, Any]:
        """Extract career goals and lifestyle preferences."""
        logger.info("Running goals agent")
        start_time = datetime.now()
        
        try:
            # Mock goals extraction
            # TODO: Integrate with actual LLM for goal identification
            goals = {
                "income_target": 95000,
                "location": "Remote",
                "work_style": "hybrid",
                "risk_tolerance": "medium",
                "schedule_preference": "flexible"
            }
            
            return {
                "goals": goals,
                "confidence": 0.82,
                "duration_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
        except Exception as e:
            logger.error(f"Goals agent error: {str(e)}")
            return {"goals": {}, "confidence": 0.0, "duration_ms": 0}
    
    async def _run_values_agent(self, transcript: str, resume_text: Optional[str]) -> Dict[str, Any]:
        """Extract core values and work motivations."""
        logger.info("Running values agent")
        start_time = datetime.now()
        
        try:
            # Mock values extraction
            # TODO: Integrate with actual LLM for value identification
            values = [
                "Impact", "Growth", "Autonomy", "Collaboration", "Work-Life Balance"
            ]
            
            return {
                "values": values,
                "confidence": 0.76,
                "duration_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
        except Exception as e:
            logger.error(f"Values agent error: {str(e)}")
            return {"values": [], "confidence": 0.0, "duration_ms": 0}


class RecommendationAgent:
    """
    Generates career recommendations based on the complete user profile.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized RecommendationAgent")
    
    async def generate_recommendations(self, career_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate career recommendations based on user profile.
        
        Args:
            career_profile: Complete user profile from orchestrator
            
        Returns:
            List of career recommendations with match scores
        """
        logger.info("Generating career recommendations")
        
        try:
            # Mock career recommendations
            # TODO: Integrate with actual LLM for intelligent recommendation generation
            recommendations = [
                {
                    "industry": "Technology",
                    "role": "Product Manager",
                    "match_score": 92,
                    "match_explanation": "Your technical background, leadership skills, and passion for innovation make you an excellent fit for product management. Your communication skills and strategic thinking align perfectly with this role."
                },
                {
                    "industry": "Technology",
                    "role": "Technical Lead",
                    "match_score": 88,
                    "match_explanation": "Your strong technical skills and team leadership experience position you well for a technical lead role. Your collaborative nature and mentoring passion are key strengths here."
                },
                {
                    "industry": "Consulting",
                    "role": "Management Consultant",
                    "match_score": 85,
                    "match_explanation": "Your problem-solving abilities, communication skills, and strategic thinking make consulting a great fit. Your diverse background and adaptability are valuable assets."
                },
                {
                    "industry": "Education Technology",
                    "role": "EdTech Product Specialist",
                    "match_score": 82,
                    "match_explanation": "Your passion for continuous learning and technology innovation aligns well with the edtech sector. Your mentoring experience is particularly valuable here."
                }
            ]
            
            logger.info(f"Generated {len(recommendations)} career recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation error: {str(e)}")
            return []