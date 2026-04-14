from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class OnlineUpdater:
    learning_rate: float = 0.2
    decay: float = 0.98

    def update_user_vector(self, current_vector: np.ndarray, signal_vector: np.ndarray, positive: bool = True) -> np.ndarray:
        direction = 1.0 if positive else -1.0
        blended = self.decay * current_vector + direction * self.learning_rate * signal_vector
        norm = float(np.linalg.norm(blended))
        if norm > 0:
            blended = blended / norm
        return blended.astype(np.float32)

    def update_preference_weights(self, current_weights: dict[str, float], feedback: dict[str, float]) -> dict[str, float]:
        updated = dict(current_weights)
        for key, delta in feedback.items():
            base = float(updated.get(key, 0.5))
            updated[key] = max(0.0, min(base + self.learning_rate * float(delta), 2.0))
        return updated
