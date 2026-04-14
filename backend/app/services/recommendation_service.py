from __future__ import annotations

import logging
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config.database import get_database
from app.config.settings import get_settings
from ml.recommend import RecommendationEngine
from ml.utils import difficulty_alignment
from fl.server import FederatedServer, default_global_weights


logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, engine: RecommendationEngine, model_path: Path, federated_server: FederatedServer, federated_path: Path):
        self.engine = engine
        self.model_path = model_path
        self.federated_server = federated_server
        self.federated_path = federated_path
        self.settings = get_settings()
        self._feed_cache: dict[tuple[str, int], tuple[float, list[dict[str, Any]]]] = {}
        self._users_cache: dict[tuple[str, int], tuple[float, list[dict[str, Any]]]] = {}

    @staticmethod
    def _cache_valid(entry: tuple[float, list[dict[str, Any]]] | None) -> bool:
        return bool(entry and entry[0] > time.time())

    def _invalidate_user_cache(self, user_id: str) -> None:
        self._feed_cache = {key: value for key, value in self._feed_cache.items() if key[0] != user_id}
        self._users_cache = {key: value for key, value in self._users_cache.items() if key[0] != user_id}

    async def recommend_feed(self, current_user: dict[str, Any], limit: int = 20) -> list[dict[str, Any]]:
        cache_key = (current_user["id"], limit)
        entry = self._feed_cache.get(cache_key)
        if self._cache_valid(entry):
            return entry[1]

        db = get_database()
        rows = await self.engine.recommend_feed(db, current_user, limit=limit)
        self._feed_cache[cache_key] = (time.time() + float(self.settings.recommendation_feed_cache_ttl_seconds), rows)
        return rows

    async def recommend_users(self, current_user: dict[str, Any], limit: int = 12) -> list[dict[str, Any]]:
        cache_key = (current_user["id"], limit)
        entry = self._users_cache.get(cache_key)
        if self._cache_valid(entry):
            return entry[1]

        db = get_database()
        rows = await self.engine.recommend_users(db, current_user, limit=limit)
        self._users_cache[cache_key] = (time.time() + float(self.settings.recommendation_users_cache_ttl_seconds), rows)
        return rows

    async def register_feedback(self, current_user: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        db = get_database()
        feedback_result = await self.engine.register_feedback(db, current_user, payload)

        action = str(payload.get("action", "watch")).lower()
        positive = bool(feedback_result.get("positive", False))
        example = {
            "ann_similarity": 0.8 if positive else 0.2,
            "popularity_score": 0.6,
            "recency_score": 0.5,
            "activity_frequency": 0.6,
            "session_time": min(float(payload.get("session_time", 0.0) or 0.0) / 600.0, 1.0),
            "preference_alignment": feedback_result.get("preference_weight", 0.6),
            "difficulty_alignment": difficulty_alignment(
                current_user.get("level", "beginner"),
                feedback_result.get("item_profile", {}).get("difficulty_level", current_user.get("level", "beginner")),
            ),
            "watch_time_ratio": min(float(payload.get("watch_time_ratio", 0.0) or 0.0), 1.0),
            "like_probability": 1.0 if action == "like" else 0.3,
            "engagement_rate": 0.5,
            "creator_affinity": 0.0,
        }

        client_update = {
            "client_id": current_user["id"],
            "weights": example,
            "num_samples": 1,
        }
        self.federated_server.run_round(
            [client_update],
            learning_rate=float(self.settings.federated_learning_rate),
            apply_privacy=True,
            noise_std=float(self.settings.federated_privacy_noise_std),
            clip_norm=float(self.settings.federated_clip_norm),
        )

        self.engine.model.artifacts.feature_weights.update(self.federated_server.global_weights)
        self.engine.model.save(self.model_path)
        self.federated_server.save(self.federated_path)
        self._invalidate_user_cache(current_user["id"])

        return {
            **feedback_result,
            "federated_round": self.federated_server.round_number,
            "global_weights": self.federated_server.global_weights,
        }

    async def precompute_recommendations(self, top_users: int = 20, limit: int = 20) -> None:
        db = get_database()
        cursor = db.users.find({}, {"password_hash": 0}).sort("activity_score", -1).limit(top_users)

        warmed = 0
        async for user in cursor:
            current_user = {
                "id": str(user.get("_id")),
                "skills": user.get("skills", []),
                "bio": user.get("bio", ""),
                "level": user.get("level", ""),
                "activity_score": user.get("activity_score", 0),
            }
            rows = await self.engine.recommend_feed(db, current_user, limit=limit)
            self._feed_cache[(current_user["id"], limit)] = (
                time.time() + float(self.settings.recommendation_feed_cache_ttl_seconds),
                rows,
            )
            warmed += 1

        logger.info("Precomputed recommendation feed for %s users", warmed)


@lru_cache
def get_recommendation_service() -> RecommendationService:
    settings = get_settings()
    model_path = Path(settings.recommendation_model_path)
    engine = RecommendationEngine.load(model_path)

    federated_path = Path(settings.federated_model_path)
    if federated_path.exists():
        federated_server = FederatedServer.load(federated_path)
    else:
        federated_server = FederatedServer(global_weights=default_global_weights())

    engine.model.artifacts.feature_weights.update(federated_server.global_weights)
    return RecommendationService(engine, model_path=model_path, federated_server=federated_server, federated_path=federated_path)


async def warm_recommendation_engine() -> None:
    service = get_recommendation_service()
    try:
        await service.precompute_recommendations(top_users=15, limit=20)
    except Exception:
        logger.exception("Recommendation precompute warmup failed")
