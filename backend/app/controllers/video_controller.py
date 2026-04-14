from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from app.config.database import get_database
from app.models.documents import video_document
from app.services.media_service import upload_video_to_cloudinary
from app.utils.serializers import serialize_mongo


async def upload_video(current_user: dict, caption: str, tags: list[str], file: UploadFile) -> dict:
    db = get_database()

    video_url = await upload_video_to_cloudinary(file)
    video = video_document(
        {
            "user_id": current_user["id"],
            "video_url": video_url,
            "caption": caption,
            "tags": tags,
        }
    )

    insert_result = await db.videos.insert_one(video)
    inserted = await db.videos.find_one({"_id": insert_result.inserted_id})

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"activity_score": 2}, "$set": {"updated_at": datetime.utcnow()}},
    )

    return serialize_mongo(inserted)


async def get_feed(current_user: dict, mode: str = "latest", limit: int = 20) -> list[dict]:
    db = get_database()

    query = {}
    if mode == "following":
        cursor = db.follows.find({"follower_id": current_user["id"]}, {"following_id": 1})
        followed_ids = [doc["following_id"] async for doc in cursor]
        if not followed_ids:
            return []
        query = {"user_id": {"$in": followed_ids}}

    feed_cursor = db.videos.find(query).sort("created_at", -1).limit(limit)
    return [serialize_mongo(doc) async for doc in feed_cursor]


async def toggle_like(current_user: dict, video_id: str) -> dict:
    db = get_database()

    if not ObjectId.is_valid(video_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video id")

    video = await db.videos.find_one({"_id": ObjectId(video_id)})
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    existing = await db.likes.find_one({"user_id": current_user["id"], "video_id": video_id})

    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        await db.videos.update_one(
            {"_id": ObjectId(video_id)},
            {"$inc": {"likes_count": -1}, "$set": {"updated_at": datetime.utcnow()}},
        )
        return {"status": "unliked", "video_id": video_id}

    await db.likes.insert_one(
        {
            "user_id": current_user["id"],
            "video_id": video_id,
            "created_at": datetime.utcnow(),
        }
    )
    await db.videos.update_one(
        {"_id": ObjectId(video_id)},
        {"$inc": {"likes_count": 1}, "$set": {"updated_at": datetime.utcnow()}},
    )
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"activity_score": 1}, "$set": {"updated_at": datetime.utcnow()}},
    )

    return {"status": "liked", "video_id": video_id}
