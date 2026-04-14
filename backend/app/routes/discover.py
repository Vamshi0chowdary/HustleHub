from fastapi import APIRouter, Depends, Query
from app.controllers.user_controller import get_study_partners, get_user_suggestions
from app.controllers.video_controller import get_feed
from app.middleware.auth import get_current_user


router = APIRouter(prefix="/discover", tags=["discover"])


@router.get("/users")
async def discover_users(
    limit: int = Query(default=12, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    users = await get_user_suggestions(current_user, limit=limit)
    return {"users": users}


@router.get("/videos")
async def discover_videos(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    videos = await get_feed(current_user, mode="latest", limit=limit)
    return {"videos": videos}


@router.get("/study-partners")
async def discover_study_partners(
    limit: int = Query(default=10, ge=1, le=30),
    current_user: dict = Depends(get_current_user),
):
    partners = await get_study_partners(current_user, limit=limit)
    return {"users": partners}
