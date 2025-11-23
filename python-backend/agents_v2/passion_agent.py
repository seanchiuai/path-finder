"""
PassionAgent: Identifies user's passions and interests.
"""

from typing import Dict, Any
import logging
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class PassionAgent:
    """
    Analyzes transcript to identify core passions and interest clusters.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Extract passions and interests from the user's responses.

        Returns:
            Dict with 'passions' array containing {name, description}
        """
        prompt = f"""
You are a career passion analyst. Analyze this interview transcript to identify the user's core passions and interests.

Transcript:
{transcript}

Identify 3-5 passion clusters or interest areas. These could be:
- Subject matter interests (e.g., "technology," "healthcare," "environment")
- Activities they enjoy (e.g., "building things," "helping people," "solving puzzles")
- Causes they care about (e.g., "sustainability," "education," "social justice")

Return a JSON object:
{{
  "passions": [
    {{"name": "technology", "description": "Building digital solutions and working with cutting-edge tools"}},
    ...
  ]
}}

Return ONLY valid JSON, no additional text.
"""

        try:
            response = await self.llm.chat(prompt)
            import json
            result = json.loads(response.content.strip())
            logger.info(f"PassionAgent identified {len(result.get('passions', []))} passions")
            return result
        except Exception as e:
            logger.error(f"PassionAgent error: {e}")
            return {"passions": []}
