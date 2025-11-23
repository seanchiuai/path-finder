"""
Enhanced CareerOrchestratorAgent using SpoonOS ToolCallAgent with web search capabilities.
This version can search for careers dynamically instead of using a hardcoded library.
"""

from typing import Dict, Any
import logging
import json
from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.chat import ChatBot
from spoon_ai.tools.manager import ToolManager
from .tools.career_search_tool import CareerSearchTool
from .career_library import CAREER_LIBRARY

logger = logging.getLogger(__name__)


class CareerOrchestratorAgentV2(ToolCallAgent):
    """
    Enhanced orchestrator using SpoonOS ToolCallAgent pattern.
    Can search for careers online using tools.
    """

    def __init__(self, llm: ChatBot):
        # Initialize tool manager with career search tool
        tool_manager = ToolManager()
        tool_manager.register_tool(CareerSearchTool())

        # Initialize the ToolCallAgent
        super().__init__(
            llm=llm,
            tool_manager=tool_manager,
            system_prompt="""You are an expert career advisor with access to career search tools.
Your goal is to recommend the best career paths for users based on their complete profile.

When given a user profile, you should:
1. Use the career_search tool to find relevant career opportunities
2. Analyze the fit between the user's profile and each career
3. Calculate fit scores based on:
   - Skill overlap (40% weight)
   - Personality alignment (25% weight)
   - Values match (20% weight)
   - Passion relevance (15% weight)
4. Recommend the top 5-7 careers with explanations

Always provide thoughtful, personalized recommendations."""
        )
        self.llm = llm

    async def recommend(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend careers using the tool-enabled agent.

        Args:
            profile: Complete user profile from all agents

        Returns:
            Dict with career recommendations
        """
        try:
            # Prepare the profile data for the search tool
            search_query = json.dumps({
                "skills": profile.get("skills", []),
                "interests": [p.get("name", "") for p in profile.get("passions", [])],
                "values": [v.get("name", "") for v in profile.get("values", [])],
                "personality": profile.get("personality", []),
                "goals": profile.get("goals", {})
            })

            # Build a comprehensive prompt for the agent
            skills_summary = ", ".join([s.get("name", "") for s in profile.get("skills", [])[:10]])
            personality_summary = ", ".join([p.get("name", "") for p in profile.get("personality", [])[:5]])
            passions_summary = ", ".join([p.get("name", "") for p in profile.get("passions", [])[:5]])
            values_summary = ", ".join([v.get("name", "") for v in profile.get("values", [])[:5]])

            prompt = f"""
I need career recommendations for a user with the following profile:

**Skills:** {skills_summary}
**Personality Traits:** {personality_summary}
**Passions/Interests:** {passions_summary}
**Values:** {values_summary}
**Career Goals:** {profile.get('goals', {})}

Please use the career_search tool to find relevant careers, then recommend the top 5-7 careers that best match this profile.

For each career, provide:
1. Career ID and name
2. Industry
3. Fit score (0-100)
4. Brief explanation of why it's a good fit
5. Median salary range
6. Growth outlook
7. Estimated time to transition

Return your response as a JSON object in this exact format:
{{
  "recommendations": [
    {{
      "careerId": "string",
      "careerName": "string",
      "industry": "string",
      "fitScore": number,
      "summary": "string",
      "medianSalary": "string",
      "growthOutlook": "string",
      "estimatedTime": "string",
      "whyGoodFit": "string"
    }}
  ]
}}
"""

            # Run the agent with tool access
            response = await self.run(prompt)

            # Parse the response
            # The ToolCallAgent might return structured data or text
            if isinstance(response, dict) and "recommendations" in response:
                result = response
            else:
                # Try to parse JSON from response content
                try:
                    result = json.loads(response.content if hasattr(response, 'content') else str(response))
                except:
                    # Fallback: use hardcoded careers with basic matching
                    logger.warning("Could not parse agent response, using fallback")
                    return self._fallback_recommendations(profile)

            logger.info(f"CareerOrchestratorAgentV2 recommended {len(result.get('recommendations', []))} careers")
            return result

        except Exception as e:
            logger.error(f"CareerOrchestratorAgentV2 error: {e}", exc_info=True)
            return self._fallback_recommendations(profile)

    def _fallback_recommendations(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback to basic career matching if tool-based search fails."""
        # Simple skill-based matching with hardcoded library
        user_skills = set(s.get("name", "").lower() for s in profile.get("skills", []))

        scored_careers = []
        for career in CAREER_LIBRARY:
            required_skills = set(s.lower() for s in career.get("requiredSkills", []))
            skill_overlap = len(user_skills & required_skills) / len(required_skills) if required_skills else 0

            # Simple fit score based on skill overlap
            fit_score = min(100, int(skill_overlap * 100) + 20)  # Add base score

            scored_careers.append({
                "careerId": career["careerId"],
                "careerName": career["careerName"],
                "industry": career["industry"],
                "fitScore": fit_score,
                "summary": career["description"],
                "medianSalary": career["medianSalary"],
                "growthOutlook": career["growthOutlook"],
                "estimatedTime": career["estimatedTime"],
                "whyGoodFit": f"Matches {int(skill_overlap * 100)}% of required skills"
            })

        # Sort by fit score and return top 7
        scored_careers.sort(key=lambda x: x["fitScore"], reverse=True)

        return {"recommendations": scored_careers[:7]}
