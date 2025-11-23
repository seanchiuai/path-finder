"""
Career Search Tool using SpoonOS BaseTool pattern.
Searches online for career information based on user profile.
"""

import asyncio
from typing import Any, Dict
from pydantic import Field
from spoon_ai.tools.base import BaseTool
import logging
import json

logger = logging.getLogger(__name__)


class CareerSearchTool(BaseTool):
    """
    Tool to search for career opportunities based on user skills and interests.
    Uses web search APIs to find relevant career paths.
    """

    name: str = "career_search"
    description: str = """
    Search for career opportunities and job roles based on user profile.
    Provides information about:
    - Career titles and descriptions
    - Required skills and qualifications
    - Salary ranges
    - Growth outlook
    - Industry information

    Input should be a JSON string with user skills, interests, and preferences.
    """

    async def execute(self, query: str) -> str:
        """
        Search for careers matching the user profile.

        Args:
            query: JSON string with profile data (skills, interests, etc.)

        Returns:
            JSON string with career search results
        """
        try:
            # Parse the query
            profile_data = json.loads(query) if isinstance(query, str) else query

            skills = profile_data.get("skills", [])
            interests = profile_data.get("interests", [])
            values = profile_data.get("values", [])

            # For MVP: Use a simple heuristic-based approach with fallback to hardcoded data
            # In production, this would call actual job/career APIs like:
            # - O*NET API
            # - Bureau of Labor Statistics API
            # - LinkedIn Jobs API
            # - Indeed API

            logger.info(f"Searching careers for profile with {len(skills)} skills")

            # Simulate API search results (in production, replace with real API calls)
            results = await self._search_careers_online(skills, interests, values)

            return json.dumps(results)

        except Exception as e:
            logger.error(f"CareerSearchTool error: {e}")
            return json.dumps({"error": str(e), "careers": []})

    async def _search_careers_online(
        self, skills: list, interests: list, values: list
    ) -> Dict[str, Any]:
        """
        Perform the actual career search.

        For MVP, this uses a smart matching algorithm.
        For production, integrate with real APIs.
        """
        # Import the career library as fallback
        from ..career_library import CAREER_LIBRARY

        # Simple skill-based matching
        matched_careers = []

        for career in CAREER_LIBRARY:
            # Calculate match score
            skill_overlap = self._calculate_skill_overlap(
                skills, career.get("requiredSkills", [])
            )

            if skill_overlap > 0.2:  # At least 20% skill match
                matched_careers.append({
                    "careerId": career["careerId"],
                    "careerName": career["careerName"],
                    "industry": career["industry"],
                    "description": career["description"],
                    "requiredSkills": career["requiredSkills"],
                    "medianSalary": career["medianSalary"],
                    "growthOutlook": career["growthOutlook"],
                    "estimatedTime": career["estimatedTime"],
                    "skillMatch": round(skill_overlap * 100, 1)
                })

        # Sort by skill match
        matched_careers.sort(key=lambda x: x["skillMatch"], reverse=True)

        logger.info(f"Found {len(matched_careers)} matching careers")

        return {
            "careers": matched_careers[:10],  # Return top 10
            "totalFound": len(matched_careers)
        }

    def _calculate_skill_overlap(self, user_skills: list, required_skills: list) -> float:
        """Calculate skill overlap percentage."""
        if not user_skills or not required_skills:
            return 0.0

        # Normalize skill names
        user_skill_set = set(s.lower() if isinstance(s, str) else s.get("name", "").lower() for s in user_skills)
        required_skill_set = set(s.lower() for s in required_skills)

        # Calculate overlap
        overlap = len(user_skill_set & required_skill_set)
        return overlap / len(required_skill_set) if required_skill_set else 0.0
