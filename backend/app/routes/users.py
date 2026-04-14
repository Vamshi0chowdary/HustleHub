from fastapi import APIRouter, Depends, Query, Request
from app.controllers.user_controller import (
    follow_user,
    get_user_profile,
    get_user_suggestions,
    update_user_profile,
)
from app.config.rate_limit import limiter
from app.middleware.auth import get_current_user
from app.schemas.user import FollowRequest, UpdateProfileRequest


router = APIRouter(prefix="/user", tags=["user"])


@router.patch("/me")
@limiter.limit("30/minute")
async def update_profile(
    request: Request,
    payload: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    return await update_user_profile(current_user, payload.model_dump())


@router.get("/suggestions")
@limiter.limit("30/minute")
async def suggestions(
    request: Request,
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    return {"users": await get_user_suggestions(current_user, limit=limit)}


@router.post("/follow")
@limiter.limit("30/minute")
async def follow(request: Request, payload: FollowRequest, current_user: dict = Depends(get_current_user)):
    return await follow_user(current_user, payload.target_user_id)


@router.get("/{user_id}")
async def get_profile(user_id: str):
    return await get_user_profile(user_id)
