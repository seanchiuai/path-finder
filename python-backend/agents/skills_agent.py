import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class SkillsAgent:
    """
    Analyzes user's skills, experience, and technical capabilities from transcripts and resumes.
    Extracts both hard skills (technical) and soft skills (interpersonal).
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized SkillsAgent")
    
    async def analyze_skills(self, transcript: str, resume_text: str = None) -> Dict[str, Any]:
        """
        Analyze user's skills from transcript and optional resume text.
        
        Args:
            transcript: User's onboarding transcript
            resume_text: Optional resume text
            
        Returns:
            Structured skills analysis
        """
        logger.info("Starting skills analysis")
        
        try:
            # Combine transcript and resume text for analysis
            combined_text = f"{transcript}\n\n{resume_text or ''}"
            
            # Define the analysis prompt
            prompt = f"""
            Analyze the following user input to extract and categorize their skills:

            User Input:
            {combined_text}

            Please provide a structured analysis of the user's skills in the following JSON format:

            {{
                "technical_skills": [
                    {{
                        "skill": "programming language or technical skill",
                        "proficiency": "beginner|intermediate|advanced|expert",
                        "evidence": "specific evidence from text",
                        "years_experience": estimated_years_or_null
                    }}
                ],
                "soft_skills": [
                    {{
                        "skill": "communication, leadership, etc.",
                        "proficiency": "beginner|intermediate|advanced|expert",
                        "evidence": "specific evidence from text"
                    }}
                ],
                "domain_expertise": [
                    {{
                        "domain": "industry or subject area",
                        "level": "basic|intermediate|advanced|expert",
                        "evidence": "specific evidence from text",
                        "years_experience": estimated_years_or_null
                    }}
                ],
                "learning_aptitude": {{
                    "description": "how quickly they learn new things",
                    "evidence": "specific examples from text"
                }},
                "skill_gaps": [
                    {{
                        "gap": "missing skill mentioned or implied",
                        "importance": "low|medium|high",
                        "suggested_learning_path": "how to acquire this skill"
                    }}
                ],
                "overall_assessment": {{
                    "strengths": ["list of key strengths"],
                    "areas_for_improvement": ["list of improvement areas"],
                    "career_readiness": "not_ready|entry_level|mid_level|senior_level",
                    "recommended_focus_areas": ["areas to focus on for career growth"]
                }}
            }}

            Be specific and evidence-based. Only include skills that you can clearly identify from the text.
            If proficiency or experience cannot be determined, use reasonable estimates based on context.
            """
            
            # For now, return a mock response since we don't have LLM integration yet
            # In a real implementation, this would call the LLM manager
            mock_response = {
                "technical_skills": [
                    {
                        "skill": "Python",
                        "proficiency": "intermediate",
                        "evidence": "mentioned using Python for data analysis projects",
                        "years_experience": 2
                    },
                    {
                        "skill": "Data Analysis",
                        "proficiency": "intermediate",
                        "evidence": "described working with datasets and creating reports",
                        "years_experience": 1.5
                    }
                ],
                "soft_skills": [
                    {
                        "skill": "Communication",
                        "proficiency": "advanced",
                        "evidence": "articulate speaker with clear explanations"
                    },
                    {
                        "skill": "Problem Solving",
                        "proficiency": "intermediate",
                        "evidence": "described approaching challenges systematically"
                    }
                ],
                "domain_expertise": [
                    {
                        "domain": "Business Analysis",
                        "level": "intermediate",
                        "evidence": "mentioned working on business process improvements",
                        "years_experience": 2
                    }
                ],
                "learning_aptitude": {
                    "description": "Quick learner who enjoys tackling new challenges",
                    "evidence": "expressed enthusiasm for learning new technologies"
                },
                "skill_gaps": [
                    {
                        "gap": "Advanced programming concepts",
                        "importance": "medium",
                        "suggested_learning_path": "Take online courses in algorithms and data structures"
                    }
                ],
                "overall_assessment": {
                    "strengths": ["Strong communication skills", "Analytical thinking", "Learning agility"],
                    "areas_for_improvement": ["Technical depth", "Industry experience"],
                    "career_readiness": "entry_level",
                    "recommended_focus_areas": ["Advanced technical skills", "Industry-specific knowledge"]
                }
            }
            
            logger.info("Skills analysis completed successfully")
            return mock_response
            
        except Exception as e:
            logger.error(f"Error in skills analysis: {str(e)}")
            # Return a basic structure even on error
            return {
                "technical_skills": [],
                "soft_skills": [],
                "domain_expertise": [],
                "learning_aptitude": {"description": "Unable to analyze", "evidence": "Error occurred"},
                "skill_gaps": [],
                "overall_assessment": {
                    "strengths": [],
                    "areas_for_improvement": [],
                    "career_readiness": "unknown",
                    "recommended_focus_areas": []
                }
            }
    
    def _extract_years_from_text(self, text: str) -> float:
        """Extract years of experience from text using simple heuristics."""
        import re
        
        # Look for patterns like "2 years", "3+ years", "5-7 years"
        year_patterns = [
            r'(\d+)\+?\s*years?',
            r'(\d+)-(\d+)\s*years?',
            r'for\s+(\d+)\s*years?'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    # Range like "3-5 years" - take average
                    return (float(matches[0][0]) + float(matches[0][1])) / 2
                else:
                    return float(matches[0])
        
        return 0.0