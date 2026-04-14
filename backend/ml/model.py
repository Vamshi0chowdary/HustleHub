from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from .candidate_generator import CandidateGenerator
from .embeddings import EmbeddingSpace
from .online_update import OnlineUpdater
from .ranker import RankerModel


def default_feature_weights() -> dict[str, float]:
    return {
        "activity_frequency": 0.8,
        "session_time": 0.6,
        "preference_weight": 1.0,
        "popularity": 0.6,
        "recency": 0.7,
        "engagement": 0.8,
    }


@dataclass
class RecommendationArtifacts:
    embedding_space: EmbeddingSpace
    ranker: RankerModel
    feature_weights: dict[str, float] = field(default_factory=default_feature_weights)
    user_vectors: dict[str, np.ndarray] = field(default_factory=dict)
    user_profiles: dict[str, dict[str, Any]] = field(default_factory=dict)
    item_vectors: dict[str, np.ndarray] = field(default_factory=dict)
    item_profiles: dict[str, dict[str, Any]] = field(default_factory=dict)
    trained_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: dict[str, Any] = field(default_factory=dict)

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, target)

    @classmethod
    def load(cls, path: str | Path) -> "RecommendationArtifacts":
        return joblib.load(Path(path))

    @classmethod
    def create_minimal(cls) -> "RecommendationArtifacts":
        embedding_space = EmbeddingSpace.create(max_features=512)
        matrix = embedding_space.fit_transform(["cold_start user", "cold_start item"])
        ranker = RankerModel()

        embedding_dim = int(matrix.shape[1])
        user_vector = np.zeros((embedding_dim,), dtype=np.float32)
        item_vector = np.zeros_like(user_vector)

        return cls(
            embedding_space=embedding_space,
            ranker=ranker,
            user_vectors={"cold_start_user": user_vector},
            user_profiles={
                "cold_start_user": {
                    "activity_frequency": 0.0,
                    "session_time": 0.0,
                    "preference_weight": 0.5,
                }
            },
            item_vectors={"cold_start_item": item_vector},
            item_profiles={
                "cold_start_item": {
                    "popularity_score": 0.0,
                    "recency_score": 0.0,
                    "engagement_rate": 0.0,
                    "creator_id": "",
                }
            },
            metadata={"mode": "minimal"},
        )


class AdvancedRecommendationModel:
    def __init__(self, artifacts: RecommendationArtifacts):
        self.artifacts = artifacts
        self.updater = OnlineUpdater()
        self._candidate_generator = CandidateGenerator(top_k=250)
        self._item_ids: list[str] = []
        self._item_matrix = np.zeros((0, 0), dtype=np.float32)
        self.rebuild_indexes()

    @classmethod
    def load(cls, path: str | Path) -> "AdvancedRecommendationModel":
        artifact_path = Path(path)
        if not artifact_path.exists():
            return cls(RecommendationArtifacts.create_minimal())
        return cls(RecommendationArtifacts.load(artifact_path))

    def save(self, path: str | Path) -> None:
        self.artifacts.save(path)

    def rebuild_indexes(self) -> None:
        self._item_ids = [item_id for item_id in self.artifacts.item_vectors if item_id]
        if not self._item_ids:
            self._item_matrix = np.zeros((0, 0), dtype=np.float32)
            self._candidate_generator.fit([], self._item_matrix)
            return

        matrix = [self.artifacts.item_vectors[item_id] for item_id in self._item_ids]
        self._item_matrix = np.vstack(matrix).astype(np.float32)
        self._candidate_generator.fit(self._item_ids, self._item_matrix)

    def get_user_vector(self, user_id: str) -> np.ndarray:
        vector = self.artifacts.user_vectors.get(user_id)
        if vector is None:
            if self._item_matrix.size:
                width = int(self._item_matrix.shape[1])
            else:
                width = int(self.artifacts.embedding_space.transform(["cold_start"]).shape[1])
            vector = np.zeros((width,), dtype=np.float32)
            self.artifacts.user_vectors[user_id] = vector
        return vector

    def query_candidates(self, user_vector: np.ndarray, top_k: int = 200) -> list[tuple[str, float]]:
        if not self._item_ids:
            return []
        return self._candidate_generator.query(user_vector, top_k=top_k)

    def rank_scores(self, feature_rows: list[dict[str, float]]) -> list[float]:
        return self.artifacts.ranker.predict_scores(feature_rows)

    def update_user_embedding(self, user_id: str, signal_vector: np.ndarray, positive: bool = True) -> None:
        current = self.get_user_vector(user_id)
        updated = self.updater.update_user_vector(current, signal_vector, positive=positive)
        self.artifacts.user_vectors[user_id] = updated

    def update_preference_weights(self, updates: dict[str, float]) -> None:
        self.artifacts.feature_weights = self.updater.update_preference_weights(self.artifacts.feature_weights, updates)
