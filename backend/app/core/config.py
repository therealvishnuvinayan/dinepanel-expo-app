from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DinePanel API"
    environment: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/dinepanel"
    jwt_secret: str = Field(
        default="development-only-change-me-at-least-32-bytes",
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    dev_otp: str = Field(default="123456", min_length=6, max_length=6)
    cors_origins: str = "http://localhost:8081,http://localhost:19006,http://localhost:5173"
    claim_base_url: str = "dinepanel://claim"
    claim_token_expire_minutes: int = Field(default=10, ge=1, le=60)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
