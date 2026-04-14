from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from ml.utils import apply_feature_weights


@dataclass
class FederatedClient:
    client_id: str
    feature_keys: list[str]
    base_weights: dict[str, float] = field(default_factory=dict)

    def train_local(self, positive_examples: list[dict[str, float]], negative_examples: list[dict[str, float]] | None = None) -> dict[str, Any]:
        negative_examples = negative_examples or []
        updates: dict[str, float] = {key: 0.0 for key in self.feature_keys}

        if positive_examples:
            for example in positive_examples:
                weighted = apply_feature_weights(example, self.base_weights)
                for key, value in weighted.items():
                    if key in updates:
                        updates[key] += float(value)

        if negative_examples:
            for example in negative_examples:
                weighted = apply_feature_weights(example, self.base_weights)
                for key, value in weighted.items():
                    if key in updates:
                        updates[key] -= float(value)

        sample_count = max(len(positive_examples) + len(negative_examples), 1)
        for key in list(updates):
            updates[key] = float(np.clip(updates[key] / sample_count, -1.0, 1.0))

        return {
            "client_id": self.client_id,
            "weights": updates,
            "num_samples": sample_count,
        }


def simulate_client_update(client_id: str, feature_keys: list[str], positives: list[dict[str, float]], negatives: list[dict[str, float]] | None = None, base_weights: dict[str, float] | None = None) -> dict[str, Any]:
    client = FederatedClient(client_id=client_id, feature_keys=feature_keys, base_weights=base_weights or {})
    return client.train_local(positives, negatives)
