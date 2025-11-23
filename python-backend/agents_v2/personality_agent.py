"""
PersonalityAgent: Infers personality traits from onboarding data.
"""

from typing import Dict, Any
import logging
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class PersonalityAgent:
    """
    Analyzes transcript to infer personality traits and working style.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Infer personality traits from the user's responses.

        Returns:
            Dict with 'personality' array containing {name, score}
        """
        prompt = f"""
You are a personality analyst for career guidance. Analyze the following interview transcript.

Transcript:
{transcript}

Based on their responses, infer their personality traits and score them from 0-100.

Consider dimensions like:
- Analytical vs Creative thinking
- Introverted vs Extroverted communication
- Detail-oriented vs Big-picture thinking
- Independent vs Collaborative work style
- Risk-taking vs Cautious approach
- Empathy and emotional intelligence

Return a JSON object:
{{
  "personality": [
    {{"name": "analytical", "score": 75}},
    {{"name": "creative", "score": 60}},
    ...
  ]
}}

Include 5-7 traits. Return ONLY valid JSON, no additional text.
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
            logger.info(f"PersonalityAgent identified {len(result.get('personality', []))} traits")
            return result
        except Exception as e:
            logger.error(f"PersonalityAgent error: {e}")
            return {"personality": []}
