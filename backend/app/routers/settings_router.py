import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Settings & Platform Operations"])

# In-memory store for demo / session persistence
_settings_store = {
    "model": "gemma-4-26b-a4b-it",
    "temperature": 0.2,
    "streaming": True,
    "theme": "obsidian",
    "safety_interlock_standard": "OSHA 1910.147",
    "ast_strict_mode": True,
    "max_tokens": 4096,
}

_keys_store = {
    "google_api_key_set": True,
    "vertex_ai_credentials_set": False,
    "local_gemma_endpoint": "http://localhost:8000/v1",
}

_usage_store = {
    "prompt_tokens": 142850,
    "completion_tokens": 38420,
    "total_tokens": 181270,
    "remaining_credits": 818730,
    "plan_limit": 1000000,
    "reset_at": "2026-12-01T00:00:00Z",
}


class SettingsUpdate(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = None
    streaming: Optional[bool] = None
    theme: Optional[str] = None
    safety_interlock_standard: Optional[str] = None
    ast_strict_mode: Optional[bool] = None
    max_tokens: Optional[int] = None


class KeysUpdate(BaseModel):
    google_api_key: Optional[str] = None
    local_gemma_endpoint: Optional[str] = None


@router.get("/settings")
async def get_settings() -> Dict[str, Any]:
    """Retrieves active MECH-G workspace and model settings."""
    return _settings_store


@router.put("/settings")
async def update_settings(payload: SettingsUpdate) -> Dict[str, Any]:
    """Updates MECH-G workspace parameters."""
    data = payload.model_dump(exclude_unset=True)
    _settings_store.update(data)
    logger.info("Updated workspace settings: %s", data)
    return {"status": "success", "settings": _settings_store}


@router.get("/usage")
async def get_usage() -> Dict[str, Any]:
    """Retrieves token and compute credit usage for the workspace."""
    return _usage_store


@router.get("/keys")
async def get_keys() -> Dict[str, Any]:
    """Retrieves masked status of third-party API credentials."""
    return _keys_store


@router.put("/keys")
async def update_keys(payload: KeysUpdate) -> Dict[str, Any]:
    """Updates API key credentials."""
    if payload.google_api_key:
        _keys_store["google_api_key_set"] = True
    if payload.local_gemma_endpoint:
        _keys_store["local_gemma_endpoint"] = payload.local_gemma_endpoint
    return {"status": "success", "message": "Credentials updated successfully."}
