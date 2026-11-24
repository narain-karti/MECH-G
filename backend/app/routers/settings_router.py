import json
import logging
import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter

from app.config import settings
from app.database.connection import get_db_connection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Settings & Platform Operations"])

DEFAULT_SETTINGS = {
    "model": settings.gemma_model,
    "temperature": 0.2,
    "streaming": True,
    "theme": "obsidian",
    "safety_interlock_standard": "OSHA 1910.147",
    "ast_strict_mode": True,
    "max_tokens": 4096,
}


def _load_json(key: str, default: Dict[str, Any]) -> Dict[str, Any]:
    with get_db_connection() as conn:
        row = conn.execute("SELECT value_json FROM app_settings WHERE key = ?", (key,)).fetchone()
    if not row:
        return dict(default)
    return {**default, **json.loads(row["value_json"])}


def _save_json(key: str, value: Dict[str, Any]) -> None:
    with get_db_connection() as conn:
        conn.execute(
            """INSERT INTO app_settings (key, value_json, updated_at)
               VALUES (?, ?, datetime('now'))
               ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')""",
            (key, json.dumps(value)),
        )


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
    return _load_json("workspace_settings", DEFAULT_SETTINGS)


@router.put("/settings")
async def update_settings(payload: SettingsUpdate) -> Dict[str, Any]:
    """Updates MECH-G workspace parameters."""
    current = _load_json("workspace_settings", DEFAULT_SETTINGS)
    data = payload.model_dump(exclude_unset=True)
    current.update(data)
    _save_json("workspace_settings", current)
    if "model" in data and data["model"]:
        settings.gemma_model = data["model"]
    logger.info("Updated workspace settings: %s", data)
    return {"status": "success", "settings": current}


@router.get("/usage")
async def get_usage() -> Dict[str, Any]:
    """Retrieves real workspace activity counts from SQLite."""
    with get_db_connection() as conn:
        msg_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
        doc_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        diag_count = conn.execute("SELECT COUNT(*) FROM diagnostic_sessions").fetchone()[0]
    return {
        "messages_count": msg_count,
        "documents_count": doc_count,
        "diagnostics_count": diag_count,
    }


@router.get("/keys")
async def get_keys() -> Dict[str, Any]:
    """Retrieves masked status of third-party API credentials."""
    saved = _load_json("api_keys", {"local_gemma_endpoint": ""})
    return {
        "google_api_key_set": bool(settings.gemma_api_key or os.environ.get("GEMMA_API_KEY")),
        "vertex_ai_credentials_set": False,
        "local_gemma_endpoint": saved.get("local_gemma_endpoint", ""),
    }


@router.put("/keys")
async def update_keys(payload: KeysUpdate) -> Dict[str, Any]:
    """Updates API key credentials."""
    saved = _load_json("api_keys", {"local_gemma_endpoint": ""})
    if payload.google_api_key:
        settings.gemma_api_key = payload.google_api_key
        os.environ["GEMMA_API_KEY"] = payload.google_api_key
    if payload.local_gemma_endpoint is not None:
        saved["local_gemma_endpoint"] = payload.local_gemma_endpoint
        _save_json("api_keys", saved)
    return {"status": "success", "message": "Credentials updated successfully."}
