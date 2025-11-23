import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class GoalsAgent:
    """
    Analyzes user's career goals, aspirations, and life objectives.
    Identifies short-term and long-term goals, and assesses their clarity and feasibility.
    """
    
    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        logger.info("Initialized GoalsAgent")
    
    async def analyze_goals(self, transcript: str, resume_text: str = None) -> Dict[str, Any]:
        """
        Analyze user's career goals and aspirations from transcript and optional resume text.
        
        Args:
            transcript: User's onboarding transcript
            resume_text: Optional resume text
            
        Returns:
            Structured goals analysis with timeline and feasibility assessment
        """
        logger.info("Starting goals analysis")
        
        try:
            # Combine transcript and resume text for analysis
            combined_text = f"{transcript}\n\n{resume_text or ''}"
            
            # Define the analysis prompt
            prompt = f"""
            Analyze the following user input to identify their career goals, aspirations, and life objectives:

            User Input:
            {combined_text}

            Please provide a structured analysis of the user's goals in the following JSON format:

            {{
                "short_term_goals": [
                    {{
                        "goal": "specific short-term objective (0-2 years)",
                        "timeframe": "immediate|0-6 months|6-12 months|1-2 years",
                        "priority": "high|medium|low",
                        "specificity": "vague|somewhat_specific|very_specific|highly_specific",
                        "feasibility": "low|medium|high|very_high",
                        "evidence": "specific evidence from text",
                        "success_criteria": ["how they'll know they've achieved it"],
                        "potential_obstacles": ["likely challenges"],
                        "required_resources": ["what they need to achieve it"]
                    }}
                ],
                "medium_term_goals": [
                    {{
                        "goal": "specific medium-term objective (2-5 years)",
                        "timeframe": "2-3 years|3-5 years",
                        "priority": "high|medium|low",
                        "specificity": "vague|somewhat_specific|very_specific|highly_specific",
                        "feasibility": "low|medium|high|very_high",
                        "evidence": "specific evidence from text",
                        "success_criteria": ["how they'll know they've achieved it"],
                        "potential_obstacles": ["likely challenges"],
                        "required_resources": ["what they need to achieve it"]
                    }}
                ],
                "long_term_goals": [
                    {{
                        "goal": "specific long-term objective (5+ years)",
                        "timeframe": "5-10 years|10+ years|lifetime",
                        "priority": "high|medium|low",
                        "specificity": "vague|somewhat_specific|very_specific|highly_specific",
                        "feasibility": "low|medium|high|very_high",
                        "evidence": "specific evidence from text",
                        "success_criteria": ["how they'll know they've achieved it"],
                        "potential_obstacles": ["likely challenges"],
                        "required_resources": ["what they need to achieve it"]
                    }}
                ],
                "goal_alignment": {{
                    "internal_consistency": "conflicting|somewhat_aligned|well_aligned|perfectly_aligned",
                    "values_alignment": "conflicting|somewhat_aligned|well_aligned|perfectly_aligned",
                    "skills_alignment": "poor_fit|some_alignment|good_fit|perfect_fit",
                    "lifestyle_alignment": "conflicting|somewhat_aligned|well_aligned|perfectly_aligned",
                    "evidence": "specific evidence from text"
                }},
                "goal_clarity": {{
                    "overall_clarity": "very_unclear|somewhat_unclear|somewhat_clear|very_clear",
                    "specificity_level": "mostly_vague|mixed|mostly_specific|highly_specific",
                    "measurability": "mostly_unmeasurable|mixed|mostly_measurable|highly_measurable",
                    "time_bound": "mostly_timeless|mixed|mostly_time_bound|highly_time_bound",
                    "evidence": "specific evidence from text"
                }},
                "motivation_analysis": {{
                    "primary_motivators": ["main drivers behind goals"],
                    "extrinsic_vs_intrinsic": "mostly_extrinsic|balanced|mostly_intrinsic",
                    "push_vs_pull_factors": "mostly_push_factors|balanced|mostly_pull_factors",
                    "risk_tolerance": "very_conservative|somewhat_conservative|moderate|somewhat_risky|very_risky",
                    "evidence": "specific evidence from text"
                }},
                "goal_gaps": [
                    {{
                        "missing_goal": "important goal area not addressed",
                        "importance": "high|medium|low",
                        "suggested_consideration": "what they should consider adding to their goals",
                        "reasoning": "why this goal area is important"
                    }}
                ],
                "overall_assessment": {{
                    "goal_maturity": "very_early|early_development|developing|well_developed|highly_developed",
                    "biggest_strengths": ["strongest aspects of their goal setting"],
                    "biggest_challenges": ["main challenges they'll face"],
                    "recommended_next_steps": ["immediate actions to take"],
                    "timeline_realism": "very_unrealistic|somewhat_unrealistic|realistic|very_realistic"
                }}
            }}

            Be specific and evidence-based. Assess not just what goals they state, but also their clarity,
            feasibility, and alignment with their skills, values, and circumstances.
            """
            
            # For now, return a mock response since we don't have LLM integration yet
            # In a real implementation, this would call the LLM manager
            mock_response = {
                "short_term_goals": [
                    {
                        "goal": "Learn Python programming",
                        "timeframe": "6-12 months",
                        "priority": "high",
                        "specificity": "very_specific",
                        "feasibility": "high",
                        "evidence": "Explicitly stated wanting to learn Python for career transition",
                        "success_criteria": ["Complete online Python course", "Build 3 small projects", "Apply Python in current job"],
                        "potential_obstacles": ["Time management", "Technical learning curve"],
                        "required_resources": ["Online course subscription", "Practice time", "Mentorship"]
                    },
                    {
                        "goal": "Network with tech professionals",
                        "timeframe": "0-6 months",
                        "priority": "medium",
                        "specificity": "somewhat_specific",
                        "feasibility": "high",
                        "evidence": "Mentioned wanting to connect with people in target industry",
                        "success_criteria": ["Attend 2 networking events", "Connect with 10 professionals on LinkedIn", "Schedule 5 informational interviews"],
                        "potential_obstacles": ["Social anxiety", "Limited time"],
                        "required_resources": ["Networking event fees", "LinkedIn Premium", "Time for meetings"]
                    }
                ],
                "medium_term_goals": [
                    {
                        "goal": "Transition to product management role",
                        "timeframe": "2-3 years",
                        "priority": "high",
                        "specificity": "very_specific",
                        "feasibility": "medium",
                        "evidence": "Clearly stated career goal of becoming a product manager",
                        "success_criteria": ["Complete relevant certifications", "Gain 1 year of relevant experience", "Land product management job"],
                        "potential_obstacles": ["Competitive job market", "Experience requirements"],
                        "required_resources": ["Certification programs", "Mentorship", "Time for skill development"]
                    }
                ],
                "long_term_goals": [
                    {
                        "goal": "Start own tech company",
                        "timeframe": "10+ years",
                        "priority": "medium",
                        "specificity": "somewhat_specific",
                        "feasibility": "low",
                        "evidence": "Mentioned entrepreneurial aspirations as long-term dream",
                        "success_criteria": ["Gain industry experience", "Build network", "Develop business idea", "Secure funding"],
                        "potential_obstacles": ["Financial risk", "Market competition", "Experience gap"],
                        "required_resources": ["Capital", "Industry experience", "Network", "Business knowledge"]
                    }
                ],
                "goal_alignment": {
                    "internal_consistency": "well_aligned",
                    "values_alignment": "well_aligned",
                    "skills_alignment": "some_alignment",
                    "lifestyle_alignment": "somewhat_aligned",
                    "evidence": "Goals show progression from current skills to desired outcomes"
                },
                "goal_clarity": {
                    "overall_clarity": "somewhat_clear",
                    "specificity_level": "mixed",
                    "measurability": "mostly_measurable",
                    "time_bound": "mostly_time_bound",
                    "evidence": "Some goals are very specific while others need more definition"
                },
                "motivation_analysis": {
                    "primary_motivators": ["Career growth", "Financial stability", "Personal fulfillment"],
                    "extrinsic_vs_intrinsic": "balanced",
                    "push_vs_pull_factors": "mostly_pull_factors",
                    "risk_tolerance": "moderate",
                    "evidence": "Goals show mix of external opportunities and internal desires"
                },
                "goal_gaps": [
                    {
                        "missing_goal": "Financial planning objectives",
                        "importance": "high",
                        "suggested_consideration": "Include specific financial targets and savings goals",
                        "reasoning": "Career transitions require financial planning"
                    }
                ],
                "overall_assessment": {
                    "goal_maturity": "developing",
                    "biggest_strengths": ["Clear career direction", "Realistic timelines", "Mix of short and long-term goals"],
                    "biggest_challenges": ["Some goals need more specificity", "Experience gaps need addressing"],
                    "recommended_next_steps": ["Break down medium-term goals into smaller milestones", "Seek mentorship in target field", "Start building relevant skills immediately"],
                    "timeline_realism": "realistic"
                }
            }
            
            logger.info("Goals analysis completed successfully")
            return mock_response
            
        except Exception as e:
            logger.error(f"Error in goals analysis: {str(e)}")
            # Return a basic structure even on error
            return {
                "short_term_goals": [],
                "medium_term_goals": [],
                "long_term_goals": [],
                "goal_alignment": {
                    "internal_consistency": "unable_to_assess",
                    "values_alignment": "unable_to_assess",
                    "skills_alignment": "unable_to_assess",
                    "lifestyle_alignment": "unable_to_assess",
                    "evidence": "Error occurred"
                },
                "goal_clarity": {
                    "overall_clarity": "unable_to_assess",
                    "specificity_level": "unable_to_assess",
                    "measurability": "unable_to_assess",
                    "time_bound": "unable_to_assess",
                    "evidence": "Error occurred"
                },
                "motivation_analysis": {
                    "primary_motivators": [],
                    "extrinsic_vs_intrinsic": "unable_to_assess",
                    "push_vs_pull_factors": "unable_to_assess",
                    "risk_tolerance": "unable_to_assess",
                    "evidence": "Error occurred"
                },
                "goal_gaps": [],
                "overall_assessment": {
                    "goal_maturity": "unable_to_assess",
                    "biggest_strengths": [],
                    "biggest_challenges": ["Analysis failed"],
                    "recommended_next_steps": ["Please provide more specific goal information"],
                    "timeline_realism": "unable_to_assess"
                }
            }