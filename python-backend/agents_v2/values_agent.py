"""
ValuesAgent: Identifies user's core values.
"""

from typing import Dict, Any
import logging
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class ValuesAgent:
    """
    Analyzes transcript to identify core personal and professional values.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def analyze(self, transcript: str) -> Dict[str, Any]:
        """
        Extract core values from the user's responses.

        Returns:
            Dict with 'values' array containing {name, score}
        """
        prompt = f"""
You are a values analyst for career guidance. Analyze this interview transcript to identify the user's core values.

Transcript:
{transcript}

Identify 5-7 values that are important to this person in their career. Consider values like:
- Work-life balance
- Impact / Making a difference
- Continuous learning / Growth
- Financial security / Compensation
- Autonomy / Independence
- Collaboration / Teamwork
- Innovation / Creativity
- Job security / Stability
- Recognition / Achievement
- Helping others / Service
- Diversity & Inclusion
- Flexibility

Score each value from 0-100 based on how important it seems to be to the user.

Return a JSON object:
{{
  "values": [
    {{"name": "continuous-learning", "score": 90}},
    {{"name": "work-life-balance", "score": 75}},
    ...
  ]
}}

Return ONLY valid JSON, no additional text.
"""

        try:
            response = await self.llm.chat(prompt)
            import json
            result = json.loads(response.content.strip())
            logger.info(f"ValuesAgent identified {len(result.get('values', []))} values")
            return result
        except Exception as e:
            logger.error(f"ValuesAgent error: {e}")
            return {"values": []}
