from fastapi import APIRouter, Depends, Query, Request

from app.config.rate_limit import limiter
from app.middleware.auth import get_current_user
from app.schemas.recommendation import RecommendationFeedbackRequest, RecommendationFeedbackResponse
from app.services.recommendation_service import get_recommendation_service


router = APIRouter(prefix="/recommend", tags=["recommendations"])


@router.get("/feed")
@limiter.limit("30/minute")
async def recommend_feed(
    request: Request,
    limit: int = Query(default=20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    service = get_recommendation_service()
    videos = await service.recommend_feed(current_user, limit=limit)
    return {"videos": videos}


@router.get("/users")
@limiter.limit("30/minute")
async def recommend_users(
    request: Request,
    limit: int = Query(default=12, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    service = get_recommendation_service()
    users = await service.recommend_users(current_user, limit=limit)
    return {"users": users}


@router.post("/feedback")
@limiter.limit("120/minute")
async def feedback(
    request: Request,
    payload: RecommendationFeedbackRequest,
    current_user: dict = Depends(get_current_user),
):
    service = get_recommendation_service()
    return await service.register_feedback(current_user, payload.model_dump())
