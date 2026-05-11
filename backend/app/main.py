import logging
import sys
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config.database import close_mongo_connection, connect_to_mongo, get_database
from app.config.indexes import create_indexes
from app.config.rate_limit import limiter
from app.config.settings import get_settings
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.posts import router as posts_router
from app.routes.career import router as career_router
from app.routes.realtime import router as realtime_router
from app.routes.ai import router as ai_router
from app.routes.community import router as community_router
from app.routes.discover import router as discover_router
from app.routes.recommendations import router as recommendations_router
from app.routes.users import router as users_router
from app.services.ai_service import initialize_ai_data
from app.services.recommendation_service import warm_recommendation_engine
from app.utils.logging import setup_logging

try:
    from prometheus_fastapi_instrumentator import Instrumentator
except ImportError:  # pragma: no cover - optional observability dependency
    Instrumentator = None

try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
except ImportError:  # pragma: no cover - optional observability dependency
    FastAPIInstrumentor = None

# Structured Logging Configuration
setup_logging()
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting HustleHub API v%s", settings.app_version)
    await connect_to_mongo()
    logger.info("Connected to MongoDB")
    await create_indexes()
    
    # Initialize Redis Cache
    redis = aioredis.from_url(settings.redis_url, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    logger.info("Redis Cache initialized")
    
    await warm_recommendation_engine()
    logger.info("Recommendation engine warmed up")
    await initialize_ai_data()
    logger.info("AI Service initialized (Vector DB & Skill Graph)")
    yield
    await close_mongo_connection()
    logger.info("Disconnected from MongoDB")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-ready backend for HustleHub social app",
    lifespan=lifespan,
)

if Instrumentator is not None:
    # Instrument the app for Prometheus metrics when the package is installed.
    Instrumentator().instrument(app).expose(app)
else:
    logger.warning("prometheus-fastapi-instrumentator is not installed; Prometheus metrics are disabled")

if FastAPIInstrumentor is not None:
    # Instrument the app for OpenTelemetry distributed tracing when available.
    FastAPIInstrumentor.instrument_app(app)
else:
    logger.warning("opentelemetry-instrumentation-fastapi is not installed; tracing is disabled")

# Request Timing and Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    # Use 'extra' for structured data if the formatter supports it
    logger.info(
        "Request processed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": duration,
        }
    )
    return response

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
app.include_router(admin_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(posts_router, prefix=settings.api_prefix)
app.include_router(career_router, prefix=settings.api_prefix)
app.include_router(realtime_router, prefix=settings.api_prefix)
app.include_router(community_router, prefix=settings.api_prefix)
app.include_router(discover_router, prefix=settings.api_prefix)
app.include_router(recommendations_router, prefix=settings.api_prefix)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        error = str(detail.get("error") or "Request Error")
        message = str(detail.get("message") or detail.get("detail") or error)
        content = {"error": error, "message": message}
    else:
        content = {"error": "Request Error", "message": str(detail)}

    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Failed",
            "message": "Validation failed",
            "errors": jsonable_encoder(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "message": "An unexpected error occurred"})


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
