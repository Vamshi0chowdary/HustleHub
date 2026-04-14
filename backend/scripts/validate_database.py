from __future__ import annotations

import json
import os
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / ".env"
REPORT_PATH = BASE_DIR / "reports" / "database_validation_report.json"

COLLECTIONS = [
    "users",
    "videos",
    "likes",
    "follows",
    "recommendation_feedback",
]

REQUIRED_FIELDS: dict[str, list[str]] = {
    "users": ["username", "email", "skills", "level", "activity_score", "created_at"],
    "videos": ["user_id", "video_url", "caption", "tags", "likes_count", "comments_count", "created_at"],
    "likes": ["user_id", "video_id", "created_at"],
    "follows": ["follower_id", "following_id", "created_at"],
    "recommendation_feedback": ["user_id", "video_id", "action", "watch_time_ratio", "created_at"],
}

NON_EMPTY_LIST_FIELDS: dict[str, list[str]] = {
    "users": ["skills"],
    "videos": ["tags"],
}

NON_EMPTY_STRING_FIELDS: dict[str, list[str]] = {
    "users": ["username", "email", "level"],
    "videos": ["user_id", "video_url"],
    "likes": ["user_id", "video_id"],
    "follows": ["follower_id", "following_id"],
    "recommendation_feedback": ["user_id", "video_id", "action"],
}

RELATIONSHIP_FIELDS = {
    "videos": [("user_id", "users")],
    "likes": [("user_id", "users"), ("video_id", "videos")],
    "follows": [("follower_id", "users"), ("following_id", "users")],
    "recommendation_feedback": [("user_id", "users"), ("video_id", "videos")],
}


def _sanitize_uri(uri: str) -> str:
    parts = urlsplit(uri)
    netloc = parts.netloc
    if "@" in netloc:
        creds, host = netloc.rsplit("@", 1)
        username = creds.split(":", 1)[0]
        netloc = f"{username}:***@{host}"
    return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, (list, tuple, set, dict)):
        return len(value) == 0
    return False


def _load_environment() -> tuple[MongoClient, str, str]:
    load_dotenv(ENV_PATH)
    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/hustlehub")
    db_name = os.getenv("MONGODB_DB_NAME", "hustlehub")
    client = MongoClient(
        uri,
        serverSelectionTimeoutMS=int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "15000")),
        connectTimeoutMS=int(os.getenv("MONGODB_CONNECT_TIMEOUT_MS", "15000")),
        socketTimeoutMS=int(os.getenv("MONGODB_SOCKET_TIMEOUT_MS", "15000")),
    )
    return client, uri, db_name


def _validate_fields(document: dict[str, Any], collection_name: str) -> list[str]:
    missing_fields: list[str] = []
    for field_name in REQUIRED_FIELDS.get(collection_name, []):
        if field_name not in document or _is_missing(document.get(field_name)):
            missing_fields.append(field_name)

    for field_name in NON_EMPTY_LIST_FIELDS.get(collection_name, []):
        value = document.get(field_name)
        if not isinstance(value, list) or not value:
            missing_fields.append(field_name)

    for field_name in NON_EMPTY_STRING_FIELDS.get(collection_name, []):
        value = document.get(field_name)
        if not isinstance(value, str) or not value.strip():
            missing_fields.append(field_name)

    return sorted(set(missing_fields))


def _pairwise_duplicates(rows: list[dict[str, Any]], key_fields: tuple[str, str]) -> int:
    counter: Counter[tuple[str, str]] = Counter()
    for row in rows:
        left = str(row.get(key_fields[0], ""))
        right = str(row.get(key_fields[1], ""))
        if left and right:
            counter[(left, right)] += 1
    return sum(count - 1 for count in counter.values() if count > 1)


def _load_rows(collection) -> list[dict[str, Any]]:
    return list(collection.find({}))


def main() -> int:
    client, uri, db_name = _load_environment()
    db = client[db_name]

    print("=" * 72)
    print(" HustleHub Database Validation")
    print("=" * 72)
    print(f"MongoDB: {_sanitize_uri(uri)}")
    print(f"Database: {db_name}")

    started = time.perf_counter()
    ping_start = time.perf_counter()
    client.admin.command("ping")
    ping_ms = (time.perf_counter() - ping_start) * 1000.0

    report: dict[str, Any] = {
        "mongo_uri": _sanitize_uri(uri),
        "database": db_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "ping_ms": round(ping_ms, 2),
        "collections": {},
        "relationships": {},
        "summary": {},
    }

    rows_by_collection: dict[str, list[dict[str, Any]]] = {}
    ids_by_collection: dict[str, set[str]] = {}
    total_missing = 0
    total_orphans = 0
    total_duplicates = 0

    for collection_name in COLLECTIONS:
        collection = db[collection_name]
        count_start = time.perf_counter()
        count = collection.count_documents({})
        rows = _load_rows(collection)
        elapsed_ms = (time.perf_counter() - count_start) * 1000.0
        rows_by_collection[collection_name] = rows
        ids_by_collection[collection_name] = {str(row["_id"]) for row in rows if row.get("_id") is not None}

        missing_details: list[dict[str, Any]] = []
        for row in rows:
            missing_fields = _validate_fields(row, collection_name)
            if missing_fields:
                missing_details.append(
                    {
                        "id": str(row.get("_id", "")),
                        "missing_fields": missing_fields,
                    }
                )

        report["collections"][collection_name] = {
            "count": count,
            "count_latency_ms": round(elapsed_ms, 2),
            "missing_documents": len(missing_details),
            "sample_missing": missing_details[:10],
        }
        total_missing += len(missing_details)

    for collection_name, relations in RELATIONSHIP_FIELDS.items():
        rows = rows_by_collection.get(collection_name, [])
        relation_summary: dict[str, Any] = {}
        for field_name, target_collection in relations:
            target_ids = ids_by_collection.get(target_collection, set())
            orphan_rows = [row for row in rows if str(row.get(field_name, "")) not in target_ids]
            relation_summary[field_name] = {
                "target_collection": target_collection,
                "orphans": len(orphan_rows),
                "sample_orphans": [
                    {
                        "id": str(row.get("_id", "")),
                        field_name: str(row.get(field_name, "")),
                    }
                    for row in orphan_rows[:10]
                ],
            }
            total_orphans += len(orphan_rows)
        report["relationships"][collection_name] = relation_summary

    duplicate_likes = _pairwise_duplicates(rows_by_collection.get("likes", []), ("user_id", "video_id"))
    duplicate_follows = _pairwise_duplicates(rows_by_collection.get("follows", []), ("follower_id", "following_id"))
    total_duplicates = duplicate_likes + duplicate_follows

    report["relationships"]["duplicates"] = {
        "likes": duplicate_likes,
        "follows": duplicate_follows,
    }
    report["summary"] = {
        "ok": total_missing == 0 and total_orphans == 0 and total_duplicates == 0 and all(
            report["collections"][name]["count"] > 0 for name in COLLECTIONS
        ),
        "total_missing_documents": total_missing,
        "total_orphan_references": total_orphans,
        "total_duplicate_pairs": total_duplicates,
        "validation_time_ms": round((time.perf_counter() - started) * 1000.0, 2),
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Ping latency: {ping_ms:.2f} ms")
    print("\nCollection summary:")
    for name in COLLECTIONS:
        data = report["collections"][name]
        print(
            f"- {name}: count={data['count']}, missing_docs={data['missing_documents']}, "
            f"count_latency_ms={data['count_latency_ms']:.2f}"
        )

    print("\nRelationship summary:")
    for name in ["videos", "likes", "follows", "recommendation_feedback"]:
        relation_data = report["relationships"].get(name, {})
        if not relation_data:
            continue
        for field_name, details in relation_data.items():
            if field_name == "duplicates":
                continue
            print(f"- {name}.{field_name} -> {details['target_collection']}: orphans={details['orphans']}")
    print(
        f"\nDuplicates: likes={duplicate_likes}, follows={duplicate_follows}"
    )
    print(f"\nReport saved to: {REPORT_PATH}")
    print(f"Validation status: {'PASS' if report['summary']['ok'] else 'FAIL'}")

    return 0 if report["summary"]["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
