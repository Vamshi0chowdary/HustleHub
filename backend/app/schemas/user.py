from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    username: str
    email: str
    phone: str | None = None
    bio: str = ""
    skills: list[str] = Field(default_factory=list)
    profile_picture: str | None = None
    level: str = "beginner"
    followers_count: int = 0
    following_count: int = 0
    activity_score: int = 0
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=80)
    bio: str | None = Field(default=None, max_length=200)
    skills: list[str] | None = None
    profile_picture: str | None = None
    level: str | None = None


class FollowRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_user_id: str
