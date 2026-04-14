from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from app.config.rate_limit import limiter
from app.controllers.video_controller import get_feed, toggle_like, upload_video
from app.middleware.auth import get_current_user
from app.schemas.video import LikeRequest


router = APIRouter(prefix="/video", tags=["video"])


@router.post("/upload")
@limiter.limit("20/minute")
async def upload(
    request: Request,
    caption: str = Form(default=""),
    tags: str = Form(default=""),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    normalized_tags = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
    video = await upload_video(current_user, caption, normalized_tags, file)
    return {"video": video}


@router.get("/feed")
@limiter.limit("60/minute")
async def feed(
    request: Request,
    mode: str = Query(default="latest", pattern="^(latest|following)$"),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    return {"videos": await get_feed(current_user, mode=mode, limit=limit)}


@router.post("/like")
@limiter.limit("60/minute")
async def like(request: Request, payload: LikeRequest, current_user: dict = Depends(get_current_user)):
    return await toggle_like(current_user, payload.video_id)
