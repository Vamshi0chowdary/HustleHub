from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from app.config.database import close_mongo_connection, connect_to_mongo, get_database
from app.config.settings import get_settings
from app.utils.serializers import serialize_mongo

from .embeddings import EmbeddingSpace, combine_tokens, sparse_row_to_dense
from .model import RecommendationArtifacts
from .ranker import RankerModel
from .utils import difficulty_alignment, implicit_feedback_score, infer_category, normalize_count


async def _fetch_documents(collection) -> list[dict[str, Any]]:
    documents: list[dict[str, Any]] = []
    async for document in collection.find({}):
        documents.append(serialize_mongo(document))
    return documents


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
    age_hours = max((datetime.now(timezone.utc) - _to_dt(created_at)).total_seconds() / 3600.0, 0.0)
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


def _user_doc(user: dict[str, Any]) -> str:
    return combine_tokens(user.get("skills", []), user.get("bio", ""), user.get("level", ""))


def _video_doc(video: dict[str, Any]) -> str:
    category = video.get("category") or infer_category(video.get("tags", []), video.get("caption", ""))
    return combine_tokens(video.get("tags", []), video.get("title", ""), video.get("caption", ""), category, video.get("difficulty_level", ""))


def _build_user_profile(user: dict[str, Any], liked_count: int) -> dict[str, float]:
    return {
        "activity_frequency": normalize_count(user.get("activity_score", 0), 100.0),
        "session_time": min(1.0, 0.2 + liked_count / 200.0),
        "preference_weight": min(1.0, 0.5 + liked_count / 150.0),
    }


def _build_item_profile(video: dict[str, Any]) -> dict[str, Any]:
    return {
        "popularity_score": _popularity_score(video),
        "recency_score": _recency_score(video.get("created_at")),
        "engagement_rate": _engagement_rate(video),
        "creator_id": video.get("user_id", ""),
        "difficulty_level": video.get("difficulty_level", "beginner"),
        "duration_seconds": int(video.get("duration_seconds", 0) or 0),
    }


def _rank_features(
    ann_similarity: float,
    user_profile: dict[str, float],
    item_profile: dict[str, Any],
    watch_time_ratio: float,
    like_probability: float,
    creator_affinity: float,
    difficulty_alignment_score: float,
) -> dict[str, float]:
    preference_alignment = min(1.0, max(0.0, ann_similarity * float(user_profile.get("preference_weight", 0.6))))
    return {
        "ann_similarity": ann_similarity,
        "popularity_score": float(item_profile.get("popularity_score", 0.0)),
        "recency_score": float(item_profile.get("recency_score", 0.0)),
        "activity_frequency": float(user_profile.get("activity_frequency", 0.0)),
        "session_time": float(user_profile.get("session_time", 0.0)),
        "preference_alignment": preference_alignment,
        "difficulty_alignment": float(difficulty_alignment_score),
        "watch_time_ratio": watch_time_ratio,
        "like_probability": like_probability,
        "engagement_rate": float(item_profile.get("engagement_rate", 0.0)),
        "creator_affinity": creator_affinity,
    }


def _sample_negatives(video_ids: list[str], positive_ids: set[str], sample_size: int) -> list[str]:
    candidates = [video_id for video_id in video_ids if video_id not in positive_ids]
    if not candidates:
        return []
    random.shuffle(candidates)
    return candidates[:sample_size]


def _feedback_label(row: dict[str, Any], video: dict[str, Any]) -> int:
    watch_time_ratio = float(row.get("watch_time_ratio", 0.0) or 0.0)
    like_signal = 1.0 if row.get("positive", False) or str(row.get("action", "")).lower() in {"like", "save", "share"} else 0.0
    engagement = float(row.get("engagement_score", _engagement_rate(video)) or 0.0)
    recency = _recency_score(row.get("created_at"))
    score = implicit_feedback_score(
        watch_time_ratio=watch_time_ratio,
        like_signal=like_signal,
        engagement=engagement,
        recency=recency,
    )
    return 1 if score >= 0.55 else 0


def _evaluate_ranker(ranker: RankerModel, evaluation_by_user: dict[str, list[dict[str, Any]]], k: int = 10) -> dict[str, float]:
    precision_scores: list[float] = []
    recall_scores: list[float] = []
    accuracy_hits = 0
    accuracy_total = 0

    for rows in evaluation_by_user.values():
        if not rows:
            continue

        features = [row["features"] for row in rows]
        labels = [int(row["label"]) for row in rows]
        if not any(labels):
            continue

        scores = ranker.predict_scores(features)
        paired = sorted(zip(scores, labels), key=lambda item: item[0], reverse=True)
        top_k = paired[: min(k, len(paired))]
        positives = sum(labels)
        hits = sum(label for _, label in top_k)

        precision_scores.append(hits / max(len(top_k), 1))
        recall_scores.append(hits / max(positives, 1))

        for score, label in paired:
            prediction = 1 if score >= 0.5 else 0
            accuracy_hits += 1 if prediction == label else 0
            accuracy_total += 1

    return {
        f"precision_at_{k}": float(np.mean(precision_scores)) if precision_scores else 0.0,
        f"recall_at_{k}": float(np.mean(recall_scores)) if recall_scores else 0.0,
        "engagement_accuracy": float(accuracy_hits / max(accuracy_total, 1)),
    }


async def train_model(model_path: str | Path | None = None) -> RecommendationArtifacts:
    settings = get_settings()
    target_path = Path(model_path or settings.recommendation_model_path)

    await connect_to_mongo()
    db = get_database()

    users = await _fetch_documents(db.users)
    videos = await _fetch_documents(db.videos)
    likes = await _fetch_documents(db.likes)
    feedback = await _fetch_documents(db.recommendation_feedback)

    users_by_id = {row["id"]: row for row in users}
    videos_by_id = {row["id"]: row for row in videos}

    user_likes: dict[str, set[str]] = {}
    for row in likes:
        user_likes.setdefault(row.get("user_id", ""), set()).add(row.get("video_id", ""))

    user_docs = [_user_doc(user) for user in users]
    video_docs = [_video_doc(video) for video in videos]

    embedding_space = EmbeddingSpace.create(max_features=4000)
    embedding_space.fit_transform(user_docs + video_docs)

    user_vectors: dict[str, np.ndarray] = {}
    user_profiles: dict[str, dict[str, Any]] = {}
    for user in users:
        user_id = user["id"]
        vector = sparse_row_to_dense(embedding_space.transform([_user_doc(user)]), 0)
        user_vectors[user_id] = vector
        user_profiles[user_id] = _build_user_profile(user, len(user_likes.get(user_id, set())))

    item_vectors: dict[str, np.ndarray] = {}
    item_profiles: dict[str, dict[str, Any]] = {}
    for video in videos:
        video_id = video["id"]
        vector = sparse_row_to_dense(embedding_space.transform([_video_doc(video)]), 0)
        item_vectors[video_id] = vector
        item_profiles[video_id] = _build_item_profile(video)

    follows_by_user: dict[str, set[str]] = {}
    async for row in db.follows.find({}, {"follower_id": 1, "following_id": 1}):
        follower_id = row.get("follower_id")
        following_id = row.get("following_id")
        if follower_id and following_id:
            follows_by_user.setdefault(follower_id, set()).add(following_id)

    rank_rows: list[dict[str, float]] = []
    rank_labels: list[int] = []
    rank_examples_by_user: dict[str, list[dict[str, Any]]] = {}
    all_video_ids = list(videos_by_id.keys())

    for user_id, positive_ids in user_likes.items():
        if user_id not in users_by_id:
            continue

        user_profile = user_profiles.get(user_id, {"activity_frequency": 0.0, "session_time": 0.2, "preference_weight": 0.6})
        followings = follows_by_user.get(user_id, set())
        user_vector = user_vectors.get(user_id)
        if user_vector is None:
            continue

        for video_id in positive_ids:
            video = videos_by_id.get(video_id)
            item_profile = item_profiles.get(video_id)
            item_vec = item_vectors.get(video_id)
            if not video or not item_profile or item_vec is None:
                continue

            denom = float(np.linalg.norm(user_vector) * np.linalg.norm(item_vec))
            ann_similarity = float(np.dot(user_vector, item_vec) / denom) if denom > 0 else 0.0
            like_probability = min(1.0, ann_similarity * 0.75 + item_profile["engagement_rate"] * 0.25)
            watch_time_ratio = min(1.0, 0.6 + item_profile["engagement_rate"] * 0.4)
            creator_affinity = 1.0 if video.get("user_id") in followings else 0.0
            difficulty_match = difficulty_alignment(user.get("level", "beginner"), video.get("difficulty_level", "beginner"))

            features = _rank_features(
                ann_similarity,
                user_profile,
                item_profile,
                watch_time_ratio,
                like_probability,
                creator_affinity,
                difficulty_match,
            )
            rank_rows.append(features)
            rank_labels.append(1)
            rank_examples_by_user.setdefault(user_id, []).append({"features": features, "label": 1})

        negative_ids = _sample_negatives(all_video_ids, positive_ids, sample_size=max(len(positive_ids), 4))
        for video_id in negative_ids:
            video = videos_by_id.get(video_id)
            item_profile = item_profiles.get(video_id)
            item_vec = item_vectors.get(video_id)
            if not video or not item_profile or item_vec is None:
                continue

            denom = float(np.linalg.norm(user_vector) * np.linalg.norm(item_vec))
            ann_similarity = float(np.dot(user_vector, item_vec) / denom) if denom > 0 else 0.0
            like_probability = max(0.0, ann_similarity * 0.3)
            watch_time_ratio = max(0.0, ann_similarity * 0.4)
            creator_affinity = 1.0 if video.get("user_id") in followings else 0.0
            difficulty_match = difficulty_alignment(user.get("level", "beginner"), video.get("difficulty_level", "beginner"))

            features = _rank_features(
                ann_similarity,
                user_profile,
                item_profile,
                watch_time_ratio,
                like_probability,
                creator_affinity,
                difficulty_match,
            )
            rank_rows.append(features)
            rank_labels.append(0)
            rank_examples_by_user.setdefault(user_id, []).append({"features": features, "label": 0})

    for row in feedback:
        user_id = row.get("user_id")
        video_id = row.get("video_id")
        if user_id not in user_vectors or video_id not in item_vectors:
            continue

        user_profile = user_profiles.get(user_id, {"activity_frequency": 0.0, "session_time": 0.2, "preference_weight": 0.6})
        item_profile = item_profiles.get(video_id, {"popularity_score": 0.0, "recency_score": 0.0, "engagement_rate": 0.0, "creator_id": ""})

        user_vec = user_vectors[user_id]
        item_vec = item_vectors[video_id]
        denom = float(np.linalg.norm(user_vec) * np.linalg.norm(item_vec))
        ann_similarity = float(np.dot(user_vec, item_vec) / denom) if denom > 0 else 0.0
        watch_time_ratio = float(row.get("watch_time_ratio", 0.0) or 0.0)
        like_probability = min(1.0, 0.75 * ann_similarity + 0.25 * watch_time_ratio)
        creator_affinity = 0.0

        difficulty_match = difficulty_alignment(user.get("level", "beginner"), item_profile.get("difficulty_level", "beginner"))
        video = videos_by_id.get(video_id, {})
        label = _feedback_label(row, video)

        features = _rank_features(
            ann_similarity,
            user_profile,
            item_profile,
            watch_time_ratio,
            like_probability,
            creator_affinity,
            difficulty_match,
        )
        rank_rows.append(features)
        rank_labels.append(label)
        rank_examples_by_user.setdefault(user_id, []).append({"features": features, "label": label})

    rng = random.Random(42)
    train_rows: list[dict[str, float]] = []
    train_labels: list[int] = []
    evaluation_by_user: dict[str, list[dict[str, Any]]] = {}

    for user_id, examples in rank_examples_by_user.items():
        if len(examples) < 5:
            train_examples = list(examples)
            test_examples: list[dict[str, Any]] = []
        else:
            shuffled = list(examples)
            rng.shuffle(shuffled)
            test_size = max(1, int(round(len(shuffled) * 0.2)))
            candidate_train = shuffled[test_size:]
            if len(candidate_train) >= 8 and len({row["label"] for row in candidate_train}) >= 2:
                train_examples = candidate_train
                test_examples = shuffled[:test_size]
            else:
                train_examples = shuffled
                test_examples = []

        train_rows.extend(example["features"] for example in train_examples)
        train_labels.extend(int(example["label"]) for example in train_examples)
        if test_examples:
            evaluation_by_user[user_id] = test_examples

    ranker = RankerModel()
    trained_ok = ranker.fit(train_rows, train_labels)
    metrics = _evaluate_ranker(ranker, evaluation_by_user, k=10)

    artifacts = RecommendationArtifacts(
        embedding_space=embedding_space,
        ranker=ranker,
        user_vectors=user_vectors,
        user_profiles=user_profiles,
        item_vectors=item_vectors,
        item_profiles=item_profiles,
        metadata={
            "users": len(users),
            "videos": len(videos),
            "likes": len(likes),
            "feedback_events": len(feedback),
            "rank_rows": len(train_rows),
            "evaluation_rows": sum(len(rows) for rows in evaluation_by_user.values()),
            "ranker_trained": trained_ok,
            "metrics": metrics,
        },
    )
    artifacts.save(target_path)
    await close_mongo_connection()
    return artifacts


async def _main() -> None:
    settings = get_settings()
    artifacts = await train_model(settings.recommendation_model_path)
    print(f"Saved recommendation model to {settings.recommendation_model_path}")
    print(artifacts.metadata)
    metrics = artifacts.metadata.get("metrics", {})
    if metrics:
        print("Evaluation:", ", ".join(f"{key}={value:.4f}" for key, value in metrics.items()))


def main() -> None:
    asyncio.run(_main())


if __name__ == "__main__":
    main()
