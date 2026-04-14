import asyncio
import logging
import random
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from .settings import get_settings


client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
logger = logging.getLogger(__name__)


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database is not initialized")
    return _db


async def connect_to_mongo() -> None:
    global client, _db
    settings = get_settings()

    last_exc: Exception | None = None
    for attempt in range(1, settings.mongodb_connect_retries + 1):
        try:
            client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
                connectTimeoutMS=settings.mongodb_connect_timeout_ms,
                socketTimeoutMS=settings.mongodb_socket_timeout_ms,
                heartbeatFrequencyMS=settings.mongodb_heartbeat_frequency_ms,
                maxPoolSize=settings.mongodb_max_pool_size,
                minPoolSize=settings.mongodb_min_pool_size,
                maxIdleTimeMS=settings.mongodb_max_idle_time_ms,
                retryReads=True,
                retryWrites=False,
                appname="hustlehub-backend",
            )
            _db = client[settings.mongodb_db_name]

            await client.admin.command("ping")
            await _ensure_indexes(_db)

            logger.info("MongoDB connected successfully on attempt %s", attempt)
            return
        except Exception as exc:
            last_exc = exc
            if client is not None:
                client.close()
            client = None
            _db = None
            logger.warning(
                "MongoDB connection failed on attempt %s/%s with %s: %s",
                attempt,
                settings.mongodb_connect_retries,
                exc.__class__.__name__,
                str(exc),
            )

        if attempt == settings.mongodb_connect_retries:
            logger.exception("MongoDB connection failed after %s attempts", attempt)
            if last_exc is not None:
                raise last_exc
            raise RuntimeError("MongoDB connection failed with no captured exception")

        jitter = random.uniform(0.2, 0.8)
        delay = min(settings.mongodb_retry_delay_seconds * attempt, 8.0) + jitter
        logger.warning(
            "MongoDB connection attempt %s/%s failed. Retrying in %.2fs",
            attempt,
            settings.mongodb_connect_retries,
            delay,
        )
        await asyncio.sleep(delay)


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.users.create_index([("username", ASCENDING)], unique=True)
    await db.users.create_index([("skills", ASCENDING)])
    await db.users.create_index([("activity_score", DESCENDING)])

    await db.videos.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    await db.videos.create_index([("tags", ASCENDING)])
    await db.videos.create_index([("created_at", DESCENDING)])

    await db.follows.create_index(
        [("follower_id", ASCENDING), ("following_id", ASCENDING)],
        unique=True,
    )

    await db.likes.create_index(
        [("user_id", ASCENDING), ("video_id", ASCENDING)],
        unique=True,
    )

    await db.recommendation_feedback.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    await db.recommendation_feedback.create_index([("video_id", ASCENDING), ("created_at", DESCENDING)])
    await db.recommendation_feedback.create_index([("action", ASCENDING), ("created_at", DESCENDING)])


async def close_mongo_connection() -> None:
    global client, _db
    if client is not None:
        client.close()
        client = None
    _db = None
