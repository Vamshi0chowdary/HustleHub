from __future__ import annotations

import pickle
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .aggregator import aggregate_weight_updates, merge_global_weights


DEFAULT_WEIGHT_KEYS = [
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


def default_global_weights() -> dict[str, float]:
    return {
        "ann_similarity": 1.0,
        "popularity_score": 0.6,
        "recency_score": 0.7,
        "activity_frequency": 0.8,
        "session_time": 0.6,
        "preference_alignment": 1.0,
        "difficulty_alignment": 0.8,
        "watch_time_ratio": 0.9,
        "like_probability": 0.9,
        "engagement_rate": 0.8,
        "creator_affinity": 0.5,
    }


@dataclass
class FederatedServer:
    global_weights: dict[str, float] = field(default_factory=default_global_weights)
    round_number: int = 0
    history: list[dict[str, Any]] = field(default_factory=list)

    def run_round(
        self,
        client_updates: list[dict[str, Any]],
        learning_rate: float = 1.0,
        apply_privacy: bool = False,
        noise_std: float = 0.01,
        clip_norm: float = 1.0,
    ) -> dict[str, float]:
        averaged_updates = aggregate_weight_updates(
            client_updates,
            apply_privacy=apply_privacy,
            noise_std=noise_std,
            clip_norm=clip_norm,
        )
        self.global_weights = merge_global_weights(self.global_weights, averaged_updates, learning_rate=learning_rate)
        self.round_number += 1
        self.history.append(
            {
                "round": self.round_number,
                "num_clients": len(client_updates),
                "apply_privacy": apply_privacy,
                "noise_std": noise_std,
                "clip_norm": clip_norm,
            }
        )
        return self.global_weights

    def run_rounds(
        self,
        rounds_payloads: list[list[dict[str, Any]]],
        learning_rate: float = 1.0,
        apply_privacy: bool = False,
        noise_std: float = 0.01,
        clip_norm: float = 1.0,
    ) -> dict[str, float]:
        for client_updates in rounds_payloads:
            self.run_round(
                client_updates,
                learning_rate=learning_rate,
                apply_privacy=apply_privacy,
                noise_std=noise_std,
                clip_norm=clip_norm,
            )
        return self.global_weights

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("wb") as handle:
            pickle.dump(self, handle, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load(cls, path: str | Path) -> "FederatedServer":
        with Path(path).open("rb") as handle:
            return pickle.load(handle)

    def to_dict(self) -> dict[str, Any]:
        return {
            "round_number": self.round_number,
            "global_weights": self.global_weights,
            "history": self.history,
        }


def simulate_federated_round(
    client_payloads: dict[str, tuple[list[dict[str, float]], list[dict[str, float]] | None]],
    base_weights: dict[str, float] | None = None,
    learning_rate: float = 1.0,
    apply_privacy: bool = True,
    noise_std: float = 0.01,
    clip_norm: float = 1.0,
) -> FederatedServer:
    server = FederatedServer(global_weights=dict(base_weights or default_global_weights()))
    from .client import simulate_client_update

    updates: list[dict[str, Any]] = []
    for client_id, (positives, negatives) in client_payloads.items():
        updates.append(simulate_client_update(client_id, DEFAULT_WEIGHT_KEYS, positives, negatives, base_weights=server.global_weights))

    server.run_round(
        updates,
        learning_rate=learning_rate,
        apply_privacy=apply_privacy,
        noise_std=noise_std,
        clip_norm=clip_norm,
    )
    return server
