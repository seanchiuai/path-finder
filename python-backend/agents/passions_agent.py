import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class PassionsAgent:
    """
    Analyzes user's interests, passions, and intrinsic motivations.
    Identifies what activities energize them and what they genuinely enjoy doing.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized PassionsAgent")
    
    async def analyze_passions(self, transcript: str, resume_text: str = None) -> Dict[str, Any]:
        """
        Analyze user's passions and interests from transcript and optional resume text.
        
        Args:
            transcript: User's onboarding transcript
            resume_text: Optional resume text
            
        Returns:
            Structured passions and interests analysis
        """
        logger.info("Starting passions analysis")
        
        try:
            # Combine transcript and resume text for analysis
            combined_text = f"{transcript}\n\n{resume_text or ''}"
            
            # Define the analysis prompt
            prompt = f"""
            Analyze the following user input to identify their passions, interests, and intrinsic motivations:

            User Input:
            {combined_text}

            Please provide a structured analysis of the user's passions in the following JSON format:

            {{
                "core_passions": [
                    {{
                        "passion": "primary interest or passion",
                        "intensity": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "energy_level": "draining|neutral|energizing|highly_energizing",
                        "related_activities": ["specific activities they enjoy"]
                    }}
                ],
                "interest_areas": [
                    {{
                        "area": "broad area of interest",
                        "level": "casual|interested|engaged|highly_engaged",
                        "evidence": "specific evidence from text",
                        "potential_careers": ["career paths related to this interest"]
                    }}
                ],
                "intrinsic_motivators": [
                    {{
                        "motivator": "what internally drives them",
                        "importance": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "manifestation": "how this shows up in their work/life"
                    }}
                ],
                "flow_activities": [
                    {{
                        "activity": "activity where they lose track of time",
                        "frequency": "rare|occasional|regular|frequent",
                        "evidence": "specific evidence from text",
                        "why_engaging": "what makes this activity engaging for them"
                    }}
                ],
                "values_driven_interests": [
                    {{
                        "value": "core value that drives interests",
                        "related_interests": ["interests connected to this value"],
                        "evidence": "specific evidence from text",
                        "career_alignment": ["careers that align with this value"]
                    }}
                ],
                "curiosity_patterns": {{
                    "learning_style": "how they prefer to learn new things",
                    "exploration_approach": "how they explore new interests",
                    "depth_vs_breadth": "preference for deep expertise vs broad knowledge",
                    "evidence": "specific examples from text"
                }},
                "passion_gaps": [
                    {{
                        "missing_passion": "area they haven't explored but might enjoy",
                        "reasoning": "why this might interest them based on other patterns",
                        "suggested_exploration": "how to explore this area"
                    }}
                ],
                "overall_assessment": {{
                    "passion_profile": "summary of their passion patterns",
                    "most_energizing_themes": ["common themes in energizing activities"],
                    "ideal_work_environment": "environment that would support their passions",
                    "recommended_career_directions": ["career paths aligned with passions"],
                    "passion_development_suggestions": ["how to further develop their interests"]
                }}
            }}

            Focus on what genuinely excites and energizes the person, not just what they're good at.
            Look for patterns in what they talk about with enthusiasm, what they spend time on voluntarily,
            and what problems they're naturally drawn to solve.
            """
            
            # For now, return a mock response since we don't have LLM integration yet
            # In a real implementation, this would call the LLM manager
            mock_response = {
                "core_passions": [
                    {
                        "passion": "Problem Solving",
                        "intensity": 0.8,
                        "evidence": "Frequently mentioned enjoying the challenge of figuring things out",
                        "energy_level": "highly_energizing",
                        "related_activities": ["Analyzing data", "Finding patterns", "Creating solutions"]
                    },
                    {
                        "passion": "Helping Others",
                        "intensity": 0.7,
                        "evidence": "Expressed satisfaction from making a positive impact on people's lives",
                        "energy_level": "energizing",
                        "related_activities": ["Mentoring", "Teaching", "Supporting colleagues"]
                    }
                ],
                "interest_areas": [
                    {
                        "area": "Technology and Innovation",
                        "level": "highly_engaged",
                        "evidence": "Showed excitement when discussing new technologies and their applications",
                        "potential_careers": ["Product Management", "UX Design", "Technology Consulting"]
                    },
                    {
                        "area": "Business Strategy",
                        "level": "engaged",
                        "evidence": "Enjoyed discussing how businesses operate and compete",
                        "potential_careers": ["Business Analysis", "Strategy Consulting", "Operations Management"]
                    }
                ],
                "intrinsic_motivators": [
                    {
                        "motivator": "Making a meaningful impact",
                        "importance": 0.9,
                        "evidence": "Repeatedly mentioned wanting work that matters and helps others",
                        "manifestation": "Chooses projects based on their potential positive impact"
                    },
                    {
                        "motivator": "Continuous learning and growth",
                        "importance": 0.8,
                        "evidence": "Expressed excitement about learning new skills and taking on challenges",
                        "manifestation": "Seeks out opportunities to expand knowledge and capabilities"
                    }
                ],
                "flow_activities": [
                    {
                        "activity": "Analyzing complex problems",
                        "frequency": "regular",
                        "evidence": "Described getting deeply absorbed in figuring out solutions",
                        "why_engaging": "Combines analytical thinking with creative problem-solving"
                    }
                ],
                "values_driven_interests": [
                    {
                        "value": "Integrity and authenticity",
                        "related_interests": ["Ethical technology", "Transparent business practices"],
                        "evidence": "Emphasized importance of doing the right thing even when difficult",
                        "career_alignment": ["Ethics consulting", "Corporate social responsibility", "Non-profit work"]
                    }
                ],
                "curiosity_patterns": {
                    "learning_style": "Prefers hands-on learning with real-world applications",
                    "exploration_approach": "Systematic exploration starting with foundational concepts",
                    "depth_vs_breadth": "Balanced approach with tendency toward depth in areas of strong interest",
                    "evidence": "Described structured approach to learning new topics"
                },
                "passion_gaps": [
                    {
                        "missing_passion": "Creative expression through arts or design",
                        "reasoning": "Strong analytical orientation might benefit from more creative outlets",
                        "suggested_exploration": "Try design thinking workshops or creative problem-solving exercises"
                    }
                ],
                "overall_assessment": {
                    "passion_profile": "Analytically-minded problem solver driven by impact and continuous learning",
                    "most_energizing_themes": ["Solving meaningful problems", "Helping others through work", "Learning and growing"],
                    "ideal_work_environment": "Environment that combines analytical challenges with opportunities to make a positive impact",
                    "recommended_career_directions": ["Social impact technology", "Business analysis for mission-driven organizations", "Product management for educational/healthcare tools"],
                    "passion_development_suggestions": ["Seek roles that combine analytical rigor with social impact", "Look for opportunities to mentor others", "Focus on industries aligned with personal values"]
                }
            }
            
            logger.info("Passions analysis completed successfully")
            return mock_response
            
        except Exception as e:
            logger.error(f"Error in passions analysis: {str(e)}")
            # Return a basic structure even on error
            return {
                "core_passions": [],
                "interest_areas": [],
                "intrinsic_motivators": [],
                "flow_activities": [],
                "values_driven_interests": [],
                "curiosity_patterns": {
                    "learning_style": "Unable to analyze",
                    "exploration_approach": "Unable to analyze",
                    "depth_vs_breadth": "Unable to analyze",
                    "evidence": "Error occurred"
                },
                "passion_gaps": [],
                "overall_assessment": {
                    "passion_profile": "Unable to analyze passions",
                    "most_energizing_themes": [],
                    "ideal_work_environment": "Unable to determine",
                    "recommended_career_directions": [],
                    "passion_development_suggestions": []
                }
            }