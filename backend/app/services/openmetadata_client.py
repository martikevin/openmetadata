"""Thin HTTP wrapper around the OpenMetadata REST API.

Only the endpoints we actually need are exposed.  When OM releases a new API
version the *only* file that needs touching is this one.
"""

from __future__ import annotations

import httpx

from ..config import settings

_HEADERS: dict[str, str] = {}
if settings.openmetadata_token:
    _HEADERS["Authorization"] = f"Bearer {settings.openmetadata_token}"

_BASE = settings.openmetadata_url.rstrip("/")


async def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=_BASE, headers=_HEADERS, timeout=15)


async def search_entities(query: str, entity_type: str | None = None, limit: int = 20):
    """Use OM's /search/query endpoint."""
    params: dict = {"q": query, "size": limit, "from": 0}
    if entity_type:
        params["index"] = f"{entity_type}_search_index"
    async with await _client() as c:
        r = await c.get("/v1/search/query", params=params)
        r.raise_for_status()
        return r.json()


async def get_entity(entity_type: str, fqn: str):
    """Fetch a single entity by FQN, including owner info."""
    async with await _client() as c:
        r = await c.get(
            f"/v1/{entity_type}s/name/{fqn}",
            params={"fields": "owner,tags"},
        )
        r.raise_for_status()
        return r.json()


async def get_entity_by_id(entity_type: str, entity_id: str):
    """Fetch a single entity by UUID."""
    async with await _client() as c:
        r = await c.get(
            f"/v1/{entity_type}s/{entity_id}",
            params={"fields": "owner,tags"},
        )
        r.raise_for_status()
        return r.json()


async def list_entities(entity_type: str, limit: int = 50):
    """List entities of a given type."""
    async with await _client() as c:
        r = await c.get(f"/v1/{entity_type}s", params={"limit": limit})
        r.raise_for_status()
        return r.json()
