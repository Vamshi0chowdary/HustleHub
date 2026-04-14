from __future__ import annotations

import re
from collections import Counter
from typing import Any, Iterable

LEVEL_ORDER: dict[str, int] = {
    "beginner": 0,
    "intermediate": 1,
    "advanced": 2,
}

SKILL_ALIASES: dict[str, set[str]] = {
    "dsa": {"dsa", "algorithm", "algorithms", "leetcode", "coding", "data structures"},
    "ml": {"ml", "machine learning", "ai", "artificial intelligence", "data science", "sklearn", "pytorch"},
    "web": {"web", "frontend", "backend", "react", "node", "javascript", "typescript", "html", "css", "fastapi", "django", "flask"},
}

CATEGORY_ALIASES: dict[str, set[str]] = {
    "dsa": {"dsa", "algorithm", "algorithms", "leetcode", "coding"},
    "ml": {"ml", "machine learning", "ai", "artificial intelligence", "data science"},
    "web": {"web", "frontend", "backend", "react", "node", "javascript", "typescript", "html", "css", "fastapi", "django", "flask"},
}


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def normalize_tokens(values: Iterable[str] | None) -> list[str]:
    if not values:
        return []
    tokens: list[str] = []
    for value in values:
        cleaned = normalize_text(value)
        if cleaned:
            tokens.append(cleaned)
    return tokens


def infer_category(tags: Iterable[str] | None, caption: str | None = None) -> str:
    text = normalize_text(" ".join(normalize_tokens(tags)) + " " + (caption or ""))
    for category, aliases in CATEGORY_ALIASES.items():
        if any(alias in text for alias in aliases):
            return category
    return "general"


def has_skill(tokens: Iterable[str], skill_name: str) -> float:
    aliases = SKILL_ALIASES[skill_name]
    text = " ".join(tokens)
    return 1.0 if any(alias in text for alias in aliases) else 0.0


def normalize_count(value: Any, scale: float = 100.0) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.0
    if scale <= 0:
        return numeric
    return max(0.0, min(numeric / scale, 1.0))


def jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 0.0
    union = left | right
    if not union:
        return 0.0
    return len(left & right) / len(union)


def normalize_level(value: Any) -> int:
    if value is None:
        return LEVEL_ORDER["beginner"]
    normalized = normalize_text(str(value))
    for level, rank in LEVEL_ORDER.items():
        if level in normalized:
            return rank
    return LEVEL_ORDER["beginner"]


def difficulty_alignment(user_level: Any, video_difficulty: Any) -> float:
    user_rank = normalize_level(user_level)
    video_rank = normalize_level(video_difficulty)
    distance = abs(user_rank - video_rank)

    if distance == 0:
        return 1.0

    if distance == 1:
        return 0.82 if user_rank >= video_rank else 0.7

    if user_rank > video_rank:
        return 0.55

    return 0.35


def implicit_feedback_score(
    watch_time_ratio: float,
    like_signal: float,
    engagement: float,
    recency: float,
) -> float:
    score = (
        0.4 * float(watch_time_ratio)
        + 0.3 * float(like_signal)
        + 0.2 * float(engagement)
        + 0.1 * float(recency)
    )
    return max(0.0, min(score, 1.0))


def apply_feature_weights(features: dict[str, float], feature_weights: dict[str, float]) -> dict[str, float]:
    weighted: dict[str, float] = {}
    for key, value in features.items():
        weighted[key] = float(value) * float(feature_weights.get(key, 1.0))
    return weighted


def aggregate_category_preferences(categories: Iterable[str] | None) -> dict[str, float]:
    counts = Counter((category for category in (categories or []) if category))
    total = sum(counts.values()) or 1
    return {f"category__{category}": count / total for category, count in counts.items()}


def build_user_feature_dict(user: dict[str, Any], preferred_categories: Iterable[str] | None = None) -> dict[str, float]:
    tokens = normalize_tokens(user.get("skills", []))
    features: dict[str, float] = {
        "skill_dsa": has_skill(tokens, "dsa"),
        "skill_ml": has_skill(tokens, "ml"),
        "skill_web": has_skill(tokens, "web"),
        "activity_score": normalize_count(user.get("activity_score", 0), 100.0),
        "followers_count": normalize_count(user.get("followers_count", 0), 1000.0),
        "following_count": normalize_count(user.get("following_count", 0), 1000.0),
    }
    features.update(aggregate_category_preferences(preferred_categories))
    return features


def build_video_feature_dict(video: dict[str, Any]) -> dict[str, float]:
    tags = normalize_tokens(video.get("tags", []))
    category = video.get("category") or infer_category(tags, video.get("caption", ""))
    engagement_score = float(video.get("likes_count", 0) or 0) + float(video.get("comments_count", 0) or 0) * 0.5

    features: dict[str, float] = {
        "tag_dsa": has_skill(tags, "dsa"),
        "tag_ml": has_skill(tags, "ml"),
        "tag_web": has_skill(tags, "web"),
        f"category__{category}": 1.0,
        "engagement_score": normalize_count(engagement_score, 100.0),
        "likes_count": normalize_count(video.get("likes_count", 0), 1000.0),
        "comments_count": normalize_count(video.get("comments_count", 0), 500.0),
    }
    return features


def build_candidate_user_feature_dict(candidate_user: dict[str, Any], liked_categories: Iterable[str] | None = None) -> dict[str, float]:
    return build_user_feature_dict(candidate_user, preferred_categories=liked_categories)
