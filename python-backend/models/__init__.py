"""
Data models for Career OS backend.
Defines all request/response schemas and data structures.
"""

from .requests import OnboardingRequest, SelectCareersRequest, UpdateTaskRequest
from .responses import (
    OnboardingResponse,
    RecommendationsResponse,
    DashboardResponse,
    CareerDetailResponse,
    TaskUpdateResponse,
    CareerCard,
    VideoResource
)
from .schemas import (
    CareerProfile,
    CareerRecommendation,
    SelectedCareer,
    Task,
    Phase,
    Progress
)

__all__ = [
    "OnboardingRequest",
    "SelectCareersRequest",
    "UpdateTaskRequest",
    "OnboardingResponse",
    "RecommendationsResponse",
    "DashboardResponse",
    "CareerDetailResponse",
    "TaskUpdateResponse",
    "CareerCard",
    "VideoResource",
    "CareerProfile",
    "CareerRecommendation",
    "SelectedCareer",
    "Task",
    "Phase",
    "Progress",
]
