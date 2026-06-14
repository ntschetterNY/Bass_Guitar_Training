"""Application configuration.

Values are read from environment variables (with sensible local defaults), so the
same image runs locally and on TrueNAS/Dockge with only env/volume changes.
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BGT_", env_file=".env", extra="ignore")

    # Directory for persistent data (SQLite DB). In the container this is bind-mounted
    # to a TrueNAS dataset (see compose.yaml -> /app/data).
    data_dir: Path = Path("data")

    # Directory holding the built React app (populated at image build time).
    static_dir: Path = Path("static")

    # App metadata.
    app_name: str = "Bass & Guitar Training"

    @property
    def database_url(self) -> str:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{(self.data_dir / 'app.db').as_posix()}"


settings = Settings()
