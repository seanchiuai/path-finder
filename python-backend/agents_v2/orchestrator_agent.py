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

    def _normalize_scores(self, recommendations: list) -> list:
        """
        Validate and normalize fit scores to ensure realistic distribution.

        Target distribution:
        - 10-12 careers: 85-95 (top ~50%)
        - 6-8 careers: 70-84 (middle ~30%)
        - 4-5 careers: 60-69 (lower ~20%)
        """
        if not recommendations:
            return recommendations

        # Sort by current fit score (descending)
        recommendations.sort(key=lambda x: x.get("fitScore", 0), reverse=True)

        # Check if scores are too clustered (all above 85)
        scores = [r.get("fitScore", 0) for r in recommendations]
        high_scores = sum(1 for s in scores if s >= 85)
        mid_scores = sum(1 for s in scores if 70 <= s < 85)
        low_scores = sum(1 for s in scores if 60 <= s < 70)

        total = len(recommendations)

        # If distribution is already good, return as-is
        if (high_scores <= total * 0.6 and
            mid_scores >= total * 0.2 and
            low_scores >= total * 0.15):
            logger.info(f"Score distribution is healthy: {high_scores} high, {mid_scores} mid, {low_scores} low")
            return recommendations

        # Otherwise, redistribute scores
        logger.info(f"Normalizing scores. Original distribution: {high_scores} high, {mid_scores} mid, {low_scores} low")

        # Target counts based on total recommendations
        target_high = int(total * 0.5)  # Top 50%
        target_mid = int(total * 0.3)   # Middle 30%
        target_low = total - target_high - target_mid  # Remaining ~20%

        for i, rec in enumerate(recommendations):
            if i < target_high:
                # Top tier: 85-95
                # Spread evenly within range based on rank
                new_score = 95 - (i * (10 / max(target_high - 1, 1)))
                rec["fitScore"] = max(85, int(new_score))
            elif i < target_high + target_mid:
                # Middle tier: 70-84
                rank_in_tier = i - target_high
                new_score = 84 - (rank_in_tier * (14 / max(target_mid - 1, 1)))
                rec["fitScore"] = max(70, int(new_score))
            else:
                # Lower tier: 60-69
                rank_in_tier = i - target_high - target_mid
                new_score = 69 - (rank_in_tier * (9 / max(target_low - 1, 1)))
                rec["fitScore"] = max(60, int(new_score))

        logger.info(f"Normalized score distribution: top={target_high}, mid={target_mid}, low={target_low}")
        return recommendations

    async def recommend(self, profile: Dict[str, Any], transcript: str = "") -> Dict[str, Any]:
        """
        Recommend careers based on the complete profile using dynamic LLM generation.

        Args:
            profile: Dict containing skills, personality, passions, goals, values
            transcript: Original conversation transcript for context

        Returns:
            Dict with 'recommendations' array of 20+ career recommendations
        """
        # Build a summary of the profile for the LLM
        skills_summary = ", ".join([s.get("name", "") for s in profile.get("skills", [])[:15]])
        personality_summary = ", ".join([p.get("name", "") for p in profile.get("personality", [])[:8]])
        passions_summary = ", ".join([p.get("name", "") for p in profile.get("passions", [])[:8]])
        values_summary = ", ".join([v.get("name", "") for v in profile.get("values", [])[:8]])
        goals_summary = str(profile.get("goals", {}))

        # Truncate transcript if too long (keep first and last parts for context)
        max_transcript_length = 4000
        transcript_context = transcript if len(transcript) <= max_transcript_length else (
            transcript[:2000] + "\n\n[... conversation continues ...]\n\n" + transcript[-2000:]
        )

        prompt = f"""
You are an expert career advisor with deep knowledge of hundreds of career paths across all industries.

ORIGINAL CONVERSATION TRANSCRIPT:
{transcript_context}

EXTRACTED PROFILE SUMMARY:
- Skills: {skills_summary}
- Personality Traits: {personality_summary}
- Passions & Interests: {passions_summary}
- Career Goals: {goals_summary}
- Core Values: {values_summary}

Your task: Recommend the TOP 20-25 REAL CAREER PATHS based on what the user ACTUALLY discussed in the conversation above.

CRITICAL - READ THE CONVERSATION CAREFULLY:
- Pay attention to specific constraints they mentioned (remote work, time availability, location, etc.)
- Notice what they expressed enthusiasm vs. hesitation about
- Consider their current situation and transition preferences
- Look for careers they explicitly mentioned interest in OR ruled out
- The "whyGoodFit" MUST reference specific things they said in the conversation

Think broadly across these industries:
- Technology (software engineering, data science, cybersecurity, AI/ML, cloud architecture, DevOps, etc.)
- Creative & Design (UX/UI design, product design, content creation, digital marketing, brand strategy)
- Business & Management (product management, project management, business analysis, consulting, operations)
- Healthcare (health tech, clinical research, healthcare administration, medical devices)
- Education & Training (instructional design, corporate training, edtech, curriculum development)
- Finance & Fintech (financial analysis, data analytics in finance, fintech product roles)
- Science & Engineering (research, R&D, various engineering disciplines)
- Sales & Growth (technical sales, growth marketing, partnerships, business development)
- Other relevant industries and emerging fields

SCORE DISTRIBUTION REQUIREMENTS (MANDATORY):
You MUST spread scores across a realistic range. Do NOT make everything 85-95%.

Required distribution for your 20-25 careers:
- 10-12 careers with scores 85-95 (excellent fits, clear alignment)
- 6-8 careers with scores 70-84 (good fits, some gaps or adjacencies)
- 4-5 careers with scores 60-69 (interesting options, more exploration needed)

For each career, calculate fit score (0-100) based on:
1. Skill overlap and transferability (35% weight)
2. Personality alignment (25% weight)
3. Values match (20% weight)
4. Passion relevance (15% weight)
5. Career goals alignment (5% weight)

Return JSON with 20-25 careers sorted by fit score (highest first):

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
      "whyGoodFit": "2-3 sentences explaining why this career matches what they ACTUALLY SAID in the conversation. Quote or reference specific things they mentioned."
    }},
    ...
  ]
}}

CRITICAL REQUIREMENTS:
- Return EXACTLY 20-25 careers (not less!)
- Follow the score distribution requirements (don't make everything 85+!)
- Make careers REAL and specific (not vague or generic)
- Base recommendations on the ACTUAL CONVERSATION, not just the summary
- Each "whyGoodFit" must reference specific conversation details
- Provide realistic 2024-2025 salary ranges
- Estimated transition time should be realistic
- Return ONLY valid JSON, no markdown, no additional text
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

            # Validate and normalize score distribution
            recommendations = self._normalize_scores(recommendations)

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
