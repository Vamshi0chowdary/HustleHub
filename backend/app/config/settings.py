from functools import lru_cache
from pathlib import Path

from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "HustleHub API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    mongodb_uri: str = "mongodb://127.0.0.1:27017/hustlehub"
    mongodb_db_name: str = "hustlehub"
    mongodb_server_selection_timeout_ms: int = 30000
    mongodb_connect_timeout_ms: int = 30000
    mongodb_socket_timeout_ms: int = 30000
    mongodb_heartbeat_frequency_ms: int = 10000
    mongodb_max_pool_size: int = 100
    mongodb_min_pool_size: int = 2
    mongodb_max_idle_time_ms: int = 45000
    mongodb_connect_retries: int = 8
    mongodb_retry_delay_seconds: float = 2.0
    cors_origins: str = "http://localhost:3000,http://localhost:19006,exp://localhost:8081"
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    recommendation_model_path: str = str(Path(__file__).resolve().parents[2] / "ml" / "artifacts" / "hybrid_recommender.pkl")
    federated_model_path: str = str(Path(__file__).resolve().parents[2] / "fl" / "artifacts" / "global_weights.pkl")
    recommendation_feed_cache_ttl_seconds: int = 20
    recommendation_users_cache_ttl_seconds: int = 30
    recommendation_candidate_multiplier: int = 20
    recommendation_max_candidates: int = 250
    federated_learning_rate: float = 0.1
    federated_privacy_noise_std: float = 0.01
    federated_clip_norm: float = 1.0

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str, info: ValidationInfo) -> str:
        secret = value.strip()
        app_env = str(info.data.get("app_env", "development")).strip().lower()
        if app_env == "production" and len(secret) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return secret

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("CORS_ORIGINS must include at least one origin")
        return ",".join(origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
