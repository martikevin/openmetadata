"""Central configuration – all tunables come from env vars."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenMetadata connection
    openmetadata_url: str = "http://localhost:8585/api"
    openmetadata_token: str = ""

    # Own database
    database_url: str = "sqlite:///./request_access.db"

    # CORS – allow the React dev server
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
