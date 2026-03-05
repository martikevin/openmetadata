"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import assets, requests

# Create tables on startup (use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OpenMetadata – Request Access Workflow",
    version="0.1.0",
    description="Sidecar service that adds a data-access request workflow to OpenMetadata.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests.router)
app.include_router(assets.router)


@app.get("/health")
def health():
    return {"status": "ok"}
