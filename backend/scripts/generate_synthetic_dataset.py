from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from bson import ObjectId
from dotenv import load_dotenv
from passlib.context import CryptContext
from pymongo import MongoClient, UpdateOne

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ml.utils import difficulty_alignment, implicit_feedback_score, jaccard_similarity, normalize_level

ENV_PATH = BASE_DIR / ".env"
REPORT_PATH = BASE_DIR / "reports" / "synthetic_dataset_report.json"

COLLECTIONS = ["users", "videos", "likes", "follows", "recommendation_feedback"]
DEMO_PASSWORD = "StrongPass123!"
PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")

LEVEL_DISTRIBUTION = ["beginner"] * 35 + ["intermediate"] * 45 + ["advanced"] * 20

FIRST_NAMES = [
    "Aarav", "Aditi", "Anaya", "Arjun", "Dev", "Ishaan", "Kavya", "Mira", "Neha", "Rohan",
    "Sanya", "Tara", "Vihaan", "Zoya", "Kabir", "Priya", "Nikhil", "Riya", "Aniket", "Meera",
    "Kunal", "Sara", "Shreya", "Aditya", "Ira", "Tanvi", "Rahul", "Naina", "Vivaan", "Aisha",
]

LAST_NAMES = [
    "Sharma", "Reddy", "Verma", "Iyer", "Khan", "Mehta", "Kapoor", "Nair", "Patel", "Chopra",
    "Singh", "Das", "Saxena", "Bose", "Malhotra", "Bhat", "Khanna", "Joshi", "Gupta", "Pillai",
]

TOPIC_BUCKETS: list[dict[str, Any]] = [
    {
        "name": "dsa",
        "skills": ["dsa", "algorithms", "leetcode", "data-structures"],
        "tags": ["dsa", "algorithms", "coding", "problem-solving"],
        "title_templates": [
            "{topic}: mastering {focus}",
            "{topic} walkthrough for {focus}",
            "{topic} interview prep with {focus}",
        ],
        "caption_templates": [
            "A focused breakdown of {topic} with patterns, edge cases, and mental models.",
            "Short, practical lessons on {topic} for builders who want strong fundamentals.",
            "A clean explanation of {topic} with examples you can reuse in interviews.",
        ],
        "difficulty_weights": {"beginner": 4, "intermediate": 5, "advanced": 4},
        "duration": (45, 180),
    },
    {
        "name": "web",
        "skills": ["react", "javascript", "typescript", "frontend", "ui"],
        "tags": ["react", "javascript", "typescript", "ui", "frontend"],
        "title_templates": [
            "Building a {topic} feature with {focus}",
            "{topic} deep dive: {focus}",
            "Ship a {topic} workflow using {focus}",
        ],
        "caption_templates": [
            "Practical frontend craft for people shipping modern product experiences.",
            "A compact walkthrough of frontend structure, state, and polish.",
            "Build cleaner interfaces with a focus on usability and implementation details.",
        ],
        "difficulty_weights": {"beginner": 2, "intermediate": 6, "advanced": 2},
        "duration": (35, 150),
    },
    {
        "name": "backend",
        "skills": ["backend", "api", "fastapi", "python"],
        "tags": ["backend", "api", "fastapi", "python", "architecture"],
        "title_templates": [
            "{topic} system design with {focus}",
            "{topic} API build: {focus}",
            "Scaling {topic} with {focus}",
        ],
        "caption_templates": [
            "Backend patterns for reliability, clean APIs, and maintainable services.",
            "Practical lessons for building robust backend systems.",
            "Implementation-first content for API and service architecture.",
        ],
        "difficulty_weights": {"beginner": 2, "intermediate": 5, "advanced": 4},
        "duration": (50, 200),
    },
    {
        "name": "ml",
        "skills": ["machine-learning", "data-science", "pytorch", "numpy"],
        "tags": ["machine-learning", "data-science", "modeling", "python"],
        "title_templates": [
            "{topic}: {focus} without the fluff",
            "Applied {topic} with {focus}",
            "{topic} case study: {focus}",
        ],
        "caption_templates": [
            "Build intuition for models, features, and evaluation with practical examples.",
            "Clear, production-minded ML content for builders who care about signal quality.",
            "A concise guide to useful ML patterns and how they behave in real systems.",
        ],
        "difficulty_weights": {"beginner": 1, "intermediate": 4, "advanced": 5},
        "duration": (55, 220),
    },
    {
        "name": "devops",
        "skills": ["devops", "docker", "kubernetes", "ci/cd"],
        "tags": ["devops", "docker", "kubernetes", "ci-cd", "infra"],
        "title_templates": [
            "{topic} in practice: {focus}",
            "{topic} setup for reliable shipping",
            "{topic} patterns with {focus}",
        ],
        "caption_templates": [
            "Operational patterns that make shipping faster and safer.",
            "A practical guide to infrastructure, deployment, and reliability.",
            "Lessons on automation, containers, and release discipline.",
        ],
        "difficulty_weights": {"beginner": 1, "intermediate": 4, "advanced": 6},
        "duration": (45, 180),
    },
    {
        "name": "system-design",
        "skills": ["system-design", "architecture", "scalability", "distributed-systems"],
        "tags": ["system-design", "architecture", "scalability", "distributed-systems"],
        "title_templates": [
            "{topic}: {focus}",
            "Designing {topic} with {focus}",
            "{topic} interview notes: {focus}",
        ],
        "caption_templates": [
            "A higher-level exploration of architecture trade-offs, bottlenecks, and scale.",
            "Useful when you want to reason about systems rather than memorize patterns.",
            "A strong fit for advanced learners and interview preparation.",
        ],
        "difficulty_weights": {"beginner": 0, "intermediate": 3, "advanced": 7},
        "duration": (60, 240),
    },
    {
        "name": "product-analytics",
        "skills": ["product", "analytics", "experimentation", "metrics"],
        "tags": ["product", "analytics", "experimentation", "metrics"],
        "title_templates": [
            "{topic} lesson: {focus}",
            "{topic} for builders: {focus}",
            "{topic} teardown with {focus}",
        ],
        "caption_templates": [
            "Strong product thinking with practical execution and measurement.",
            "Useful for people who want to connect user behavior with product decisions.",
            "A compact view of how to reason about growth and product signal.",
        ],
        "difficulty_weights": {"beginner": 4, "intermediate": 5, "advanced": 1},
        "duration": (35, 130),
    },
    {
        "name": "mobile",
        "skills": ["mobile", "react-native", "expo", "ui"],
        "tags": ["mobile", "react-native", "expo", "ui"],
        "title_templates": [
            "{topic} build log: {focus}",
            "{topic} UX system with {focus}",
            "Shipping {topic} with {focus}",
        ],
        "caption_templates": [
            "Mobile-first implementation details with a focus on polished delivery.",
            "A practical path from concept to production-ready mobile flow.",
            "Short lessons on shipping smooth mobile experiences.",
        ],
        "difficulty_weights": {"beginner": 1, "intermediate": 6, "advanced": 2},
        "duration": (40, 160),
    },
    {
        "name": "cloud-security",
        "skills": ["cloud", "aws", "security", "infra"],
        "tags": ["cloud", "aws", "security", "infra"],
        "title_templates": [
            "{topic}: {focus}",
            "Cloud security walkthrough with {focus}",
            "{topic} hardening for shipping teams",
        ],
        "caption_templates": [
            "Security-minded cloud patterns for teams that ship fast.",
            "A useful mix of cloud primitives, threat models, and deployment hygiene.",
            "Advanced content for infrastructure and security practitioners.",
        ],
        "difficulty_weights": {"beginner": 0, "intermediate": 3, "advanced": 6},
        "duration": (55, 210),
    },
    {
        "name": "data-engineering",
        "skills": ["sql", "postgres", "data-engineering", "analytics"],
        "tags": ["sql", "postgres", "data-engineering", "analytics"],
        "title_templates": [
            "{topic} patterns with {focus}",
            "{topic} build: {focus}",
            "{topic} made practical with {focus}",
        ],
        "caption_templates": [
            "Practical data workflows, warehouse reasoning, and pipeline hygiene.",
            "Build a stronger analytical foundation with concrete examples.",
            "Short lessons on how real data systems stay usable and fast.",
        ],
        "difficulty_weights": {"beginner": 2, "intermediate": 5, "advanced": 3},
        "duration": (45, 190),
    },
]

FOCUS_WORDS = [
    "interview prep",
    "production patterns",
    "clean architecture",
    "hands-on implementation",
    "performance tuning",
    "real-world tradeoffs",
    "portfolio quality",
    "team-ready workflows",
]

LEVEL_WEIGHTS = {"beginner": 35, "intermediate": 45, "advanced": 20}
ACTION_WEIGHTS = {
    "like": 5,
    "save": 3,
    "share": 2,
    "watch": 7,
    "skip": 6,
}


def _sanitize_uri(uri: str) -> str:
    parts = urlsplit(uri)
    netloc = parts.netloc
    if "@" in netloc:
        creds, host = netloc.rsplit("@", 1)
        username = creds.split(":", 1)[0]
        netloc = f"{username}:***@{host}"
    return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))


def _slugify(value: str) -> str:
    return "".join(character.lower() if character.isalnum() else "-" for character in value).strip("-")


def _weighted_choice(rng: random.Random, items: list[Any], weights: list[float]) -> Any:
    return rng.choices(items, weights=weights, k=1)[0]


def _batch_token(batch_id: str) -> str:
    token = "".join(ch for ch in batch_id if ch.isdigit())
    return token[-8:] if len(token) >= 8 else token or "batch"


def _unique_username(base_name: str, index: int, batch_id: str) -> str:
    return f"{_slugify(base_name)}_{_batch_token(batch_id)}_{index:03d}"


def _load_client() -> tuple[MongoClient, str, str, str]:
    load_dotenv(ENV_PATH)
    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/hustlehub")
    db_name = os.getenv("MONGODB_DB_NAME", "hustlehub")
    client = MongoClient(
        uri,
        serverSelectionTimeoutMS=int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "15000")),
        connectTimeoutMS=int(os.getenv("MONGODB_CONNECT_TIMEOUT_MS", "15000")),
        socketTimeoutMS=int(os.getenv("MONGODB_SOCKET_TIMEOUT_MS", "15000")),
    )
    client.admin.command("ping")
    return client, uri, db_name, os.getenv("SYNTHETIC_BATCH", datetime.utcnow().strftime("%Y%m%d%H%M%S"))


def _pick_bucket(rng: random.Random, level: str) -> dict[str, Any]:
    level_rank = normalize_level(level)
    weighted_buckets = []
    for bucket in TOPIC_BUCKETS:
        difficulty_bias = bucket["difficulty_weights"].get(level, 0)
        if difficulty_bias <= 0:
            continue
        weighted_buckets.extend([bucket] * difficulty_bias)
    if not weighted_buckets:
        weighted_buckets = TOPIC_BUCKETS[:]
    return rng.choice(weighted_buckets)


def _render_topic(bucket: dict[str, Any]) -> str:
    return bucket["name"].replace("-", " ")


def _build_user(rng: random.Random, index: int, batch_id: str) -> dict[str, Any]:
    level = _weighted_choice(rng, ["beginner", "intermediate", "advanced"], [LEVEL_WEIGHTS["beginner"], LEVEL_WEIGHTS["intermediate"], LEVEL_WEIGHTS["advanced"]])
    bucket_count = 2 if level == "beginner" else 3 if level == "intermediate" else 4
    buckets = rng.sample(TOPIC_BUCKETS, k=bucket_count)

    first_name = rng.choice(FIRST_NAMES)
    last_name = rng.choice(LAST_NAMES)
    name = f"{first_name} {last_name}"
    username = _unique_username(name, index, batch_id)
    email = f"{username}@example.com"

    skills = []
    for bucket in buckets:
        skills.extend(bucket["skills"])
    if level == "beginner":
        skills.extend(["learning", "projects"])
    elif level == "intermediate":
        skills.extend(["shipping", "teamwork"])
    else:
        skills.extend(["architecture", "mentoring"])
    skills = list(dict.fromkeys(skills))

    primary_bucket = buckets[0]
    activity_score = int(
        18
        + normalize_level(level) * 18
        + len(skills) * 2
        + rng.randint(0, 24)
    )

    bio = {
        "beginner": f"Learning {primary_bucket['name'].replace('-', ' ')} and building public projects.",
        "intermediate": f"Shipping product work around {primary_bucket['name'].replace('-', ' ')} and improving fast.",
        "advanced": f"Leading {primary_bucket['name'].replace('-', ' ')} work with an eye on scale and reliability.",
    }[level]

    phone = None
    if rng.random() < 0.38:
        phone = f"+91-9{rng.randint(100000000, 999999999)}"

    created_at = datetime.utcnow() - timedelta(days=rng.randint(5, 150), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))

    return {
        "name": name,
        "username": username,
        "email": email,
        "phone": phone,
        "password_hash": PASSWORD_CONTEXT.hash(DEMO_PASSWORD),
        "bio": bio,
        "skills": skills,
        "profile_picture": None,
        "level": level,
        "followers_count": 0,
        "following_count": 0,
        "activity_score": activity_score,
        "created_at": created_at,
        "updated_at": created_at,
        "data_origin": "synthetic",
        "synthetic_batch": batch_id,
    }


def _difficulty_for_creator(rng: random.Random, creator_level: str, bucket: dict[str, Any]) -> str:
    creator_rank = normalize_level(creator_level)
    options = ["beginner", "intermediate", "advanced"]
    weights = []
    for option in options:
        if option == "beginner":
            weight = 6 if creator_rank == 0 else 2
        elif option == "intermediate":
            weight = 6 if creator_rank == 1 else 4
        else:
            weight = 6 if creator_rank == 2 else 3
        weight += bucket["difficulty_weights"].get(option, 0)
        weights.append(max(weight, 0))
    return _weighted_choice(rng, options, weights)


def _build_video(rng: random.Random, index: int, creator: dict[str, Any], batch_id: str) -> dict[str, Any]:
    bucket = _pick_bucket(rng, creator["level"])
    difficulty_level = _difficulty_for_creator(rng, creator["level"], bucket)
    topic = _render_topic(bucket)
    focus = rng.choice(FOCUS_WORDS)
    title = rng.choice(bucket["title_templates"]).format(topic=topic.title(), focus=focus)
    caption = rng.choice(bucket["caption_templates"]).format(topic=topic.title(), focus=focus)
    tags = list(dict.fromkeys(bucket["tags"] + [difficulty_level, creator["level"], bucket["name"]]))

    base_duration = rng.randint(*bucket["duration"])
    duration_seconds = int(max(25, min(base_duration + rng.randint(-12, 18), 300)))
    created_at = datetime.utcnow() - timedelta(days=rng.randint(0, 120), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))

    slug = _slugify(f"{creator['username']}-{bucket['name']}-{index}")
    return {
        "user_id": creator["id"],
        "creator_id": creator["id"],
        "title": title,
        "video_url": f"https://cdn.hustlehub.example/videos/{slug}.mp4",
        "caption": caption,
        "tags": tags,
        "difficulty_level": difficulty_level,
        "duration_seconds": duration_seconds,
        "category": bucket["name"],
        "likes_count": 0,
        "comments_count": 0,
        "views_count": 0,
        "created_at": created_at,
        "updated_at": created_at,
        "data_origin": "synthetic",
        "synthetic_batch": batch_id,
    }


def _content_affinity(user: dict[str, Any], video: dict[str, Any], creator: dict[str, Any], age_days: float) -> float:
    user_skills = set(user.get("skills", []))
    video_tags = set(video.get("tags", []))
    skill_overlap = jaccard_similarity(user_skills, video_tags)
    level_fit = difficulty_alignment(user.get("level", "beginner"), video.get("difficulty_level", "beginner"))
    recency = math.exp(-age_days / 45.0)
    creator_boost = normalize_level(creator.get("level", "beginner")) / 2.0
    creator_popularity = min(1.0, creator.get("activity_score", 0) / 100.0)
    return max(
        0.0,
        min(
            1.0,
            0.44 * skill_overlap
            + 0.28 * level_fit
            + 0.12 * recency
            + 0.10 * creator_popularity
            + 0.06 * creator_boost,
        ),
    )


def _rank_videos_for_user(user: dict[str, Any], videos: list[dict[str, Any]], creators: dict[str, dict[str, Any]]) -> list[tuple[float, dict[str, Any]]]:
    scored: list[tuple[float, dict[str, Any]]] = []
    for video in videos:
        creator = creators.get(video["creator_id"])
        if not creator:
            continue
        age_days = max((datetime.utcnow() - video["created_at"]).total_seconds() / 86400.0, 0.0)
        score = _content_affinity(user, video, creator, age_days)
        if video["creator_id"] == user["id"]:
            score *= 0.4
        score += random.uniform(-0.025, 0.025)
        scored.append((score, video))
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored


def _build_interactions(
    rng: random.Random,
    users: list[dict[str, Any]],
    videos: list[dict[str, Any]],
    user_by_id: dict[str, dict[str, Any]],
    batch_id: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], dict[str, Counter[str]], dict[str, Counter[str]]]:
    likes: list[dict[str, Any]] = []
    follows: list[dict[str, Any]] = []
    feedback: list[dict[str, Any]] = []
    video_stats: dict[str, Counter[str]] = defaultdict(Counter)
    user_stats: dict[str, Counter[str]] = defaultdict(Counter)

    creators = {user["id"]: user for user in users}
    user_scores = {user["id"]: _rank_videos_for_user(user, videos, creators) for user in users}

    for user in users:
        ranked = user_scores[user["id"]]
        if not ranked:
            continue

        liked_target = max(8, min(28, int(10 + normalize_level(user["level"]) * 5 + rng.randint(0, 8))))
        feedback_target = max(12, min(30, int(14 + normalize_level(user["level"]) * 4 + rng.randint(0, 10))))
        follow_target = max(3, min(12, int(4 + normalize_level(user["level"]) * 2 + rng.randint(0, 4))))

        positive_pool = [video for score, video in ranked if score >= 0.56]
        neutral_pool = [video for score, video in ranked if 0.34 <= score < 0.56]
        negative_pool = [video for score, video in ranked if score < 0.34]

        chosen_like_ids: set[str] = set()
        for video in positive_pool[: liked_target * 2]:
            if len(chosen_like_ids) >= liked_target:
                break
            if video["creator_id"] == user["id"]:
                continue
            if video["id"] in chosen_like_ids:
                continue
            if rng.random() < 0.88:
                likes.append(
                    {
                        "user_id": user["id"],
                        "video_id": video["id"],
                        "created_at": datetime.utcnow() - timedelta(days=rng.randint(0, 25), hours=rng.randint(0, 23)),
                        "data_origin": "synthetic",
                        "synthetic_batch": batch_id,
                    }
                )
                chosen_like_ids.add(video["id"])
                video_stats[video["id"]]["likes"] += 1
                user_stats[user["id"]]["likes_given"] += 1

        potential_targets = [
            candidate
            for candidate in users
            if candidate["id"] != user["id"]
        ]
        potential_targets.sort(
            key=lambda candidate: (
                jaccard_similarity(set(user.get("skills", [])), set(candidate.get("skills", []))),
                -abs(normalize_level(user["level"]) - normalize_level(candidate["level"])),
                candidate.get("activity_score", 0),
            ),
            reverse=True,
        )
        for candidate in potential_targets[: follow_target * 3]:
            if len([item for item in follows if item["follower_id"] == user["id"]]) >= follow_target:
                break
            if candidate["id"] == user["id"]:
                continue
            if rng.random() < 0.7:
                follows.append(
                    {
                        "follower_id": user["id"],
                        "following_id": candidate["id"],
                        "created_at": datetime.utcnow() - timedelta(days=rng.randint(0, 60), hours=rng.randint(0, 23)),
                        "data_origin": "synthetic",
                        "synthetic_batch": batch_id,
                    }
                )
                user_stats[user["id"]]["following_count"] += 1
                user_stats[candidate["id"]]["followers_count"] += 1

        feedback_candidates = positive_pool[: max(feedback_target, 10)] + neutral_pool[: max(feedback_target // 2, 5)] + negative_pool[: max(feedback_target // 3, 4)]
        if not feedback_candidates:
            feedback_candidates = [video for _, video in ranked[:feedback_target]]

        for _ in range(feedback_target):
            video = rng.choice(feedback_candidates)
            creator = creators[video["creator_id"]]
            age_days = max((datetime.utcnow() - video["created_at"]).total_seconds() / 86400.0, 0.0)
            match_score = _content_affinity(user, video, creator, age_days)
            watch_time_ratio = max(0.2, min(1.0, 0.18 + match_score * 0.78 + rng.uniform(-0.08, 0.08)))
            engagement_score = max(0.0, min(1.0, 0.35 * match_score + 0.65 * watch_time_ratio))
            recency_score = max(0.0, min(1.0, math.exp(-age_days / 60.0)))
            implicit_score = implicit_feedback_score(
                watch_time_ratio=watch_time_ratio,
                like_signal=1.0 if match_score >= 0.7 else 0.0,
                engagement=engagement_score,
                recency=recency_score,
            )
            if implicit_score >= 0.76:
                action = _weighted_choice(rng, ["like", "save", "share"], [5, 2, 1])
            elif implicit_score >= 0.58:
                action = _weighted_choice(rng, ["watch", "like", "save"], [4, 3, 1])
            elif implicit_score >= 0.4:
                action = "watch"
            else:
                action = "skip"

            positive = action in {"like", "save", "share"} or watch_time_ratio >= 0.6
            session_time = int(max(18, min(video["duration_seconds"], video["duration_seconds"] * watch_time_ratio + rng.randint(-12, 18))))
            created_at = datetime.utcnow() - timedelta(days=rng.randint(0, 30), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))

            feedback.append(
                {
                    "user_id": user["id"],
                    "video_id": video["id"],
                    "action": action,
                    "watch_time_ratio": round(watch_time_ratio, 4),
                    "session_time": float(session_time),
                    "positive": positive,
                    "engagement_score": round(engagement_score, 4),
                    "implicit_score": round(implicit_score, 4),
                    "recency_score": round(recency_score, 4),
                    "difficulty_alignment": round(difficulty_alignment(user["level"], video["difficulty_level"]), 4),
                    "created_at": created_at,
                    "data_origin": "synthetic",
                    "synthetic_batch": batch_id,
                }
            )
            video_stats[video["id"]]["feedback"] += 1
            if positive:
                video_stats[video["id"]]["positive_feedback"] += 1
                user_stats[user["id"]]["positive_feedback"] += 1
            user_stats[user["id"]]["feedback_events"] += 1

    return likes, follows, feedback, video_stats, user_stats


def _update_counts(
    db,
    users: list[dict[str, Any]],
    videos: list[dict[str, Any]],
    user_by_id: dict[str, dict[str, Any]],
    video_stats: dict[str, Counter[str]],
    user_stats: dict[str, Counter[str]],
) -> None:
    video_updates: list[UpdateOne] = []
    for video in videos:
        stats = video_stats.get(video["id"], Counter())
        age_days = max((datetime.utcnow() - video["created_at"]).total_seconds() / 86400.0, 0.0)
        likes_count = int(stats.get("likes", 0))
        positive_feedback = int(stats.get("positive_feedback", 0))
        feedback_events = int(stats.get("feedback", 0))
        comments_count = int(max(0, round(positive_feedback * 0.25 + likes_count * 0.08 + feedback_events * 0.04 + random.randint(0, 4))))
        views_count = int(
            max(
                20,
                45
                + likes_count * 12
                + positive_feedback * 6
                + feedback_events * 3
                + int(math.exp(min(age_days, 120.0) / 45.0) * 14)
                + random.randint(0, 90),
            )
        )
        video_updates.append(
            UpdateOne(
                {"_id": video["_id"]},
                {
                    "$set": {
                        "likes_count": likes_count,
                        "comments_count": comments_count,
                        "views_count": views_count,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
        )
    if video_updates:
        db.videos.bulk_write(video_updates, ordered=False)

    user_updates: list[UpdateOne] = []
    for user in users:
        stats = user_stats.get(user["id"], Counter())
        videos_created = sum(1 for video in videos if video["creator_id"] == user["id"])
        likes_given = int(stats.get("likes_given", 0))
        following_count = int(stats.get("following_count", 0))
        followers_count = int(stats.get("followers_count", 0))
        positive_feedback = int(stats.get("positive_feedback", 0))
        feedback_events = int(stats.get("feedback_events", 0))

        activity_score = int(
            min(
                100,
                14
                + videos_created * 4
                + likes_given * 1.1
                + following_count * 1.8
                + followers_count * 1.2
                + positive_feedback * 0.8
                + feedback_events * 0.3,
            )
        )

        user_updates.append(
            UpdateOne(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "followers_count": followers_count,
                        "following_count": following_count,
                        "activity_score": activity_score,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
        )
    if user_updates:
        db.users.bulk_write(user_updates, ordered=False)


def _reset_collections(db) -> None:
    for name in COLLECTIONS:
        db[name].delete_many({})


def _build_report(
    users: list[dict[str, Any]],
    videos: list[dict[str, Any]],
    likes: list[dict[str, Any]],
    follows: list[dict[str, Any]],
    feedback: list[dict[str, Any]],
    batch_id: str,
    reset: bool,
    seed: int,
) -> dict[str, Any]:
    user_level_counts = Counter(user["level"] for user in users)
    difficulty_counts = Counter(video["difficulty_level"] for video in videos)
    topic_counts = Counter(video["category"] for video in videos)
    positive_feedback = sum(1 for row in feedback if row["positive"])
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "batch_id": batch_id,
        "seed": seed,
        "reset": reset,
        "users": len(users),
        "videos": len(videos),
        "likes": len(likes),
        "follows": len(follows),
        "feedback_events": len(feedback),
        "positive_feedback": positive_feedback,
        "user_level_counts": dict(user_level_counts),
        "video_difficulty_counts": dict(difficulty_counts),
        "video_category_counts": dict(topic_counts),
        "sample_users": [
            {
                "username": user["username"],
                "level": user["level"],
                "skills": user["skills"],
                "activity_score": user["activity_score"],
            }
            for user in users[:5]
        ],
        "sample_videos": [
            {
                "title": video["title"],
                "difficulty_level": video["difficulty_level"],
                "duration_seconds": video["duration_seconds"],
                "category": video["category"],
            }
            for video in videos[:5]
        ],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a realistic synthetic HustleHub dataset.")
    parser.add_argument("--users", type=int, default=240, help="Number of users to generate (100-500).")
    parser.add_argument("--videos", type=int, default=1200, help="Number of videos to generate (500-2000).")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--reset", action="store_true", help="Delete existing app collections before generation.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    user_count = max(100, min(args.users, 500))
    video_count = max(500, min(args.videos, 2000))
    rng = random.Random(args.seed)
    client, uri, db_name, batch_id = _load_client()
    db = client[db_name]

    if args.reset:
        _reset_collections(db)

    print("=" * 72)
    print(" HustleHub Synthetic Dataset Generator")
    print("=" * 72)
    print(f"MongoDB: {_sanitize_uri(uri)}")
    print(f"Database: {db_name}")
    print(f"Batch: {batch_id}")
    print(f"Reset existing collections: {args.reset}")
    print(f"Target sizes: users={user_count}, videos={video_count}")

    users: list[dict[str, Any]] = []
    for index in range(user_count):
        users.append(_build_user(rng, index, batch_id))

    if args.reset:
        demo_username = "demo_user_001"
        demo_email = "demo001@example.com"
    else:
        demo_suffix = _batch_token(batch_id)
        demo_username = f"demo_user_{demo_suffix}"
        demo_email = f"demo_{demo_suffix}@example.com"

    users[0]["username"] = demo_username
    users[0]["email"] = demo_email
    users[0]["name"] = "Demo User 001"
    users[0]["bio"] = "Demo account for validation and recommendation smoke tests."
    users[0]["skills"] = ["react", "javascript", "backend", "ui"]
    users[0]["level"] = "intermediate"
    users[0]["activity_score"] = 48

    inserted_user_ids = db.users.insert_many(users).inserted_ids
    for user, inserted_id in zip(users, inserted_user_ids):
        user["_id"] = inserted_id
        user["id"] = str(inserted_id)

    user_by_id = {user["id"]: user for user in users}

    videos: list[dict[str, Any]] = []
    creator_pool = list(users)
    creator_weights = [max(1, user["activity_score"]) for user in creator_pool]
    for index in range(video_count):
        creator = _weighted_choice(rng, creator_pool, creator_weights)
        videos.append(_build_video(rng, index, creator, batch_id))

    inserted_video_ids = db.videos.insert_many(videos).inserted_ids
    for video, inserted_id in zip(videos, inserted_video_ids):
        video["_id"] = inserted_id
        video["id"] = str(inserted_id)

    likes, follows, feedback, video_stats, user_stats = _build_interactions(
        rng,
        users,
        videos,
        user_by_id,
        batch_id,
    )

    if likes:
        db.likes.insert_many(likes)
    if follows:
        db.follows.insert_many(follows)
    if feedback:
        db.recommendation_feedback.insert_many(feedback)

    _update_counts(db, users, videos, user_by_id, video_stats, user_stats)

    report = _build_report(users, videos, likes, follows, feedback, batch_id, args.reset, args.seed)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\nGeneration summary:")
    print(f"- users inserted: {report['users']}")
    print(f"- videos inserted: {report['videos']}")
    print(f"- likes inserted: {report['likes']}")
    print(f"- follows inserted: {report['follows']}")
    print(f"- feedback inserted: {report['feedback_events']}")
    print(f"- positive feedback rate: {report['positive_feedback'] / max(report['feedback_events'], 1):.2%}")
    print(f"- report saved to: {REPORT_PATH}")
    print(f"- demo login: {users[0]['username']} / StrongPass123!")

    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
