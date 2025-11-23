"""
SkillAgent: Extracts and analyzes user skills from onboarding data.
Uses SpoonOS ToolCallAgent pattern.
"""

from typing import Dict, Any
import logging
from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.chat import ChatBot

logger = logging.getLogger(__name__)


class SkillAgent:
    """
    Analyzes transcript and resume to extract skills with proficiency levels.
    """

    def __init__(self, llm: ChatBot):
        self.llm = llm

    async def analyze(self, transcript: str, resume_text: str = "") -> Dict[str, Any]:
        """
        Extract skills from the user's transcript and resume.

        Returns:
            Dict with 'skills' array containing {name, level, yearsOfExperience}
        """
        prompt = f"""
You are a career skills analyst. Analyze the following information and extract the user's skills.

Transcript from interview:
{transcript}

Resume (if provided):
{resume_text or "Not provided"}

Extract and return a JSON object with this structure:
{{
  "skills": [
    {{"name": "skill_name", "level": "beginner|intermediate|advanced|expert", "yearsOfExperience": 0.5}}
  ]
}}

Focus on:
- Technical skills (programming languages, tools, platforms)
- Soft skills (communication, leadership, problem-solving)
- Domain knowledge
- Certifications or credentials mentioned

Infer proficiency levels based on context clues like:
- Years of experience mentioned
- Projects completed
- Depth of knowledge demonstrated
- Self-assessment if provided

Return ONLY valid JSON, no additional text.
"""

        try:
            response = await self.llm.chat(prompt)
            # Parse the LLM response
            import json
            content = response.content.strip()

            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)
            logger.info(f"SkillAgent extracted {len(result.get('skills', []))} skills")
            return result
        except Exception as e:
            logger.error(f"SkillAgent error: {e}")
            # Return minimal fallback
            return {"skills": []}
