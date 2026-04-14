from typing import Dict

from pydantic import BaseModel, ConfigDict, Field


class RecommendationFeedbackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    video_id: str = Field(min_length=1)
    action: str = Field(default="watch", pattern="^(watch|like|skip|save|share)$")
    watch_time_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    session_time: float = Field(default=0.0, ge=0.0)


class RecommendationFeedbackResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    positive: bool
    preference_weight: float
    federated_round: int
    global_weights: Dict[str, float]
