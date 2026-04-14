from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CreateVideoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    caption: str = Field(default="", max_length=2200)
    tags: list[str] = Field(default_factory=list)


class VideoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    user_id: str
    video_url: str
    caption: str
    tags: list[str] = Field(default_factory=list)
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime


class FeedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    videos: list[VideoResponse]


class LikeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    video_id: str
