from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.neighbors import NearestNeighbors


@dataclass
class CandidateGenerator:
    top_k: int = 200
    metric: str = "cosine"
    algorithm: str = "auto"

    def __post_init__(self) -> None:
        self._model: NearestNeighbors | None = None
        self._ids: list[str] = []

    def fit(self, ids: list[str], dense_matrix: np.ndarray) -> None:
        self._ids = list(ids)
        if dense_matrix.size == 0 or not ids:
            self._model = None
            return
        n_neighbors = max(1, min(self.top_k, len(ids)))
        self._model = NearestNeighbors(n_neighbors=n_neighbors, metric=self.metric, algorithm=self.algorithm)
        self._model.fit(dense_matrix)

    def query(self, query_vector: np.ndarray, top_k: int | None = None) -> list[tuple[str, float]]:
        if self._model is None or not self._ids:
            return []

        n_neighbors = max(1, min(top_k or self.top_k, len(self._ids)))
        distances, indices = self._model.kneighbors(query_vector.reshape(1, -1), n_neighbors=n_neighbors)

        candidates: list[tuple[str, float]] = []
        for distance, idx in zip(distances[0], indices[0]):
            similarity = float(1.0 - distance)
            candidates.append((self._ids[idx], max(0.0, min(similarity, 1.0))))
        return candidates
