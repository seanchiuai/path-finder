"""
CareerAnalysisPipeline: Main orchestrator for multi-agent career analysis.
Coordinates all specialized agents using SpoonOS patterns.
"""

import asyncio
import logging
from typing import Dict, Any
from app.utils.gemini_chatbot import GeminiChatBot
from .skill_agent import SkillAgent
from .personality_agent import PersonalityAgent
from .passion_agent import PassionAgent
from .goal_lifestyle_agent import GoalLifestyleAgent
from .values_agent import ValuesAgent
from .orchestrator_agent import CareerOrchestratorAgent

logger = logging.getLogger(__name__)


class CareerAnalysisPipeline:
    """
    Orchestrates the multi-agent career analysis pipeline.

    Uses SpoonOS LLM integration to run five specialized agents in parallel,
    then combines their outputs for final career recommendations.
    """

    def __init__(self, llm_provider: str = "gemini", model_name: str = "gemini-2.5-flash"):
        """
        Initialize the pipeline with an LLM configuration.

        Args:
            llm_provider: LLM provider name (openai, anthropic, gemini, etc.)
            model_name: Specific model to use
        """
        # Initialize the LLM client using our Gemini-enabled ChatBot
        self.llm = GeminiChatBot(llm_provider=llm_provider, model_name=model_name)

        # Initialize all specialized agents
        self.skill_agent = SkillAgent(self.llm)
        self.personality_agent = PersonalityAgent(self.llm)
        self.passion_agent = PassionAgent(self.llm)
        self.goal_lifestyle_agent = GoalLifestyleAgent(self.llm)
        self.values_agent = ValuesAgent(self.llm)
        self.orchestrator_agent = CareerOrchestratorAgent(self.llm)

        logger.info(f"Initialized CareerAnalysisPipeline with {llm_provider}/{model_name}")

    async def analyze(self, transcript: str, resume_text: str = "") -> Dict[str, Any]:
        """
        Run the complete multi-agent analysis pipeline.

        Args:
            transcript: Text from the voice/text interview
            resume_text: Optional resume text

        Returns:
            Dict containing:
                - careerProfile: Complete profile from all agents
                - careerRecommendations: List of recommended careers with fit scores
        """
        logger.info("Starting career analysis pipeline")

        try:
            # Step 1: Run profile analysis agents in parallel
            logger.info("Running profile analysis agents in parallel...")

            results = await asyncio.gather(
                self.skill_agent.analyze(transcript, resume_text),
                self.personality_agent.analyze(transcript),
                self.passion_agent.analyze(transcript),
                self.goal_lifestyle_agent.analyze(transcript),
                self.values_agent.analyze(transcript),
                return_exceptions=True
            )

            # Extract results (with fallbacks for any failures)
            skills_result = results[0] if not isinstance(results[0], Exception) else {"skills": []}
            personality_result = results[1] if not isinstance(results[1], Exception) else {"personality": []}
            passions_result = results[2] if not isinstance(results[2], Exception) else {"passions": []}
            goals_result = results[3] if not isinstance(results[3], Exception) else {"goals": {}}
            values_result = results[4] if not isinstance(results[4], Exception) else {"values": []}

            # Build the complete career profile
            career_profile = {
                "skills": skills_result.get("skills", []),
                "personality": personality_result.get("personality", []),
                "passions": passions_result.get("passions", []),
                "goals": goals_result.get("goals", {}),
                "values": values_result.get("values", [])
            }

            logger.info("Profile analysis complete")

            # Step 2: Use orchestrator to recommend careers based on profile
            logger.info("Running career orchestrator...")
            recommendations_result = await self.orchestrator_agent.recommend(career_profile)

            logger.info(f"Pipeline complete: {len(recommendations_result.get('recommendations', []))} careers recommended")

            return {
                "careerProfile": career_profile,
                "careerRecommendations": recommendations_result.get("recommendations", [])
            }

        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            # Return minimal fallback
            return {
                "careerProfile": {
                    "skills": [],
                    "personality": [],
                    "passions": [],
                    "goals": {},
                    "values": []
                },
                "careerRecommendations": []
            }

    async def cleanup(self):
        """Cleanup resources if needed."""
        # SpoonOS ChatBot handles cleanup internally
        logger.info("Pipeline cleanup complete")
