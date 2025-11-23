"""
API response models.
"""

from typing import List, Optional
from pydantic import BaseModel
from .schemas import CareerRecommendation, SelectedCareer, Progress


class OnboardingResponse(BaseModel):
    """Response after onboarding submission."""
    sessionId: str
    status: str
    numRecommendations: int


class RecommendationsResponse(BaseModel):
    """List of career recommendations."""
    sessionId: str
    recommendations: List[CareerRecommendation]


class CareerCard(BaseModel):
    """Summary card for dashboard."""
    id: str
    title: str
    industry: str
    fitScore: float
    level: int
    xp: int
    xpToNextLevel: int
    completionPercent: float
    tasksThisWeek: int
    streak: int


class DashboardResponse(BaseModel):
    """Central dashboard data."""
    sessionId: str
    careers: List[CareerCard]
    totalXP: int
    longestStreak: int
    totalTasksCompleted: int


class VideoResource(BaseModel):
    """Video resource for day-in-the-life."""
    title: str
    videoId: str


class CareerDetailResponse(BaseModel):
    """Detailed career dashboard data."""
    career: SelectedCareer
    videos: List[VideoResource]


class TaskUpdateResponse(BaseModel):
    """Response after task update."""
    success: bool
    progress: Progress
