import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings


@pytest.fixture
def offline_client(monkeypatch):
    monkeypatch.setenv("OFFLINE_MODE", "true")
    with TestClient(app) as client:
        yield client


def test_offline_diagnostics(offline_client: TestClient):
    """Verifies field diagnostics execute deterministically offline with verified citations."""
    diag_res = offline_client.post(
        "/api/diagnose",
        data={"query_text": "PRV-992-B valve weeping hydraulic fluid under high pressure"}
    )
    assert diag_res.status_code == 200
    data = diag_res.json()

    assert data["detected_component"]["part_number"] == "PRV-992-B"
    assert data["safety_interlocks"]["required"] is True
    assert len(data["remediation_plan"]["steps"]) > 0
    assert len(data["citations"]) > 0

    # Ensure zero unverified citations
    for cite in data["citations"]:
        assert cite["verification_status"] == "verified", f"Citation {cite} was not verified"


def test_offline_chat_streaming(offline_client: TestClient):
    """Verifies chat streaming produces complete, grounded answers with valid citations offline."""
    # 1. Create a conversation
    conv_res = offline_client.post("/api/chat/conversations", json={"title": "Offline nacelle diagnostics"})
    assert conv_res.status_code == 200
    conv_id = conv_res.json()["id"]

    # 2. Test stream for valve inquiry
    stream_res = offline_client.post(
        f"/api/chat/conversations/{conv_id}/stream",
        json={"message": "What is the torque spec for the PRV valve seal bolts?"}
    )
    assert stream_res.status_code == 200
    content = stream_res.text

    assert "event: status" in content
    assert "event: token" in content
    assert "event: citation" in content
    assert "event: done" in content

    # Reconstruct streamed text from token events
    import json
    tokens = [
        json.loads(line[6:])["text"]
        for line in content.splitlines()
        if line.startswith("data: ") and '"text"' in line
    ]
    reconstructed = "".join(tokens)
    assert "35 Nm" in reconstructed or ("35" in reconstructed and "Nm" in reconstructed)

    # 3. Clean up
    offline_client.delete(f"/api/chat/conversations/{conv_id}")
