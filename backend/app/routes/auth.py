from fastapi import APIRouter, Request
from app.controllers.auth_controller import login_user, register_user
from app.config.rate_limit import limiter
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
async def register(request: Request, payload: RegisterRequest):
    return await register_user(payload)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("20/minute")
async def login(request: Request, payload: LoginRequest):
    return await login_user(payload)
