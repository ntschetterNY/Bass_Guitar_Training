"""FastAPI entrypoint.

Serves the JSON API under /api and the built React SPA for everything else
(single-container deployment — no CORS, one image to ship to Dockge).
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import health, profiles, progress
from .config import settings
from .db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# --- API ---------------------------------------------------------------------
api = APIRouter(prefix="/api")
api.include_router(health.router)
api.include_router(profiles.router)
api.include_router(progress.router)
app.include_router(api)


# --- Static SPA --------------------------------------------------------------
# The React build is copied to settings.static_dir at image build time. During
# local backend-only dev the directory may be absent, so guard for it.
_static_dir = settings.static_dir
_index = _static_dir / "index.html"

if (_static_dir / "assets").is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=_static_dir / "assets"),
        name="assets",
    )


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    """Serve real files when they exist, otherwise index.html for client routes.

    API 404s are handled above (the /api router is matched first), so anything
    reaching here is a frontend route.
    """
    # Unknown API paths should be a JSON 404, not the HTML shell.
    if full_path.startswith("api/") or full_path == "api":
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    if not _index.exists():
        return JSONResponse(
            status_code=503,
            content={"detail": "Frontend not built. Run the Vite build."},
        )
    candidate = (_static_dir / full_path).resolve()
    # Prevent path traversal and only serve files inside the static dir.
    if (
        full_path
        and _static_dir.resolve() in candidate.parents
        and candidate.is_file()
    ):
        return FileResponse(candidate)
    return FileResponse(_index)
