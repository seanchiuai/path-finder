import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class PersonalityAgent:
    """
    Analyzes user's personality traits, work style preferences, and behavioral characteristics.
    Uses Big Five personality model and work style assessments.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized PersonalityAgent")
    
    async def analyze_personality(self, transcript: str, resume_text: str = None) -> Dict[str, Any]:
        """
        Analyze user's personality traits from transcript and optional resume text.
        
        Args:
            transcript: User's onboarding transcript
            resume_text: Optional resume text
            
        Returns:
            Structured personality analysis using Big Five model
        """
        logger.info("Starting personality analysis")
        
        try:
            # Combine transcript and resume text for analysis
            combined_text = f"{transcript}\n\n{resume_text or ''}"
            
            # Define the analysis prompt
            prompt = f"""
            Analyze the following user input to assess their personality traits and work style preferences:

            User Input:
            {combined_text}

            Please provide a structured personality analysis using the Big Five personality model (OCEAN) in the following JSON format:

            {{
                "big_five_personality": {{
                    "openness": {{
                        "score": 0.0, // 0.0 to 1.0
                        "description": "level of creativity, curiosity, and willingness to try new things",
                        "evidence": "specific examples from text",
                        "career_implications": ["types of roles that suit this level"]
                    }},
                    "conscientiousness": {{
                        "score": 0.0, // 0.0 to 1.0
                        "description": "level of organization, dependability, and goal-orientation",
                        "evidence": "specific examples from text",
                        "career_implications": ["types of roles that suit this level"]
                    }},
                    "extraversion": {{
                        "score": 0.0, // 0.0 to 1.0
                        "description": "level of sociability, assertiveness, and energy from social interaction",
                        "evidence": "specific examples from text",
                        "career_implications": ["types of roles that suit this level"]
                    }},
                    "agreeableness": {{
                        "score": 0.0, // 0.0 to 1.0
                        "description": "level of cooperation, trust, and consideration for others",
                        "evidence": "specific examples from text",
                        "career_implications": ["types of roles that suit this level"]
                    }},
                    "neuroticism": {{
                        "score": 0.0, // 0.0 to 1.0 (inverted - lower is better)
                        "description": "level of emotional stability and stress resilience",
                        "evidence": "specific examples from text",
                        "career_implications": ["types of roles that suit this level"]
                    }}
                }},
                "work_style_preferences": {{
                    "team_vs_solo": {{
                        "preference": "team|solo|balanced",
                        "strength": 0.0, // 0.0 to 1.0
                        "evidence": "specific examples from text"
                    }},
                    "structured_vs_flexible": {{
                        "preference": "structured|flexible|balanced",
                        "strength": 0.0, // 0.0 to 1.0
                        "evidence": "specific examples from text"
                    }},
                    "fast_vs_deliberate": {{
                        "preference": "fast-paced|deliberate|balanced",
                        "strength": 0.0, // 0.0 to 1.0
                        "evidence": "specific examples from text"
                    }},
                    "creative_vs_analytical": {{
                        "preference": "creative|analytical|balanced",
                        "strength": 0.0, // 0.0 to 1.0
                        "evidence": "specific examples from text"
                    }}
                }},
                "communication_style": {{
                    "direct_vs_diplomatic": "direct|diplomatic|adaptive",
                    "verbal_vs_written": "verbal|written|balanced",
                    "formal_vs_casual": "formal|casual|adaptive",
                    "evidence": "specific examples from text"
                }},
                "stress_response": {{
                    "under_pressure": "description of behavior under stress",
                    "conflict_resolution": "approach to handling conflicts",
                    "adaptability": "ability to handle change and uncertainty",
                    "evidence": "specific examples from text"
                }},
                "motivation_factors": {{
                    "intrinsic_motivators": ["what internally drives them"],
                    "extrinsic_motivators": ["what external rewards motivate them"],
                    "values_alignment": ["what values are important to them"],
                    "evidence": "specific examples from text"
                }},
                "overall_assessment": {{
                    "personality_summary": "brief summary of key personality traits",
                    "ideal_work_environment": "description of optimal work setting",
                    "potential_challenges": ["likely challenges in different work environments"],
                    "recommended_career_types": ["types of careers that would suit this personality"],
                    "team_role_suggestions": ["suggested roles within teams"]
                }}
            }}

            Be specific and evidence-based. Use the full range of scores (0.0-1.0) based on the evidence provided.
            Consider both what is explicitly stated and what can be inferred from communication style and word choice.
            """
            
            # For now, return a mock response since we don't have LLM integration yet
            # In a real implementation, this would call the LLM manager
            mock_response = {
                "big_five_personality": {
                    "openness": {
                        "score": 0.7,
                        "description": "Moderately high creativity and willingness to try new things",
                        "evidence": "Expressed interest in learning new technologies and exploring different career paths",
                        "career_implications": ["Innovation-focused roles", "Creative problem-solving positions", "Research and development"]
                    },
                    "conscientiousness": {
                        "score": 0.8,
                        "description": "High organization and goal-orientation",
                        "evidence": "Described systematic approach to problem-solving and clear career planning",
                        "career_implications": ["Project management", "Quality assurance", "Operations roles"]
                    },
                    "extraversion": {
                        "score": 0.6,
                        "description": "Moderate sociability with balanced social preferences",
                        "evidence": "Comfortable working both independently and in team settings",
                        "career_implications": ["Collaborative roles", "Client-facing positions", "Team leadership"]
                    },
                    "agreeableness": {
                        "score": 0.7,
                        "description": "Cooperative and considerate of others",
                        "evidence": "Emphasized importance of teamwork and helping colleagues",
                        "career_implications": ["Customer service", "Human resources", "Healthcare"]
                    },
                    "neuroticism": {
                        "score": 0.3,
                        "description": "Low stress reactivity with good emotional stability",
                        "evidence": "Described handling pressure well and maintaining composure",
                        "career_implications": ["High-pressure roles", "Leadership positions", "Crisis management"]
                    }
                },
                "work_style_preferences": {
                    "team_vs_solo": {
                        "preference": "balanced",
                        "strength": 0.6,
                        "evidence": "Expressed enjoyment of both collaborative and independent work"
                    },
                    "structured_vs_flexible": {
                        "preference": "structured",
                        "strength": 0.7,
                        "evidence": "Preferred clear guidelines and systematic approaches"
                    },
                    "fast_vs_deliberate": {
                        "preference": "deliberate",
                        "strength": 0.6,
                        "evidence": "Emphasized thoroughness and careful planning"
                    },
                    "creative_vs_analytical": {
                        "preference": "analytical",
                        "strength": 0.7,
                        "evidence": "Showed strong preference for data-driven decision making"
                    }
                },
                "communication_style": {
                    "direct_vs_diplomatic": "diplomatic",
                    "verbal_vs_written": "balanced",
                    "formal_vs_casual": "professional",
                    "evidence": "Clear and respectful communication with professional tone"
                },
                "stress_response": {
                    "under_pressure": "Remains calm and systematic under pressure",
                    "conflict_resolution": "Prefers collaborative conflict resolution",
                    "adaptability": "Good adaptability to changing circumstances",
                    "evidence": "Described handling workplace challenges constructively"
                },
                "motivation_factors": {
                    "intrinsic_motivators": ["Learning and growth", "Making meaningful contributions", "Problem-solving"],
                    "extrinsic_motivators": ["Recognition", "Career advancement", "Competitive compensation"],
                    "values_alignment": ["Integrity", "Collaboration", "Excellence"],
                    "evidence": "Expressed values-driven approach to career decisions"
                },
                "overall_assessment": {
                    "personality_summary": "Analytical, conscientious professional with balanced social preferences",
                    "ideal_work_environment": "Structured environment with clear expectations and opportunities for growth",
                    "potential_challenges": ["May struggle with highly ambiguous situations", "Could be overwhelmed by excessive social demands"],
                    "recommended_career_types": ["Business analysis", "Project management", "Operations"],
                    "team_role_suggestions": ["Coordinator", "Quality assurance", "Strategic planner"]
                }
            }
            
            logger.info("Personality analysis completed successfully")
            return mock_response
            
        except Exception as e:
            logger.error(f"Error in personality analysis: {str(e)}")
            # Return a basic structure even on error
            return {
                "big_five_personality": {
                    "openness": {"score": 0.5, "description": "Unable to analyze", "evidence": "Error occurred", "career_implications": []},
                    "conscientiousness": {"score": 0.5, "description": "Unable to analyze", "evidence": "Error occurred", "career_implications": []},
                    "extraversion": {"score": 0.5, "description": "Unable to analyze", "evidence": "Error occurred", "career_implications": []},
                    "agreeableness": {"score": 0.5, "description": "Unable to analyze", "evidence": "Error occurred", "career_implications": []},
                    "neuroticism": {"score": 0.5, "description": "Unable to analyze", "evidence": "Error occurred", "career_implications": []}
                },
                "work_style_preferences": {
                    "team_vs_solo": {"preference": "balanced", "strength": 0.5, "evidence": "Unable to analyze"},
                    "structured_vs_flexible": {"preference": "balanced", "strength": 0.5, "evidence": "Unable to analyze"},
                    "fast_vs_deliberate": {"preference": "balanced", "strength": 0.5, "evidence": "Unable to analyze"},
                    "creative_vs_analytical": {"preference": "balanced", "strength": 0.5, "evidence": "Unable to analyze"}
                },
                "communication_style": {"direct_vs_diplomatic": "balanced", "verbal_vs_written": "balanced", "formal_vs_casual": "professional", "evidence": "Error occurred"},
                "stress_response": {"under_pressure": "Unable to analyze", "conflict_resolution": "Unable to analyze", "adaptability": "Unable to analyze", "evidence": "Error occurred"},
                "motivation_factors": {"intrinsic_motivators": [], "extrinsic_motivators": [], "values_alignment": [], "evidence": "Error occurred"},
                "overall_assessment": {
                    "personality_summary": "Unable to analyze personality",
                    "ideal_work_environment": "Unable to determine",
                    "potential_challenges": [],
                    "recommended_career_types": [],
                    "team_role_suggestions": []
                }
            }