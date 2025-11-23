"""
Enhanced CareerOrchestratorAgent that generates personalized career recommendations.
Uses LLM to create unique career paths tailored to each user's profile.
"""

from typing import Dict, Any
import logging
import json
from spoon_ai.agents.base import BaseAgent
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class CareerOrchestratorAgentV2(BaseAgent):
    """
    Enhanced orchestrator that generates personalized career recommendations.
    Uses LLM to create unique careers tailored to user profiles.
    """

    def __init__(self, llm: ChatBot):
        super().__init__(llm=llm)
        self.llm = llm
        self.system_prompt = """You are an expert career advisor who generates personalized career recommendations.
Your goal is to create unique career paths tailored to each user's complete profile.

When given a user profile, you should:
1. Analyze their skills, personality, values, and passions
2. Generate 5-7 specific career opportunities that match their profile
3. Create unique careerId values (e.g., "fullstack-dev", "product-designer")
4. Calculate fit scores based on:
   - Skill overlap (40% weight)
   - Personality alignment (25% weight)
   - Values match (20% weight)
   - Passion relevance (15% weight)
5. Research realistic salary ranges and growth outlooks for each career
6. Estimate transition timeframes based on their current skill level

Generate creative, personalized careers - don't just pick from a preset list.
Always provide thoughtful, detailed recommendations with accurate market data."""

    async def recommend(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized career recommendations using LLM.

        Args:
            profile: Complete user profile from all agents

        Returns:
            Dict with career recommendations
        """
        try:
            # Build a comprehensive prompt for the LLM
            skills_summary = ", ".join([s.get("name", "") for s in profile.get("skills", [])[:10]])
            personality_summary = ", ".join([p.get("name", "") for p in profile.get("personality", [])[:5]])
            passions_summary = ", ".join([p.get("name", "") for p in profile.get("passions", [])[:5]])
            values_summary = ", ".join([v.get("name", "") for v in profile.get("values", [])[:5]])

            prompt = f"""
I need you to GENERATE 5-7 personalized career recommendations for a user with the following profile:

**Skills:** {skills_summary}
**Personality Traits:** {personality_summary}
**Passions/Interests:** {passions_summary}
**Values:** {values_summary}
**Career Goals:** {profile.get('goals', {})}

IMPORTANT: Generate creative, tailored careers based on this profile. Don't select from a database.
Think about what real career paths would fit this person's unique combination of traits.

For each career you generate, provide:
1. Unique Career ID (kebab-case, e.g., "ai-product-strategist")
2. Career name
3. Industry
4. Fit score (0-10000, higher = better fit)
5. Summary (1-2 sentences about the role)
6. Realistic median salary range (based on current US market)
7. Growth outlook (% and description)
8. Estimated transition time (based on their current skills)
9. Why it's a good fit (2-3 sentences explaining the match)

Return your response as a JSON object in this exact format:
{{
  "recommendations": [
    {{
      "careerId": "string",
      "role": "string",
      "industry": "string",
      "matchScore": number,
      "summary": "string",
      "medianSalary": "string",
      "growthOutlook": "string",
      "estimatedTime": "string",
      "matchExplanation": "string"
    }}
  ]
}}
"""

            # Call LLM directly
            response = await self.llm.chat_async(
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse the response
            response_text = response.content if hasattr(response, 'content') else str(response)

            # Extract JSON from response (handle markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            result = json.loads(response_text)

            logger.info(f"CareerOrchestratorAgentV2 generated {len(result.get('recommendations', []))} careers")
            return result

        except Exception as e:
            logger.error(f"CareerOrchestratorAgentV2 error: {e}", exc_info=True)
            return {"recommendations": [], "error": str(e)}
