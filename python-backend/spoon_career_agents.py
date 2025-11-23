"""
SpoonOS Career Agents with Real LLM Integration
Replaces the mock career_agents.py with real AI-powered analysis
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from uuid import UUID

from spoon_ai.agents.react import ReActAgent
from spoon_ai.llm.config import ConfigurationManager
from spoon_ai.schema import AgentState
from spoon_ai.chat import ChatBot, Memory

logger = logging.getLogger(__name__)

def create_chatbot_with_fallback():
    """Create a ChatBot instance with intelligent provider selection and fallback."""
    try:
        from spoon_ai.llm.config import ConfigurationManager
        config_manager = ConfigurationManager()
        optimal_provider = config_manager.get_default_provider()
        return ChatBot(llm_provider=optimal_provider)
    except Exception as e:
        logger.warning(f"Failed to initialize ChatBot with ConfigurationManager: {e}")
        # Fallback to direct OpenAI configuration
        try:
            from spoon_ai.llm.providers.openai_provider import OpenAIProvider
            provider = OpenAIProvider()
            return ChatBot(llm_provider=provider)
        except Exception as e2:
            logger.error(f"Failed to initialize ChatBot with OpenAIProvider: {e2}")
            raise RuntimeError(f"Failed to initialize ChatBot: {e2}") from e2

@dataclass
class CareerAnalysisResult:
    """Result from career analysis"""
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    career_matches: List[str]
    confidence_score: float
    reasoning: str

class SkillsAgent(ReActAgent):
    """Agent for analyzing user skills and experience"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="SkillsAgent",
            description="Analyzes user skills, experience, and technical background",
            system_prompt="""You are a career skills analyst. Analyze the user's skills, experience, and technical background to identify:
1. Technical skills and proficiencies
2. Transferable skills
3. Experience level and expertise areas
4. Skill gaps and development needs
5. Industry-relevant capabilities

Provide specific, actionable insights about the user's skill profile and career potential.""",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )
        self.analysis_result = None
    
    async def think(self) -> bool:
        """Analyze skills based on user input"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            last_message = messages[-1]
            if "skills" in last_message.content.lower() or "experience" in last_message.content.lower():
                return True
            
            # Check if we have enough information to analyze
            return len(messages) >= 2
        except Exception as e:
            logger.error(f"Error in SkillsAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Perform skills analysis"""
        try:
            # Get conversation context
            messages = self.memory.get_messages()
            user_input = " ".join([msg.content for msg in messages if msg.role == "user"])
            
            # Create analysis prompt
            analysis_prompt = f"""
            Analyze the following user information for career skills and experience:
            {user_input}
            
            Provide a comprehensive skills analysis including:
            1. Technical skills and proficiencies
            2. Transferable skills
            3. Experience level assessment
            4. Industry-relevant capabilities
            5. Skill gaps and recommendations
            6. Career potential based on current skills
            
            Format your response as JSON with the following structure:
            {{
                "technical_skills": ["skill1", "skill2", ...],
                "transferable_skills": ["skill1", "skill2", ...],
                "experience_level": "Junior|Mid-level|Senior|Expert",
                "expertise_areas": ["area1", "area2", ...],
                "skill_gaps": ["gap1", "gap2", ...],
                "career_potential": "Brief assessment of career potential",
                "recommendations": ["recommendation1", "recommendation2", ...]
            }}
            """
            
            # Get analysis from LLM
            response = await self.llm.chat([{"role": "user", "content": analysis_prompt}])
            
            try:
                # Parse JSON response
                analysis_data = json.loads(response.content)
                self.analysis_result = analysis_data
                
                # Format results
                result_str = f"""
Skills Analysis Results:
- Technical Skills: {', '.join(analysis_data.get('technical_skills', []))}
- Transferable Skills: {', '.join(analysis_data.get('transferable_skills', []))}
- Experience Level: {analysis_data.get('experience_level', 'Unknown')}
- Expertise Areas: {', '.join(analysis_data.get('expertise_areas', []))}
- Skill Gaps: {', '.join(analysis_data.get('skill_gaps', []))}
- Career Potential: {analysis_data.get('career_potential', 'Not assessed')}
- Recommendations: {', '.join(analysis_data.get('recommendations', []))}
                """.strip()
                
                return result_str
                
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return f"Skills Analysis: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in SkillsAgent act: {e}")
            return f"Error analyzing skills: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class PersonalityAgent(ReActAgent):
    """Agent for analyzing personality traits using Big Five model"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="PersonalityAgent",
            description="Analyzes personality traits using Big Five model and career alignment",
            system_prompt="""You are a personality analyst specializing in career alignment. Analyze user personality traits using the Big Five model (OCEAN):
1. Openness to Experience
2. Conscientiousness  
3. Extraversion
4. Agreeableness
5. Neuroticism

Identify career types and work environments that align with their personality profile.""",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )
        self.analysis_result = None
    
    async def think(self) -> bool:
        """Determine if we should analyze personality"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            last_message = messages[-1]
            personality_keywords = ["personality", "traits", "behavior", "style", "preferences"]
            return any(keyword in last_message.content.lower() for keyword in personality_keywords)
        except Exception as e:
            logger.error(f"Error in PersonalityAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Perform personality analysis"""
        try:
            messages = self.memory.get_messages()
            user_input = " ".join([msg.content for msg in messages if msg.role == "user"])
            
            analysis_prompt = f"""
            Analyze the personality traits and career alignment for this user:
            {user_input}
            
            Use the Big Five personality model (OCEAN) and provide:
            1. Scores for each trait (1-10 scale)
            2. Career implications for each trait
            3. Ideal work environments
            4. Career types that match this profile
            5. Potential challenges and strengths
            
            Format as JSON:
            {{
                "openness": {{"score": 0, "career_implications": "..."}},
                "conscientiousness": {{"score": 0, "career_implications": "..."}},
                "extraversion": {{"score": 0, "career_implications": "..."}},
                "agreeableness": {{"score": 0, "career_implications": "..."}},
                "neuroticism": {{"score": 0, "career_implications": "..."}},
                "ideal_environments": ["environment1", "environment2"],
                "matching_careers": ["career1", "career2"],
                "strengths": ["strength1", "strength2"],
                "challenges": ["challenge1", "challenge2"]
            }}
            """
            
            response = await self.llm.achat(analysis_prompt)
            
            try:
                analysis_data = json.loads(response.content)
                self.analysis_result = analysis_data
                
                result_str = f"""
Personality Analysis (Big Five):
- Openness: {analysis_data.get('openness', {}).get('score', 'N/A')}/10
- Conscientiousness: {analysis_data.get('conscientiousness', {}).get('score', 'N/A')}/10  
- Extraversion: {analysis_data.get('extraversion', {}).get('score', 'N/A')}/10
- Agreeableness: {analysis_data.get('agreeableness', {}).get('score', 'N/A')}/10
- Neuroticism: {analysis_data.get('neuroticism', {}).get('score', 'N/A')}/10

Ideal Work Environments: {', '.join(analysis_data.get('ideal_environments', []))}
Matching Careers: {', '.join(analysis_data.get('matching_careers', []))}
Strengths: {', '.join(analysis_data.get('strengths', []))}
Challenges: {', '.join(analysis_data.get('challenges', []))}
                """.strip()
                
                return result_str
                
            except json.JSONDecodeError:
                return f"Personality Analysis: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in PersonalityAgent act: {e}")
            return f"Error analyzing personality: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class PassionsAgent(ReActAgent):
    """Agent for analyzing user interests and intrinsic motivations"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="PassionsAgent",
            description="Analyzes user interests, passions, and intrinsic motivations",
            system_prompt="""You are a passion and motivation analyst. Identify user interests, intrinsic motivations, and passion areas that could translate to fulfilling careers. Consider:
1. Natural interests and curiosities
2. Activities that energize vs drain
3. Topics they love learning about
4. Causes or missions they care about
5. Creative or analytical preferences""",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )
        self.analysis_result = None
    
    async def think(self) -> bool:
        """Determine if we should analyze passions"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            last_message = messages[-1]
            passion_keywords = ["passion", "interest", "love", "enjoy", "excited", "motivation", "drive"]
            return any(keyword in last_message.content.lower() for keyword in passion_keywords)
        except Exception as e:
            logger.error(f"Error in PassionsAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Perform passions analysis"""
        try:
            messages = self.memory.get_messages()
            user_input = " ".join([msg.content for msg in messages if msg.role == "user"])
            
            analysis_prompt = f"""
            Analyze the passions, interests, and intrinsic motivations for this user:
            {user_input}
            
            Identify:
            1. Natural interests and curiosities
            2. Activities that energize vs drain them
            3. Topics they love learning about
            4. Causes or missions they care about
            5. Creative vs analytical preferences
            6. Industry areas that align with passions
            
            Format as JSON:
            {{
                "core_passions": ["passion1", "passion2", ...],
                "energizing_activities": ["activity1", "activity2", ...],
                "learning_interests": ["topic1", "topic2", ...],
                "valued_causes": ["cause1", "cause2", ...],
                "creative_vs_analytical": "creative|analytical|balanced",
                "industry_alignments": ["industry1", "industry2", ...],
                "passion_careers": ["career1", "career2", ...],
                "motivation_factors": ["factor1", "factor2", ...]
            }}
            """
            
            response = await self.llm.achat(analysis_prompt)
            
            try:
                analysis_data = json.loads(response.content)
                self.analysis_result = analysis_data
                
                result_str = f"""
Passions & Motivations Analysis:
- Core Passions: {', '.join(analysis_data.get('core_passions', []))}
- Energizing Activities: {', '.join(analysis_data.get('energizing_activities', []))}
- Learning Interests: {', '.join(analysis_data.get('learning_interests', []))}
- Valued Causes: {', '.join(analysis_data.get('valued_causes', []))}
- Creative/Analytical: {analysis_data.get('creative_vs_analytical', 'Unknown')}
- Industry Alignments: {', '.join(analysis_data.get('industry_alignments', []))}
- Passion-Driven Careers: {', '.join(analysis_data.get('passion_careers', []))}
- Key Motivation Factors: {', '.join(analysis_data.get('motivation_factors', []))}
                """.strip()
                
                return result_str
                
            except json.JSONDecodeError:
                return f"Passions Analysis: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in PassionsAgent act: {e}")
            return f"Error analyzing passions: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class GoalsAgent(ReActAgent):
    """Agent for analyzing career goals and aspirations"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="GoalsAgent",
            description="Analyzes career goals, aspirations, and desired outcomes",
            system_prompt="""You are a career goals analyst. Help users clarify and refine their career goals by analyzing:
1. Short-term vs long-term goals
2. Specific vs vague aspirations
3. Realistic vs ambitious targets
4. Personal vs professional balance
5. Timeline and milestone preferences""",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )
        self.analysis_result = None
    
    async def think(self) -> bool:
        """Determine if we should analyze goals"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            last_message = messages[-1]
            goal_keywords = ["goal", "aspiration", "want to", "dream", "target", "objective", "plan"]
            return any(keyword in last_message.content.lower() for keyword in goal_keywords)
        except Exception as e:
            logger.error(f"Error in GoalsAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Perform goals analysis"""
        try:
            messages = self.memory.get_messages()
            user_input = " ".join([msg.content for msg in messages if msg.role == "user"])
            
            analysis_prompt = f"""
            Analyze the career goals and aspirations for this user:
            {user_input}
            
            Provide analysis of:
            1. Short-term goals (1-2 years)
            2. Long-term goals (5+ years)
            3. Goal clarity and specificity
            4. Realistic vs ambitious assessment
            5. Personal vs professional balance
            6. Timeline preferences
            7. Milestone requirements
            
            Format as JSON:
            {{
                "short_term_goals": ["goal1", "goal2", ...],
                "long_term_goals": ["goal1", "goal2", ...],
                "goal_clarity": "clear|vague|mixed",
                "realistic_assessment": "realistic|ambitious|overly_ambitious",
                "balance_assessment": "balanced|work_focused|life_focused",
                "timeline_preference": "aggressive|moderate|flexible",
                "milestone_approach": "structured|flexible|adaptive",
                "goal_refinements": ["refinement1", "refinement2", ...]
            }}
            """
            
            response = await self.llm.achat(analysis_prompt)
            
            try:
                analysis_data = json.loads(response.content)
                self.analysis_result = analysis_data
                
                result_str = f"""
Career Goals Analysis:
- Short-term Goals: {', '.join(analysis_data.get('short_term_goals', []))}
- Long-term Goals: {', '.join(analysis_data.get('long_term_goals', []))}
- Goal Clarity: {analysis_data.get('goal_clarity', 'Unknown')}
- Realistic Assessment: {analysis_data.get('realistic_assessment', 'Unknown')}
- Balance Assessment: {analysis_data.get('balance_assessment', 'Unknown')}
- Timeline Preference: {analysis_data.get('timeline_preference', 'Unknown')}
- Milestone Approach: {analysis_data.get('milestone_approach', 'Unknown')}
- Goal Refinements: {', '.join(analysis_data.get('goal_refinements', []))}
                """.strip()
                
                return result_str
                
            except json.JSONDecodeError:
                return f"Goals Analysis: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in GoalsAgent act: {e}")
            return f"Error analyzing goals: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class ValuesAgent(ReActAgent):
    """Agent for analyzing core values and ethical principles"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="ValuesAgent",
            description="Analyzes core values, ethical principles, and work value alignment",
            system_prompt="""You are a values analyst. Identify user core values, ethical principles, and work-related values that should guide career decisions. Consider:
1. Work-life balance priorities
2. Financial vs fulfillment trade-offs
3. Social impact preferences
4. Autonomy vs structure needs
5. Innovation vs stability preferences
6. Team vs individual work preferences""",
            llm=chatbot,
            memory=memory,
            max_steps=5
        )
        self.analysis_result = None
    
    async def think(self) -> bool:
        """Determine if we should analyze values"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            last_message = messages[-1]
            values_keywords = ["value", "principle", "ethic", "priority", "important", "matter", "care about"]
            return any(keyword in last_message.content.lower() for keyword in values_keywords)
        except Exception as e:
            logger.error(f"Error in ValuesAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Perform values analysis"""
        try:
            messages = self.memory.get_messages()
            user_input = " ".join([msg.content for msg in messages if msg.role == "user"])
            
            analysis_prompt = f"""
            Analyze the core values and ethical principles for this user:
            {user_input}
            
            Identify:
            1. Core work values (autonomy, security, impact, etc.)
            2. Ethical principles and boundaries
            3. Work-life balance priorities
            4. Financial vs fulfillment preferences
            5. Social impact and mission alignment
            6. Innovation vs stability preferences
            7. Team collaboration vs individual work preferences
            
            Format as JSON:
            {{
                "core_work_values": ["value1", "value2", ...],
                "ethical_principles": ["principle1", "principle2", ...],
                "work_life_priority": "work_focused|balanced|life_focused",
                "financial_fulfillment": "financial_first|balanced|fulfillment_first",
                "social_impact_preference": "high|moderate|low",
                "innovation_stability": "innovation_focused|balanced|stability_focused",
                "team_preference": "team_preferred|individual_preferred|flexible",
                "value_aligned_careers": ["career1", "career2", ...],
                "non_negotiables": ["non_negotiable1", "non_negotiable2", ...]
            }}
            """
            
            response = await self.llm.achat(analysis_prompt)
            
            try:
                analysis_data = json.loads(response.content)
                self.analysis_result = analysis_data
                
                result_str = f"""
Core Values Analysis:
- Core Work Values: {', '.join(analysis_data.get('core_work_values', []))}
- Ethical Principles: {', '.join(analysis_data.get('ethical_principles', []))}
- Work-Life Priority: {analysis_data.get('work_life_priority', 'Unknown')}
- Financial vs Fulfillment: {analysis_data.get('financial_fulfillment', 'Unknown')}
- Social Impact Preference: {analysis_data.get('social_impact_preference', 'Unknown')}
- Innovation vs Stability: {analysis_data.get('innovation_stability', 'Unknown')}
- Team Preference: {analysis_data.get('team_preference', 'Unknown')}
- Value-Aligned Careers: {', '.join(analysis_data.get('value_aligned_careers', []))}
- Non-Negotiables: {', '.join(analysis_data.get('non_negotiables', []))}
                """.strip()
                
                return result_str
                
            except json.JSONDecodeError:
                return f"Values Analysis: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in ValuesAgent act: {e}")
            return f"Error analyzing values: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class RecommendationAgent(ReActAgent):
    """Agent for generating career recommendations based on comprehensive analysis"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="RecommendationAgent",
            description="Generates personalized career recommendations based on comprehensive analysis",
            system_prompt="""You are a career recommendation specialist. Synthesize information from skills, personality, passions, goals, and values analyses to generate personalized career recommendations. Consider:
1. Skills-personality alignment
2. Passion-career intersection
3. Goals feasibility assessment
4. Values alignment
5. Market opportunities
6. Growth potential
7. Work-life balance fit""",
            llm=chatbot,
            memory=memory,
            max_steps=7
        )
        self.recommendations = []
    
    async def think(self) -> bool:
        """Determine if we should generate recommendations"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            # Look for signals that we have enough information
            recommendation_keywords = ["recommend", "suggest", "career", "path", "what should", "advice"]
            has_analysis_data = len(messages) > 3  # Assume we have analysis data
            
            last_message = messages[-1]
            has_keyword = any(keyword in last_message.content.lower() for keyword in recommendation_keywords)
            
            return has_keyword or has_analysis_data
        except Exception as e:
            logger.error(f"Error in RecommendationAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Generate career recommendations"""
        try:
            messages = self.memory.get_messages()
            conversation_context = " ".join([msg.content for msg in messages])
            
            recommendation_prompt = f"""
            Based on the comprehensive career analysis in this conversation:
            {conversation_context}
            
            Generate personalized career recommendations that consider:
            1. Skills and experience alignment
            2. Personality fit
            3. Passion and motivation alignment
            4. Goals feasibility
            5. Values alignment
            6. Market opportunities and growth
            7. Work-life balance considerations
            
            Provide 3-5 specific career recommendations with detailed reasoning.
            
            Format as JSON:
            {{
                "recommendations": [
                    {{
                        "career_title": "Specific Job Title",
                        "industry": "Industry Name",
                        "match_score": 85,
                        "reasoning": "Why this career fits",
                        "required_skills": ["skill1", "skill2"],
                        "growth_potential": "High|Medium|Low",
                        "salary_range": "$X-Yk",
                        "work_life_balance": "Good|Average|Poor",
                        "entry_requirements": "What's needed to enter",
                        "next_steps": ["step1", "step2"]
                    }}
                ],
                "overall_assessment": "Summary of career potential",
                "key_insights": ["insight1", "insight2"],
                "development_priorities": ["priority1", "priority2"]
            }}
            """
            
            response = await self.llm.achat(recommendation_prompt)
            
            try:
                recommendations_data = json.loads(response.content)
                self.recommendations = recommendations_data.get('recommendations', [])
                
                # Format recommendations
                recommendations_str = "Career Recommendations:\n\n"
                
                for i, rec in enumerate(self.recommendations, 1):
                    recommendations_str += f"{i}. {rec.get('career_title', 'Unknown Career')}\n"
                    recommendations_str += f"   Industry: {rec.get('industry', 'Unknown')}\n"
                    recommendations_str += f"   Match Score: {rec.get('match_score', 0)}/100\n"
                    recommendations_str += f"   Reasoning: {rec.get('reasoning', 'No reasoning provided')}\n"
                    recommendations_str += f"   Salary Range: {rec.get('salary_range', 'Unknown')}\n"
                    recommendations_str += f"   Growth Potential: {rec.get('growth_potential', 'Unknown')}\n"
                    recommendations_str += f"   Work-Life Balance: {rec.get('work_life_balance', 'Unknown')}\n\n"
                
                # Add overall assessment
                overall = recommendations_data.get('overall_assessment', '')
                if overall:
                    recommendations_str += f"Overall Assessment: {overall}\n\n"
                
                # Add key insights
                insights = recommendations_data.get('key_insights', [])
                if insights:
                    recommendations_str += f"Key Insights: {', '.join(insights)}\n\n"
                
                # Add development priorities
                priorities = recommendations_data.get('development_priorities', [])
                if priorities:
                    recommendations_str += f"Development Priorities: {', '.join(priorities)}"
                
                return recommendations_str.strip()
                
            except json.JSONDecodeError:
                return f"Career Recommendations: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in RecommendationAgent act: {e}")
            return f"Error generating recommendations: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

class ActionPlanAgent(ReActAgent):
    """Agent for creating detailed action plans based on career recommendations"""
    
    def __init__(self):
        # Initialize with real LLM using helper function
        chatbot = create_chatbot_with_fallback()
        memory = Memory()
        
        super().__init__(
            name="ActionPlanAgent",
            description="Creates detailed action plans with timelines and milestones",
            system_prompt="""You are a career action plan specialist. Create detailed, actionable plans to help users achieve their career goals. Include:
1. Specific action steps
2. Realistic timelines
3. Measurable milestones
4. Resource requirements
5. Skill development priorities
6. Networking strategies
7. Progress tracking methods""",
            llm=chatbot,
            memory=memory,
            max_steps=8
        )
        self.action_plan = {}
    
    async def think(self) -> bool:
        """Determine if we should create an action plan"""
        try:
            messages = self.memory.get_messages()
            if not messages:
                return False
            
            # Look for action plan signals
            action_keywords = ["action", "plan", "how to", "steps", "roadmap", "timeline", "milestone"]
            has_recommendations = len(messages) > 5  # Assume we have recommendations
            
            last_message = messages[-1]
            has_keyword = any(keyword in last_message.content.lower() for keyword in action_keywords)
            
            return has_keyword or has_recommendations
        except Exception as e:
            logger.error(f"Error in ActionPlanAgent think: {e}")
            return False
    
    async def act(self) -> str:
        """Create detailed action plan"""
        try:
            messages = self.memory.get_messages()
            conversation_context = " ".join([msg.content for msg in messages])
            
            action_plan_prompt = f"""
            Based on the comprehensive career analysis and recommendations in this conversation:
            {conversation_context}
            
            Create a detailed action plan that includes:
            1. Immediate next steps (next 30 days)
            2. Short-term goals (3-6 months)
            3. Medium-term objectives (6-12 months)
            4. Long-term targets (1-2 years)
            5. Specific milestones and deliverables
            6. Required resources and investments
            7. Skill development timeline
            8. Networking and relationship building
            9. Progress tracking and adjustment methods
            
            Format as JSON:
            {{
                "immediate_actions": [
                    {{
                        "action": "Specific action",
                        "timeline": "Next 30 days",
                        "deliverable": "Measurable outcome",
                        "resources_needed": ["resource1", "resource2"]
                    }}
                ],
                "short_term_goals": [
                    {{
                        "goal": "3-6 month goal",
                        "milestones": ["milestone1", "milestone2"],
                        "success_metrics": ["metric1", "metric2"]
                    }}
                ],
                "medium_term_objectives": [
                    {{
                        "objective": "6-12 month objective",
                        "key_results": ["result1", "result2"]
                    }}
                ],
                "long_term_targets": [
                    {{
                        "target": "1-2 year target",
                        "major_milestones": ["milestone1", "milestone2"]
                    }}
                ],
                "resource_requirements": {{
                    "time_investment": "Hours per week",
                    "financial_investment": "$X total",
                    "learning_resources": ["resource1", "resource2"]
                }},
                "progress_tracking": {{
                    "review_frequency": "Monthly|Quarterly",
                    "key_metrics": ["metric1", "metric2"],
                    "adjustment_triggers": ["trigger1", "trigger2"]
                }}
            }}
            """
            
            response = await self.llm.achat(action_plan_prompt)
            
            try:
                action_plan_data = json.loads(response.content)
                self.action_plan = action_plan_data
                
                # Format action plan
                plan_str = "Detailed Action Plan:\n\n"
                
                # Immediate actions
                immediate = action_plan_data.get('immediate_actions', [])
                if immediate:
                    plan_str += "🚀 IMMEDIATE ACTIONS (Next 30 Days):\n"
                    for action in immediate:
                        plan_str += f"   • {action.get('action', 'Unknown action')}\n"
                        plan_str += f"     Deliverable: {action.get('deliverable', 'N/A')}\n"
                        resources = action.get('resources_needed', [])
                        if resources:
                            plan_str += f"     Resources: {', '.join(resources)}\n"
                    plan_str += "\n"
                
                # Short-term goals
                short_term = action_plan_data.get('short_term_goals', [])
                if short_term:
                    plan_str += "📈 SHORT-TERM GOALS (3-6 Months):\n"
                    for goal in short_term:
                        plan_str += f"   • {goal.get('goal', 'Unknown goal')}\n"
                        milestones = goal.get('milestones', [])
                        if milestones:
                            plan_str += f"     Milestones: {', '.join(milestones)}\n"
                        metrics = goal.get('success_metrics', [])
                        if metrics:
                            plan_str += f"     Success Metrics: {', '.join(metrics)}\n"
                    plan_str += "\n"
                
                # Resource requirements
                resources = action_plan_data.get('resource_requirements', {})
                if resources:
                    plan_str += "💰 RESOURCE REQUIREMENTS:\n"
                    if 'time_investment' in resources:
                        plan_str += f"   • Time Investment: {resources['time_investment']}\n"
                    if 'financial_investment' in resources:
                        plan_str += f"   • Financial Investment: {resources['financial_investment']}\n"
                    learning_resources = resources.get('learning_resources', [])
                    if learning_resources:
                        plan_str += f"   • Learning Resources: {', '.join(learning_resources)}\n"
                    plan_str += "\n"
                
                # Progress tracking
                tracking = action_plan_data.get('progress_tracking', {})
                if tracking:
                    plan_str += "📊 PROGRESS TRACKING:\n"
                    if 'review_frequency' in tracking:
                        plan_str += f"   • Review Frequency: {tracking['review_frequency']}\n"
                    key_metrics = tracking.get('key_metrics', [])
                    if key_metrics:
                        plan_str += f"   • Key Metrics: {', '.join(key_metrics)}\n"
                    triggers = tracking.get('adjustment_triggers', [])
                    if triggers:
                        plan_str += f"   • Adjustment Triggers: {', '.join(triggers)}\n"
                
                return plan_str.strip()
                
            except json.JSONDecodeError:
                return f"Action Plan: {response.content}"
                
        except Exception as e:
            logger.error(f"Error in ActionPlanAgent act: {e}")
            return f"Error creating action plan: {str(e)}"
    
    async def step(self, run_id: Optional[UUID] = None) -> str:
        """Override step method to handle run_id parameter"""
        return await super().step()

# Career Analysis Orchestrator
class CareerAnalysisOrchestrator:
    """Orchestrates multiple career analysis agents"""
    
    def __init__(self):
        self.agents = {
            "skills": SkillsAgent(),
            "personality": PersonalityAgent(),
            "passions": PassionsAgent(),
            "goals": GoalsAgent(),
            "values": ValuesAgent(),
            "recommendations": RecommendationAgent(),
            "action_plan": ActionPlanAgent()
        }
        self.results = {}
    
    async def analyze_career(self, user_input: str) -> Dict[str, Any]:
        """Run comprehensive career analysis"""
        try:
            logger.info("Starting comprehensive career analysis")
            
            # Run agents in sequence for comprehensive analysis
            analysis_order = ["skills", "personality", "passions", "goals", "values", "recommendations", "action_plan"]
            
            for agent_name in analysis_order:
                agent = self.agents[agent_name]
                logger.info(f"Running {agent_name} analysis")
                
                # Add user input to agent memory
                await agent.add_message("user", user_input)
                
                # Run the agent
                result = await agent.run()
                
                # Store results
                self.results[agent_name] = {
                    "result": result,
                    "analysis_data": getattr(agent, 'analysis_result', None) or getattr(agent, 'recommendations', None) or getattr(agent, 'action_plan', None)
                }
                
                logger.info(f"Completed {agent_name} analysis")
            
            logger.info("Completed comprehensive career analysis")
            
            return {
                "success": True,
                "results": self.results,
                "summary": "Comprehensive career analysis completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error in career analysis orchestration: {e}")
            return {
                "success": False,
                "error": str(e),
                "results": self.results
            }
    
    async def get_agent_result(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """Get results from a specific agent"""
        return self.results.get(agent_name)
    
    async def shutdown(self):
        """Shutdown all agents"""
        for agent in self.agents.values():
            await agent.shutdown()