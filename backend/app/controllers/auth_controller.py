from fastapi import HTTPException, status
from app.config.database import get_database
from app.models.documents import user_document
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import create_access_token, hash_password, verify_password
from app.utils.serializers import serialize_mongo


async def register_user(payload: RegisterRequest) -> dict:
    db = get_database()

    existing_email = await db.users.find_one({"email": payload.email.lower()})
    if existing_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    existing_username = await db.users.find_one({"username": payload.username.lower()})
    if existing_username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already in use")

    new_user = user_document(
        {
            "name": payload.name.strip(),
            "username": payload.username.lower(),
            "email": payload.email.lower(),
            "phone": payload.phone,
            "password_hash": hash_password(payload.password),
            "bio": payload.bio or "",
            "skills": payload.skills,
            "level": payload.level,
        }
    )

    result = await db.users.insert_one(new_user)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    user = serialize_mongo(created_user)
    user.pop("password_hash", None)

    token = create_access_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": user}


async def login_user(payload: LoginRequest) -> dict:
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_data = serialize_mongo(user)
    user_data.pop("password_hash", None)
    token = create_access_token(user_data["id"])

    return {"access_token": token, "token_type": "bearer", "user": user_data}
