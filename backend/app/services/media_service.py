from fastapi import HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
import cloudinary
import cloudinary.uploader
from app.config.settings import get_settings


_configured = False


def configure_cloudinary() -> None:
    global _configured
    if _configured:
        return

    settings = get_settings()
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        return

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    _configured = True


async def upload_video_to_cloudinary(file: UploadFile) -> str:
    configure_cloudinary()

    if not _configured:
        raise HTTPException(status_code=500, detail="Cloudinary is not configured")

    if file.content_type not in {"video/mp4", "video/quicktime", "video/webm"}:
        raise HTTPException(status_code=400, detail="Unsupported video format")

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video size exceeds 100MB limit")

    result = await run_in_threadpool(
        cloudinary.uploader.upload,
        content,
        resource_type="video",
        folder="hustlehub/videos",
    )
    return result["secure_url"]
