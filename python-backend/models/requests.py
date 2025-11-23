"""
API request models.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    """Request payload for onboarding submission."""
    sessionId: Optional[str] = None
    transcript: str = Field(min_length=10, description="Combined text from interview or form")
    resumeText: Optional[str] = Field(None, description="Raw parsed resume text if available")


class SelectCareersRequest(BaseModel):
    """Request to select careers to track."""
    sessionId: str
    careerIds: List[str] = Field(min_length=1, max_length=3)


class UpdateTaskRequest(BaseModel):
    """Request to update a task status."""
    sessionId: str
    careerId: str
    taskId: str
    status: str = Field(pattern="^(not_started|in_progress|completed|skipped)$")
