from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from bson import ObjectId

from app.config.settings import get_settings
from app.utils.serializers import serialize_mongo

from .embeddings import combine_tokens, sparse_row_to_dense
from .model import AdvancedRecommendationModel
from .utils import difficulty_alignment, implicit_feedback_score, infer_category, normalize_count


async def _cursor_to_list(cursor) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    async for item in cursor:
        rows.append(serialize_mongo(item))
    return rows


def _to_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


def _recency_score(created_at: Any, half_life_hours: float = 72.0) -> float:
    created = _to_dt(created_at)
    age_hours = max((datetime.now(timezone.utc) - created).total_seconds() / 3600.0, 0.0)
    return float(np.exp(-age_hours / max(half_life_hours, 1.0)))


def _popularity_score(video: dict[str, Any]) -> float:
    likes = normalize_count(video.get("likes_count", 0), scale=1000.0)
    comments = normalize_count(video.get("comments_count", 0), scale=400.0)
    return 0.75 * likes + 0.25 * comments


def _engagement_rate(video: dict[str, Any]) -> float:
    likes = float(video.get("likes_count", 0) or 0)
    comments = float(video.get("comments_count", 0) or 0)
    views = max(float(video.get("views_count", 20) or 20), 1.0)
    return max(0.0, min((likes + 2.0 * comments) / views, 1.0))


def _video_document(video: dict[str, Any]) -> str:
    category = video.get("category") or infer_category(video.get("tags", []), video.get("caption", ""))
    return combine_tokens(video.get("tags", []), video.get("title", ""), video.get("caption", ""), category, video.get("difficulty_level", ""))


def _user_document(user: dict[str, Any]) -> str:
    return combine_tokens(user.get("skills", []), user.get("bio", ""), user.get("level", ""))


def _creator_affinity(user_followings: set[str], creator_id: str) -> float:
    return 1.0 if creator_id in user_followings else 0.0


async def _load_followings(db, user_id: str) -> set[str]:
    following: set[str] = set()
    async for row in db.follows.find({"follower_id": user_id}, {"following_id": 1}):
        following_id = row.get("following_id")
        if following_id:
            following.add(following_id)
    return following


async def _load_liked_videos(db, user_id: str) -> set[str]:
    liked: set[str] = set()
    async for row in db.likes.find({"user_id": user_id}, {"video_id": 1}):
        video_id = row.get("video_id")
        if video_id:
            liked.add(video_id)
    return liked


class RecommendationEngine:
    def __init__(self, model: AdvancedRecommendationModel):
        self.model = model

    @classmethod
    def load(cls, model_path: str | Path | None = None) -> "RecommendationEngine":
        settings = get_settings()
        artifact_path = Path(model_path or settings.recommendation_model_path)
        return cls(AdvancedRecommendationModel.load(artifact_path))

    async def _fetch_video_map(self, db, video_ids: list[str]) -> dict[str, dict[str, Any]]:
        object_ids = [ObjectId(video_id) for video_id in video_ids if ObjectId.is_valid(video_id)]
        if not object_ids:
            return {}
        videos = await _cursor_to_list(db.videos.find({"_id": {"$in": object_ids}}))
        return {video["id"]: video for video in videos}

    async def _load_or_build_item_profile(self, db, video_id: str) -> tuple[np.ndarray, dict[str, Any]]:
        vector = self.model.artifacts.item_vectors.get(video_id)
        profile = self.model.artifacts.item_profiles.get(video_id)
        if vector is not None and profile is not None:
            return vector, profile

        video_map = await self._fetch_video_map(db, [video_id])
        video = video_map.get(video_id)
        if not video:
            width = self.model.get_user_vector("cold_start_user").shape[0]
            return np.zeros((width,), dtype=np.float32), {
                "popularity_score": 0.0,
                "recency_score": 0.0,
                "engagement_rate": 0.0,
                "creator_id": "",
                "difficulty_level": "beginner",
                "duration_seconds": 0,
            }

        vector = sparse_row_to_dense(self.model.artifacts.embedding_space.transform([_video_document(video)]), 0)
        profile = {
            "popularity_score": _popularity_score(video),
            "recency_score": _recency_score(video.get("created_at")),
            "engagement_rate": _engagement_rate(video),
            "creator_id": video.get("user_id", ""),
            "difficulty_level": video.get("difficulty_level", "beginner"),
            "duration_seconds": int(video.get("duration_seconds", 0) or 0),
        }
        self.model.artifacts.item_vectors[video_id] = vector
        self.model.artifacts.item_profiles[video_id] = profile
        self.model.rebuild_indexes()
        return vector, profile

    def _build_rank_features(
        self,
        ann_similarity: float,
        user_profile: dict[str, Any],
        item_profile: dict[str, Any],
        watch_time_ratio: float,
        like_probability: float,
        creator_affinity: float,
        difficulty_alignment_score: float,
    ) -> dict[str, float]:
        preference_weight = float(user_profile.get("preference_weight", 0.5))
        preference_alignment = min(1.0, max(0.0, ann_similarity * preference_weight))

        return {
            "ann_similarity": float(ann_similarity),
            "popularity_score": float(item_profile.get("popularity_score", 0.0)),
            "recency_score": float(item_profile.get("recency_score", 0.0)),
            "activity_frequency": float(user_profile.get("activity_frequency", 0.0)),
            "session_time": float(user_profile.get("session_time", 0.0)),
            "preference_alignment": float(preference_alignment),
            "difficulty_alignment": float(difficulty_alignment_score),
            "watch_time_ratio": float(watch_time_ratio),
            "like_probability": float(like_probability),
            "engagement_rate": float(item_profile.get("engagement_rate", 0.0)),
            "creator_affinity": float(creator_affinity),
        }

    async def recommend_feed(self, db, current_user: dict[str, Any], limit: int = 20) -> list[dict[str, Any]]:
        user_id = current_user["id"]
        user_vector = self.model.get_user_vector(user_id)
        user_profile = self.model.artifacts.user_profiles.get(
            user_id,
            {
                "activity_frequency": normalize_count(current_user.get("activity_score", 0), 100.0),
                "session_time": 0.2,
                "preference_weight": 0.6,
            },
        )

        followings = await _load_followings(db, user_id)
        liked_videos = await _load_liked_videos(db, user_id)

        candidate_pairs = self.model.query_candidates(user_vector, top_k=max(limit * 20, 120))
        candidate_ids = [video_id for video_id, _ in candidate_pairs if video_id not in liked_videos]

        if not candidate_ids:
            fallback = await _cursor_to_list(
                db.videos.find({"user_id": {"$ne": user_id}}).sort("created_at", -1).limit(max(limit * 3, 30))
            )
            for video in fallback:
                candidate_ids.append(video["id"])
                candidate_pairs.append((video["id"], 0.2))

        candidate_ids = candidate_ids[: max(limit * 4, 40)]
        video_map = await self._fetch_video_map(db, candidate_ids)

        feature_rows: list[dict[str, float]] = []
        rank_context: list[tuple[dict[str, Any], float, dict[str, float]]] = []
        sim_lookup = {video_id: sim for video_id, sim in candidate_pairs}

        for video_id in candidate_ids:
            video = video_map.get(video_id)
            if not video or video.get("user_id") == user_id:
                continue

            ann_similarity = float(sim_lookup.get(video_id, 0.0))
            _, item_profile = await self._load_or_build_item_profile(db, video_id)
            creator_id = str(item_profile.get("creator_id", ""))
            like_probability = min(1.0, ann_similarity * 0.7 + item_profile.get("engagement_rate", 0.0) * 0.3)
            watch_time_ratio = min(1.0, ann_similarity * 0.8 + item_profile.get("recency_score", 0.0) * 0.2)
            difficulty_match = difficulty_alignment(current_user.get("level", "beginner"), item_profile.get("difficulty_level", "beginner"))

            rank_features = self._build_rank_features(
                ann_similarity=ann_similarity,
                user_profile=user_profile,
                item_profile=item_profile,
                watch_time_ratio=watch_time_ratio,
                like_probability=like_probability,
                creator_affinity=_creator_affinity(followings, creator_id),
                difficulty_alignment_score=difficulty_match,
            )
            feature_rows.append(rank_features)
            rank_context.append((video, ann_similarity, rank_features))

        rank_scores = self.model.rank_scores(feature_rows)
        ranked: list[dict[str, Any]] = []
        for (video, ann_similarity, rank_features), rank_score in zip(rank_context, rank_scores):
            final_score = 0.75 * float(rank_score) + 0.25 * float(ann_similarity)
            ranked.append(
                {
                    **video,
                    "score": final_score,
                    "rank_score": float(rank_score),
                    "ann_similarity": float(ann_similarity),
                    "features": rank_features,
                }
            )

        ranked.sort(key=lambda row: row["score"], reverse=True)
        return ranked[:limit]

    async def recommend_users(self, db, current_user: dict[str, Any], limit: int = 12) -> list[dict[str, Any]]:
        user_id = current_user["id"]
        current_vector = self.model.get_user_vector(user_id)
        followings = await _load_followings(db, user_id)

        candidates = await _cursor_to_list(
            db.users.find({"_id": {"$ne": ObjectId(user_id)}}, {"password_hash": 0}).sort("activity_score", -1).limit(max(limit * 4, 50))
        )

        ranked: list[dict[str, Any]] = []
        for candidate in candidates:
            candidate_id = candidate["id"]
            if candidate_id in followings:
                continue

            candidate_vec = self.model.artifacts.user_vectors.get(candidate_id)
            if candidate_vec is None:
                candidate_doc = _user_document(candidate)
                candidate_vec = sparse_row_to_dense(self.model.artifacts.embedding_space.transform([candidate_doc]), 0)
                self.model.artifacts.user_vectors[candidate_id] = candidate_vec

            denom = float(np.linalg.norm(current_vector) * np.linalg.norm(candidate_vec))
            similarity = float(np.dot(current_vector, candidate_vec) / denom) if denom > 0 else 0.0
            activity = normalize_count(candidate.get("activity_score", 0), 100.0)
            social = normalize_count(candidate.get("followers_count", 0), 1000.0)

            score = 0.65 * similarity + 0.2 * activity + 0.15 * social
            ranked.append({**candidate, "score": score, "embedding_similarity": similarity})

        ranked.sort(key=lambda row: row["score"], reverse=True)
        return ranked[:limit]

    async def register_feedback(self, db, current_user: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        user_id = current_user["id"]
        video_id = payload.get("video_id", "")
        action = str(payload.get("action", "watch")).lower()
        watch_time_ratio = float(payload.get("watch_time_ratio", 0.0) or 0.0)
        session_time = float(payload.get("session_time", 0.0) or 0.0)

        vector, item_profile = await self._load_or_build_item_profile(db, video_id)
        positive = action in {"like", "save", "share"} or watch_time_ratio >= 0.6
        self.model.update_user_embedding(user_id, vector, positive=positive)

        preference_delta = {
            "preference_weight": 0.06 if positive else -0.04,
            "session_time": min(session_time / 600.0, 1.0) * (0.04 if positive else 0.01),
        }
        self.model.update_preference_weights(preference_delta)

        profile = self.model.artifacts.user_profiles.get(
            user_id,
            {
                "activity_frequency": normalize_count(current_user.get("activity_score", 0), 100.0),
                "session_time": 0.2,
                "preference_weight": 0.6,
            },
        )
        profile["session_time"] = max(0.0, min(float(profile.get("session_time", 0.2)) * 0.9 + min(session_time / 600.0, 1.0) * 0.1, 1.0))
        profile["activity_frequency"] = max(0.0, min(float(profile.get("activity_frequency", 0.0)) * 0.95 + 0.05, 1.0))
        profile["preference_weight"] = float(self.model.artifacts.feature_weights.get("preference_weight", 0.6))
        self.model.artifacts.user_profiles[user_id] = profile

        implicit_score = implicit_feedback_score(
            watch_time_ratio=watch_time_ratio,
            like_signal=1.0 if positive else 0.0,
            engagement=float(item_profile.get("engagement_rate", 0.0)),
            recency=float(item_profile.get("recency_score", 0.0)),
        )

        await db.recommendation_feedback.insert_one(
            {
                "user_id": user_id,
                "video_id": video_id,
                "action": action,
                "watch_time_ratio": watch_time_ratio,
                "session_time": session_time,
                "positive": positive,
                "item_profile": item_profile,
                "implicit_score": implicit_score,
                "created_at": datetime.now(timezone.utc),
            }
        )

        return {
            "status": "updated",
            "positive": positive,
            "preference_weight": self.model.artifacts.feature_weights.get("preference_weight", 0.6),
            "implicit_score": implicit_score,
            "item_profile": item_profile,
        }
