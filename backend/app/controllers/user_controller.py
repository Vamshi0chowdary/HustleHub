from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import get_database
from app.utils.serializers import serialize_mongo


async def get_user_profile(user_id: str) -> dict:
    db = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    data = serialize_mongo(user)
    data.pop("password_hash", None)
    return data


async def update_user_profile(current_user: dict, updates: dict) -> dict:
    db = get_database()
    update_data = {key: value for key, value in updates.items() if value is not None}

    if not update_data:
        return current_user

    update_data["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": update_data})

    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    serialized = serialize_mongo(user)
    serialized.pop("password_hash", None)
    return serialized


async def get_user_suggestions(current_user: dict, limit: int = 10) -> list[dict]:
    db = get_database()

    followed_cursor = db.follows.find({"follower_id": current_user["id"]}, {"following_id": 1})
    followed_ids = [doc["following_id"] async for doc in followed_cursor]

    pipeline = [
        {
            "$match": {
                "_id": {"$ne": ObjectId(current_user["id"])},
            }
        },
        {
            "$addFields": {
                "shared_skill_count": {
                    "$size": {"$setIntersection": ["$skills", current_user.get("skills", [])]}
                }
            }
        },
        {"$sort": {"shared_skill_count": -1, "activity_score": -1, "created_at": -1}},
    ]

    cursor = db.users.aggregate(pipeline)
    suggestions = []
    async for doc in cursor:
        sid = str(doc["_id"])
        if sid in followed_ids:
            continue
        item = serialize_mongo(doc)
        item.pop("password_hash", None)
        suggestions.append(item)
        if len(suggestions) >= limit:
            break

    return suggestions


async def get_study_partners(current_user: dict, limit: int = 10) -> list[dict]:
    db = get_database()

    pipeline = [
        {
            "$match": {
                "_id": {"$ne": ObjectId(current_user["id"])},
                "level": current_user.get("level", "beginner"),
            }
        },
        {
            "$addFields": {
                "shared_skill_count": {
                    "$size": {"$setIntersection": ["$skills", current_user.get("skills", [])]}
                }
            }
        },
        {"$match": {"shared_skill_count": {"$gte": 1}}},
        {"$sort": {"shared_skill_count": -1, "activity_score": -1, "created_at": -1}},
        {"$limit": limit},
    ]

    cursor = db.users.aggregate(pipeline)
    partners = []
    async for doc in cursor:
        item = serialize_mongo(doc)
        item.pop("password_hash", None)
        partners.append(item)

    return partners


async def follow_user(current_user: dict, target_user_id: str) -> dict:
    db = get_database()

    if not ObjectId.is_valid(target_user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid target user id")

    if target_user_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

    target = await db.users.find_one({"_id": ObjectId(target_user_id)})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

    existing = await db.follows.find_one(
        {"follower_id": current_user["id"], "following_id": target_user_id}
    )

    if existing:
        await db.follows.delete_one({"_id": existing["_id"]})
        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$inc": {"following_count": -1}, "$set": {"updated_at": datetime.utcnow()}},
        )
        await db.users.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$inc": {"followers_count": -1}, "$set": {"updated_at": datetime.utcnow()}},
        )
        return {"status": "unfollowed", "target_user_id": target_user_id}

    await db.follows.insert_one(
        {
            "follower_id": current_user["id"],
            "following_id": target_user_id,
            "created_at": datetime.utcnow(),
        }
    )
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"following_count": 1}, "$set": {"updated_at": datetime.utcnow()}},
    )
    await db.users.update_one(
        {"_id": ObjectId(target_user_id)},
        {"$inc": {"followers_count": 1}, "$set": {"updated_at": datetime.utcnow()}},
    )

    return {"status": "followed", "target_user_id": target_user_id}
