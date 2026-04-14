from __future__ import annotations

from typing import Any

from .privacy import add_gaussian_noise, clip_updates


def aggregate_weight_updates(client_updates: list[dict[str, Any]], apply_privacy: bool = False, noise_std: float = 0.01, clip_norm: float = 1.0) -> dict[str, float]:
    if not client_updates:
        return {}

    weighted_sum: dict[str, float] = {}
    total_weight = 0.0

    for update in client_updates:
        weights = dict(update.get("weights", {}))
        sample_count = float(update.get("num_samples", 1) or 1.0)

        if apply_privacy:
            weights = clip_updates(weights, clip_norm=clip_norm)
            weights = add_gaussian_noise(weights, noise_std=noise_std)

        for key, value in weights.items():
            weighted_sum[key] = weighted_sum.get(key, 0.0) + float(value) * sample_count
        total_weight += sample_count

    if total_weight <= 0:
        return {}

    return {key: value / total_weight for key, value in weighted_sum.items()}



def merge_global_weights(base_weights: dict[str, float], delta_weights: dict[str, float], learning_rate: float = 1.0) -> dict[str, float]:
    merged = dict(base_weights)
    for key, value in delta_weights.items():
        merged[key] = merged.get(key, 1.0) + learning_rate * float(value)
    return merged
