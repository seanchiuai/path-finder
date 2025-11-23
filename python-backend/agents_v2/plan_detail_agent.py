"""
PlanDetailAgent: Generates comprehensive, detailed career action plans.
Uses LLM to create personalized learning resources, projects, networking contacts, and interview prep.
"""

import logging
import json
from typing import Dict, Any
from utils.gemini_chatbot import GeminiChatBot
from utils.youtube_search import search_career_videos

logger = logging.getLogger(__name__)


class PlanDetailAgent:
    """
    Generates detailed career action plans with real resources, people, and tasks.
    """

    def __init__(self, llm: GeminiChatBot):
        self.llm = llm

    async def generate_detailed_plan(
        self,
        career_name: str,
        career_details: Dict[str, Any],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive career action plan with:
        - Median salary (real data)
        - Growth outlook (10-year projections)
        - YouTube video IDs for "day in the life" content
        - Detailed learning resources with descriptions
        - Project ideas with descriptions
        - Real people to network with (names + LinkedIn)
        - Interview preparation resources

        Args:
            career_name: The career title
            career_details: Career info (industry, fit score, etc.)
            user_profile: User's skills, goals, etc.

        Returns:
            Dict with comprehensive plan details
        """

        skills_summary = ", ".join([s.get("name", "") for s in user_profile.get("skills", [])[:10]])

        prompt = f"""
You are a career planning expert. Generate a comprehensive action plan for someone transitioning to: {career_name}

User's Current Skills: {skills_summary}

Please provide detailed information in JSON format:

1. **Salary & Market Data** (use real 2024-2025 US market data):
   - medianSalary: Annual salary range (e.g., "$95,000 - $140,000")
   - growthOutlook: Detailed 10-year growth projection with percentage and job market trends

2. **Learning Resources** (5-7 items):
   - Mix of online courses, certifications, books, bootcamps
   - Each must have: title, type (course/book/certification), description (1-2 sentences), url (real link if available, otherwise example.com)
   - Make descriptions specific and actionable

3. **Project Ideas** (4-6 projects):
   - Beginner to advanced progression
   - Each must have: title, difficulty (beginner/intermediate/advanced), description (2-3 sentences describing what to build and why), estimatedTime (e.g., "2-4 weeks")

4. **Networking - People to Connect With** (5 real people):
   - IMPORTANT: These should be REAL, well-known professionals in this field
   - Search for actual industry leaders, influencers, popular content creators, authors, or thought leaders
   - Format: {{"name": "Real Person Name", "title": "Their actual job title", "company": "Their company", "linkedinUrl": "linkedin.com/in/their-profile", "why": "1 sentence on why connect with them"}}
   - Examples: For Software Engineering, might include people like Linus Torvalds, Guido van Rossum, etc.
   - For Product Management: might include Ken Norton, Marty Cagan, etc.

5. **Interview Preparation** (3-4 resources):
   - Each must have: title, type (guide/practice/questions), description (1-2 sentences), url

Return ONLY valid JSON in this exact structure:
{{
  "medianSalary": "$XX,000 - $YY,000",
  "growthOutlook": "Detailed 10-year projection...",
  "learningResources": [
    {{
      "title": "Resource name",
      "type": "course|book|certification|bootcamp",
      "description": "What you'll learn and why it matters",
      "url": "https://...",
      "phase": 1-4
    }}
  ],
  "projects": [
    {{
      "title": "Project name",
      "difficulty": "beginner|intermediate|advanced",
      "description": "What to build, technologies to use, and learning outcomes",
      "estimatedTime": "X weeks",
      "phase": 1-4
    }}
  ],
  "networkingContacts": [
    {{
      "name": "Real Person Name",
      "title": "Their title",
      "company": "Company name",
      "linkedinUrl": "https://linkedin.com/in/...",
      "why": "Why connect with them"
    }}
  ],
  "interviewPrep": [
    {{
      "title": "Resource name",
      "type": "guide|practice|questions",
      "description": "What this covers",
      "url": "https://..."
    }}
  ]
}}

CRITICAL REQUIREMENTS:
- Use REAL market data for salary and growth (2024-2025)
- Networking contacts must be REAL, well-known people in the industry
- All URLs should be real where possible
- Descriptions must be specific and actionable
- Return ONLY valid JSON, no markdown
"""

        # Search YouTube for real videos BEFORE calling LLM
        logger.info(f"Searching YouTube for '{career_name}' videos...")
        youtube_videos = search_career_videos(career_name, max_results=5)

        try:
            logger.info(f"PlanDetailAgent: Generating detailed plan for {career_name}")
            response = await self.llm.chat(prompt)
            content = response.content.strip()

            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)

            # Add real YouTube videos from API search
            result["videos"] = youtube_videos

            logger.info(f"PlanDetailAgent: Successfully generated plan with {len(youtube_videos)} videos, {len(result.get('learningResources', []))} resources, {len(result.get('projects', []))} projects, {len(result.get('networkingContacts', []))} contacts")

            return result

        except Exception as e:
            logger.error(f"PlanDetailAgent error: {e}", exc_info=True)
            # Return minimal fallback with real YouTube videos
            return {
                "medianSalary": "$60,000 - $120,000",
                "growthOutlook": "Data unavailable",
                "videos": youtube_videos,  # Still include real YouTube videos even on error
                "learningResources": [],
                "projects": [],
                "networkingContacts": [],
                "interviewPrep": []
            }
