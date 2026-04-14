from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


RANKER_FEATURES = [
    "ann_similarity",
    "popularity_score",
    "recency_score",
    "activity_frequency",
    "session_time",
    "preference_alignment",
    "difficulty_alignment",
    "watch_time_ratio",
    "like_probability",
    "engagement_rate",
    "creator_affinity",
]


@dataclass
class RankerModel:
    feature_names: list[str] = field(default_factory=lambda: list(RANKER_FEATURES))
    scaler: StandardScaler = field(default_factory=StandardScaler)
    model: LogisticRegression = field(default_factory=lambda: LogisticRegression(max_iter=300))
    trained: bool = False

    def _to_matrix(self, rows: list[dict[str, float]]) -> np.ndarray:
        matrix = np.zeros((len(rows), len(self.feature_names)), dtype=np.float32)
        for idx, row in enumerate(rows):
            for col, name in enumerate(self.feature_names):
                matrix[idx, col] = float(row.get(name, 0.0))
        return matrix

    def fit(self, feature_rows: list[dict[str, float]], labels: list[int]) -> bool:
        if len(feature_rows) < 8 or len(set(labels)) < 2:
            self.trained = False
            return False

        x = self._to_matrix(feature_rows)
        y = np.asarray(labels, dtype=np.int32)

        x_scaled = self.scaler.fit_transform(x)
        self.model.fit(x_scaled, y)
        self.trained = True
        return True

    def predict_scores(self, feature_rows: list[dict[str, float]]) -> list[float]:
        if not feature_rows:
            return []
        if not self.trained:
            # Heuristic fallback keeps ranking functional before first full fit.
            return [
                (
                    0.35 * float(row.get("ann_similarity", 0.0))
                    + 0.2 * float(row.get("preference_alignment", 0.0))
                    + 0.2 * float(row.get("watch_time_ratio", 0.0))
                    + 0.15 * float(row.get("engagement_rate", 0.0))
                    + 0.1 * float(row.get("popularity_score", 0.0))
                )
                for row in feature_rows
            ]

        x = self._to_matrix(feature_rows)
        x_scaled = self.scaler.transform(x)
        scores = self.model.predict_proba(x_scaled)[:, 1]
        return [float(score) for score in scores]

    def to_metadata(self) -> dict[str, Any]:
        return {"trained": self.trained, "feature_names": self.feature_names}
