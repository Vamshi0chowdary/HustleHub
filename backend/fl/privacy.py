from __future__ import annotations

import random


def clip_updates(weights: dict[str, float], clip_norm: float = 1.0) -> dict[str, float]:
    squared_sum = sum(float(value) ** 2 for value in weights.values())
    norm = squared_sum ** 0.5
    if norm <= clip_norm or norm == 0:
        return dict(weights)
    scale = clip_norm / norm
    return {key: float(value) * scale for key, value in weights.items()}


def add_gaussian_noise(weights: dict[str, float], noise_std: float = 0.01) -> dict[str, float]:
    if noise_std <= 0:
        return dict(weights)
    return {key: float(value) + random.gauss(0.0, noise_std) for key, value in weights.items()}
