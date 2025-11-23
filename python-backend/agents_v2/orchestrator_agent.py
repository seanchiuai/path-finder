"""
CareerOrchestratorAgent: Dynamically generates and ranks career recommendations using LLM.
Uses AI to generate personalized career paths instead of relying on a hardcoded library.
"""

from typing import Dict, Any
import logging
import json
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class CareerOrchestratorAgent:
    """
    Takes the complete career profile and dynamically recommends careers using LLM.
    Generates 20+ personalized career recommendations based on user profile.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def recommend(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend careers based on the complete profile using dynamic LLM generation.

        Args:
            profile: Dict containing skills, personality, passions, goals, values

        Returns:
            Dict with 'recommendations' array of 20+ career recommendations
        """
        # Build a summary of the profile for the LLM
        skills_summary = ", ".join([s.get("name", "") for s in profile.get("skills", [])[:15]])
        personality_summary = ", ".join([p.get("name", "") for p in profile.get("personality", [])[:8]])
        passions_summary = ", ".join([p.get("name", "") for p in profile.get("passions", [])[:8]])
        values_summary = ", ".join([v.get("name", "") for v in profile.get("values", [])[:8]])
        goals_summary = str(profile.get("goals", {}))

        prompt = f"""
You are an expert career advisor with deep knowledge of hundreds of career paths across all industries.

User Profile:
- Skills: {skills_summary}
- Personality Traits: {personality_summary}
- Passions & Interests: {passions_summary}
- Career Goals: {goals_summary}
- Core Values: {values_summary}

Based on this profile, recommend the TOP 20-25 REAL CAREER PATHS that would be the best fit. Think broadly across:
- Technology (software engineering, data science, cybersecurity, AI/ML, cloud architecture, DevOps, etc.)
- Creative & Design (UX/UI design, product design, content creation, digital marketing, brand strategy)
- Business & Management (product management, project management, business analysis, consulting, operations)
- Healthcare (health tech, clinical research, healthcare administration, medical devices)
- Education & Training (instructional design, corporate training, edtech, curriculum development)
- Finance & Fintech (financial analysis, data analytics in finance, fintech product roles)
- Science & Engineering (research, R&D, various engineering disciplines)
- Sales & Growth (technical sales, growth marketing, partnerships, business development)
- Other relevant industries and emerging fields

For each career, calculate a fit score (0-100) based on:
1. Skill overlap and transferability (35% weight)
2. Personality alignment (25% weight)
3. Values match (20% weight)
4. Passion relevance (15% weight)
5. Career goals alignment (5% weight)

Return a JSON object with 20-25 careers ranked by fit score. Include:
- Some that are obvious/direct fits (high scores 85-100)
- Some adjacent/lateral moves (scores 75-84)
- Some creative/unexpected but relevant options (scores 65-74)

{{
  "recommendations": [
    {{
      "careerId": "unique-kebab-case-id",
      "careerName": "Specific Career Title",
      "industry": "Industry Category",
      "fitScore": 95,
      "summary": "Clear 1-2 sentence description of what this role involves day-to-day",
      "medianSalary": "$XX,000 - $YY,000 (based on current US market)",
      "growthOutlook": "X% growth rate and job market outlook",
      "estimatedTime": "X-Y months to transition based on current skills",
      "whyGoodFit": "2-3 sentences explaining why this specific career matches THIS user's unique combination of skills, personality, passions, and goals"
    }},
    ...
  ]
}}

CRITICAL REQUIREMENTS:
- Return EXACTLY 20-25 careers (not less!)
- Make them REAL, specific career paths (not vague or generic)
- Ensure fit scores accurately reflect the actual match quality
- Provide realistic salary ranges based on 2024-2025 market data
- Estimated transition time should be realistic (consider current skills)
- Each "whyGoodFit" must be personalized to THIS user's specific profile
- Return ONLY valid JSON, no markdown, no additional text or explanations
"""

        try:
            logger.info("CareerOrchestratorAgent: Sending prompt to LLM for dynamic career generation...")
            response = await self.llm.chat(prompt)
            content = response.content.strip()

            logger.info(f"CareerOrchestratorAgent: Received LLM response, length: {len(content)}")
            logger.debug(f"CareerOrchestratorAgent: Raw LLM response:\n{content[:500]}...")

            # Remove markdown code blocks if present
            if content.startswith("```"):
                logger.info("CareerOrchestratorAgent: Removing markdown code blocks from response")
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            logger.info("CareerOrchestratorAgent: Parsing JSON response...")
            result = json.loads(content)
            recommendations = result.get("recommendations", [])

            logger.info(f"CareerOrchestratorAgent dynamically generated {len(recommendations)} career recommendations")

            # Validate we have enough recommendations
            if len(recommendations) < 15:
                logger.warning(f"Only {len(recommendations)} recommendations generated, expected 20+")

            return {"recommendations": recommendations}

        except json.JSONDecodeError as e:
            logger.error(f"CareerOrchestratorAgent JSON parsing error: {e}", exc_info=True)
            logger.error(f"Problematic content: {content[:1000]}")
        except Exception as e:
            logger.error(f"CareerOrchestratorAgent error: {e}", exc_info=True)
            # Fallback: return a minimal set with error indication
            return {
                "recommendations": [
                    {
                        "careerId": "error-fallback",
                        "careerName": "Career Recommendations Temporarily Unavailable",
                        "industry": "System",
                        "fitScore": 0,
                        "summary": "Unable to generate recommendations at this time. Please try again.",
                        "medianSalary": "N/A",
                        "growthOutlook": "N/A",
                        "estimatedTime": "N/A",
                        "whyGoodFit": "System error occurred during recommendation generation."
                    }
                ]
            }
