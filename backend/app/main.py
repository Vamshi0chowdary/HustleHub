from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config.database import close_mongo_connection, connect_to_mongo, get_database
from app.config.rate_limit import limiter
from app.config.settings import get_settings
from app.routes.auth import router as auth_router
from app.routes.discover import router as discover_router
from app.routes.recommendations import router as recommendations_router
from app.routes.users import router as users_router
from app.routes.videos import router as videos_router
from app.services.recommendation_service import warm_recommendation_engine

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    await warm_recommendation_engine()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-ready backend for HustleHub social app",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
is_production = settings.app_env.strip().lower() == "production"
allow_all_origins = "*" in origins

if is_production and allow_all_origins:
    raise RuntimeError("Wildcard CORS is not allowed when APP_ENV=production")

app.add_middleware(
    CORSMiddleware,
    # Browsers reject credentialed CORS responses with wildcard origins.
    allow_origins=["*"] if allow_all_origins else origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(videos_router, prefix=settings.api_prefix)
app.include_router(discover_router, prefix=settings.api_prefix)
app.include_router(recommendations_router, prefix=settings.api_prefix)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/")
async def root() -> dict:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> dict:
    db = get_database()
    await db.command("ping")
    return {
        "status": "healthy",
        "checks": {
            "database": "ok",
            "recommendation": "initialized",
        },
    }