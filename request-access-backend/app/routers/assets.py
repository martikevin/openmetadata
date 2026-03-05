"""Proxy / search endpoints that talk to OpenMetadata."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..services import openmetadata_client as om

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    entity_type: str | None = Query(None, description="table, topic, dashboard, …"),
    limit: int = Query(20, ge=1, le=100),
):
    """Search OpenMetadata assets."""
    return await om.search_entities(q, entity_type=entity_type, limit=limit)


@router.get("/{entity_type}/{fqn:path}")
async def get_asset(entity_type: str, fqn: str):
    """Get a single asset from OpenMetadata by type + FQN."""
    return await om.get_entity(entity_type, fqn)
