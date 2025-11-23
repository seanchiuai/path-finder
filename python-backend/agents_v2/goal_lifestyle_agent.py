"""
GoalLifestyleAgent: Extracts career goals and lifestyle preferences.
"""

from typing import Dict, Any
import logging
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class GoalLifestyleAgent:
    """
    Analyzes transcript to understand career goals and lifestyle preferences.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Extract goals and lifestyle preferences.

        Returns:
            Dict with 'goals' object containing timeframe, income, location, workingStyle
        """
        prompt = f"""
You are a career goals analyst. Analyze this interview transcript to understand the user's career goals and lifestyle preferences.

Transcript:
{transcript}

Extract information about:
- Timeframe: How soon they want to transition (e.g., "6 months", "1-2 years", "3-5 years")
- Income preference: Their income goals (e.g., "entry-level", "moderate", "high-earning", "maximize")
- Location preference: Where they want to work (e.g., "remote", "hybrid", "on-site", "flexible", "specific-city")
- Working style: Their preferred work environment (e.g., "startup", "corporate", "freelance", "agency", "nonprofit")

If not explicitly stated, infer from context or use reasonable defaults.

Return a JSON object:
{{
  "goals": {{
    "timeframe": "1-2 years",
    "incomePreference": "moderate",
    "locationPreference": "flexible",
    "workingStyle": "hybrid"
  }}
}}

Return ONLY valid JSON, no additional text.
"""

        try:
            response = await self.llm.chat(prompt)
            import json
            content = response.content.strip()

            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)
            logger.info(f"GoalLifestyleAgent extracted goals")
            return result
        except Exception as e:
            logger.error(f"GoalLifestyleAgent error: {e}")
            return {
                "goals": {
                    "timeframe": "1-2 years",
                    "incomePreference": "moderate",
                    "locationPreference": "flexible",
                    "workingStyle": "hybrid"
                }
            }
