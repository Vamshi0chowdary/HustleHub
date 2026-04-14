from datetime import datetime
from typing import Any


def user_document(data: dict[str, Any]) -> dict[str, Any]:
    now = datetime.utcnow()
    return {
        "name": data.get("name", ""),
        "username": data["username"],
        "email": data["email"],
        "phone": data.get("phone"),
        "password_hash": data["password_hash"],
        "bio": data.get("bio", ""),
        "skills": data.get("skills", []),
        "profile_picture": data.get("profile_picture"),
        "level": data.get("level", "beginner"),
        "followers_count": 0,
        "following_count": 0,
        "activity_score": 0,
        "created_at": now,
        "updated_at": now,
    }


def video_document(data: dict[str, Any]) -> dict[str, Any]:
    now = datetime.utcnow()
    return {
        "user_id": data["user_id"],
        "video_url": data["video_url"],
        "caption": data.get("caption", ""),
        "tags": data.get("tags", []),
        "likes_count": 0,
        "comments_count": 0,
        "created_at": now,
        "updated_at": now,
    }
