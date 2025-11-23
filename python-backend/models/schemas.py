"""
Core data schemas for Career OS.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class Skill(BaseModel):
    """Skill with proficiency level."""
    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"]
    yearsOfExperience: Optional[float] = None


class PersonalityTrait(BaseModel):
    """Personality trait with score."""
    name: str
    score: float = Field(ge=0, le=100)


class Passion(BaseModel):
    """Interest/passion cluster."""
    name: str
    description: str


class GoalLifestyle(BaseModel):
    """Career goals and lifestyle preferences."""
    timeframe: str = Field(default="1-2 years")
    incomePreference: str = Field(default="moderate")
    locationPreference: str = Field(default="flexible")
    workingStyle: str = Field(default="hybrid")


class Value(BaseModel):
    """Personal value with score."""
    name: str
    score: float = Field(ge=0, le=100)


class CareerProfile(BaseModel):
    """Complete career profile from multi-agent analysis."""
    skills: List[Skill]
    personality: List[PersonalityTrait]
    passions: List[Passion]
    goals: GoalLifestyle
    values: List[Value]


class CareerRecommendation(BaseModel):
    """A recommended career with fit analysis."""
    careerId: str
    careerName: str
    industry: str
    fitScore: float = Field(ge=0, le=100)
    summary: str
    medianSalary: str
    growthOutlook: str
    estimatedTime: str
    whyGoodFit: str


class Task(BaseModel):
    """Individual task in an action plan."""
    taskId: str
    title: str
    track: Literal["learning", "projects", "networking", "simulator"]
    phase: int = Field(ge=1, le=4)
    xp: int
    status: Literal["not_started", "in_progress", "completed", "skipped"] = "not_started"


class Phase(BaseModel):
    """Learning phase."""
    phaseId: int = Field(ge=1, le=4)
    name: str
    order: int
    status: Literal["locked", "in-progress", "completed"] = "locked"


class Progress(BaseModel):
    """Progress tracking for a career."""
    careerId: str
    xp: int = 0
    level: int = 1
    completionPercent: float = 0.0
    streak: int = 0
    tasksCompletedThisWeek: int = 0
    xpToNextLevel: int = 1000


class SelectedCareer(BaseModel):
    """Selected career with action plan."""
    careerId: str
    careerName: str
    industry: str
    fitScore: float
    phases: List[Phase]
    tasks: List[Task]
    progress: Progress
    detailedPlan: Optional[Dict[str, Any]] = None
