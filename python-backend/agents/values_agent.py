import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class ValuesAgent:
    """
    Analyzes user's core values, ethical principles, and what matters most to them in work and life.
    Identifies value-based decision making patterns and non-negotiables.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized ValuesAgent")
    
    async def analyze_values(self, transcript: str, resume_text: str = None) -> Dict[str, Any]:
        """
        Analyze user's values and ethical principles from transcript and optional resume text.
        
        Args:
            transcript: User's onboarding transcript
            resume_text: Optional resume text
            
        Returns:
            Structured values analysis with priority and career alignment
        """
        logger.info("Starting values analysis")
        
        try:
            # Combine transcript and resume text for analysis
            combined_text = f"{transcript}\n\n{resume_text or ''}"
            
            # Define the analysis prompt
            prompt = f"""
            Analyze the following user input to identify their core values, ethical principles, and what matters most to them:

            User Input:
            {combined_text}

            Please provide a structured analysis of the user's values in the following JSON format:

            {{
                "core_values": [
                    {{
                        "value": "fundamental value or principle",
                        "importance": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "non_negotiable": true|false,
                        "career_implications": ["how this affects career choices"],
                        "life_priority": "high|medium|low"
                    }}
                ],
                "work_values": [
                    {{
                        "value": "work-related value or principle",
                        "importance": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "must_have_in_career": true|false,
                        "deal_breakers": ["what they absolutely won't accept"],
                        "ideal_manifestation": "how they'd like to see this in work"
                    }}
                ],
                "ethical_principles": [
                    {{
                        "principle": "ethical principle or moral stance",
                        "strength": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "career_impact": "how this limits or directs career choices",
                        "compromise_willingness": "none|minimal|moderate|high",
                        "examples": ["specific situations where this would apply"]
                    }}
                ],
                "impact_priorities": [
                    {{
                        "impact_area": "area where they want to make a difference",
                        "priority": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "preferred_scope": "individual|community|societal|global",
                        "time_horizon": "immediate|short_term|long_term|generational",
                        "measurement_preference": "how they want to measure impact"
                    }}
                ],
                "lifestyle_values": [
                    {{
                        "lifestyle_aspect": "aspect of lifestyle that's important",
                        "importance": 0.0, // 0.0 to 1.0
                        "evidence": "specific evidence from text",
                        "non_negotiables": ["what they won't compromise on"],
                        "flexibility": "none|minimal|moderate|high",
                        "career_implications": ["how this affects career choices"]
                    }}
                ],
                "decision_making_patterns": {{
                    "primary_criteria": ["main factors in decisions"],
                    "values_vs_practical": "values_first|balanced|practical_first",
                    "long_term_vs_short_term": "long_term_focused|balanced|short_term_focused",
                    "individual_vs_collective": "individual_first|balanced|collective_first",
                    "evidence": "specific examples from text"
                }},
                "value_conflicts": [
                    {{
                        "conflict": "potential conflict between values",
                        "severity": "low|medium|high",
                        "likely_scenarios": ["situations where this conflict might arise"],
                        "typical_resolution": "how they usually resolve such conflicts",
                        "career_implications": ["how this affects career decisions"]
                    }}
                ],
                "overall_assessment": {{
                    "value_system_summary": "summary of their core value system",
                    "most_defining_values": ["values that most define them"],
                    "career_non_negotiables": ["absolute requirements for career satisfaction"],
                    "ideal_organization_culture": "description of perfect cultural fit",
                    "potential_value_based_careers": ["careers that align with their values"],
                    "values_development_suggestions": ["how to better align career with values"]
                }}
            }}

            Focus on deeply held beliefs and principles, not just preferences.
            Identify what they consider fundamentally right or wrong, what they're willing to sacrifice for,
            and what brings them meaning and purpose. Look for both explicit statements and implicit values
            revealed through their priorities and decision-making patterns.
            """
            
            # For now, return a mock response since we don't have LLM integration yet
            # In a real implementation, this would call the LLM manager
            mock_response = {
                "core_values": [
                    {
                        "value": "Integrity and Authenticity",
                        "importance": 0.9,
                        "evidence": "Emphasized importance of being true to oneself and doing the right thing",
                        "non_negotiable": True,
                        "career_implications": ["Must work for ethical companies", "Cannot compromise values for success"],
                        "life_priority": "high"
                    },
                    {
                        "value": "Continuous Growth and Learning",
                        "importance": 0.8,
                        "evidence": "Repeatedly mentioned importance of personal and professional development",
                        "non_negotiable": False,
                        "career_implications": ["Needs opportunities for advancement", "Values skill development"],
                        "life_priority": "high"
                    }
                ],
                "work_values": [
                    {
                        "value": "Meaningful Impact",
                        "importance": 0.85,
                        "evidence": "Stated that work must contribute to something larger than themselves",
                        "must_have_in_career": True,
                        "deal_breakers": ["Purely profit-driven work", "Work that harms others"],
                        "ideal_manifestation": "Work that directly improves people's lives or society"
                    },
                    {
                        "value": "Work-Life Balance",
                        "importance": 0.7,
                        "evidence": "Mentioned importance of having time for family and personal interests",
                        "must_have_in_career": False,
                        "deal_breakers": ["Consistent 60+ hour weeks", "Frequent weekend work"],
                        "ideal_manifestation": "Flexible schedule with reasonable hours"
                    }
                ],
                "ethical_principles": [
                    {
                        "principle": "Honesty and Transparency",
                        "strength": 0.9,
                        "evidence": "Emphasized importance of truthfulness even when difficult",
                        "career_impact": "May struggle in environments with secrecy or deception",
                        "compromise_willingness": "none",
                        "examples": ["Won't mislead customers", "Values transparent communication"]
                    }
                ],
                "impact_priorities": [
                    {
                        "impact_area": "Individual Empowerment",
                        "priority": 0.8,
                        "evidence": "Talked about helping people reach their potential",
                        "preferred_scope": "individual",
                        "time_horizon": "long_term",
                        "measurement_preference": "Seeing people grow and succeed"
                    },
                    {
                        "impact_area": "Educational Access",
                        "priority": 0.7,
                        "evidence": "Mentioned passion for making education more accessible",
                        "preferred_scope": "community",
                        "time_horizon": "generational",
                        "measurement_preference": "Number of people reached with educational resources"
                    }
                ],
                "lifestyle_values": [
                    {
                        "lifestyle_aspect": "Family Time",
                        "importance": 0.8,
                        "evidence": "Repeatedly mentioned family as top priority",
                        "non_negotiables": ["Must be home for dinner most nights", "Weekends primarily for family"],
                        "flexibility": "minimal",
                        "career_implications": ["Limited travel requirements", "Local job preferences"]
                    }
                ],
                "decision_making_patterns": {
                    "primary_criteria": ["Values alignment", "Long-term impact", "Family considerations"],
                    "values_vs_practical": "values_first",
                    "long_term_vs_short_term": "long_term_focused",
                    "individual_vs_collective": "balanced",
                    "evidence": "Described weighing decisions against core values and long-term impact"
                },
                "value_conflicts": [
                    {
                        "conflict": "Career ambition vs. family time",
                        "severity": "medium",
                        "likely_scenarios": ["High-growth opportunities requiring relocation", "Leadership roles with extensive travel"],
                        "typical_resolution": "Family needs take precedence but seek creative solutions",
                        "career_implications": ["May pass up some opportunities", "Seeks flexible or remote work options"]
                    }
                ],
                "overall_assessment": {
                    "value_system_summary": "Values-driven professional prioritizing integrity, growth, and meaningful impact",
                    "most_defining_values": ["Integrity", "Continuous learning", "Meaningful impact"],
                    "career_non_negotiables": ["Ethical work environment", "Opportunities for growth", "Reasonable work-life balance"],
                    "ideal_organization_culture": "Ethical, transparent organization focused on positive impact with employee development opportunities",
                    "potential_value_based_careers": ["Education technology", "Non-profit leadership", "Ethical consulting", "Social entrepreneurship"],
                    "values_development_suggestions": ["Seek roles in mission-driven organizations", "Look for companies with strong ethical cultures", "Prioritize long-term value alignment over short-term gains"]
                }
            }
            
            logger.info("Values analysis completed successfully")
            return mock_response
            
        except Exception as e:
            logger.error(f"Error in values analysis: {str(e)}")
            # Return a basic structure even on error
            return {
                "core_values": [],
                "work_values": [],
                "ethical_principles": [],
                "impact_priorities": [],
                "lifestyle_values": [],
                "decision_making_patterns": {
                    "primary_criteria": [],
                    "values_vs_practical": "unable_to_assess",
                    "long_term_vs_short_term": "unable_to_assess",
                    "individual_vs_collective": "unable_to_assess",
                    "evidence": "Error occurred"
                },
                "value_conflicts": [],
                "overall_assessment": {
                    "value_system_summary": "Unable to analyze values",
                    "most_defining_values": [],
                    "career_non_negotiables": [],
                    "ideal_organization_culture": "Unable to determine",
                    "potential_value_based_careers": [],
                    "values_development_suggestions": []
                }
            }