import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_equipment_notebooks_crud(client: TestClient):
    # 1. List notebooks (seeded ones should exist)
    res = client.get("/api/notebooks")
    assert res.status_code == 200
    notebooks = res.json()
    assert len(notebooks) >= 1

    # Verify Vestas notebook fields
    vestas = next((n for n in notebooks if n["id"] == "nb-vestas-v112"), notebooks[0])
    assert "title" in vestas
    assert "model" in vestas
    assert "category" in vestas
    assert "status" in vestas

    # 2. Create new equipment notebook
    create_payload = {
        "title": "Caterpillar 797F Mining Truck",
        "description": "Ultra-class haul truck with hydraulic hoist cylinders and mechanical powertrain.",
        "model": "797F-HD",
        "category": "Heavy Mining",
        "location": "Atacama Copper Mine",
        "status": "operational",
    }
    create_res = client.post("/api/notebooks", json=create_payload)
    assert create_res.status_code == 201
    created_nb = create_res.json()
    assert created_nb["title"] == create_payload["title"]
    assert created_nb["model"] == create_payload["model"]
    assert created_nb["category"] == create_payload["category"]
    nb_id = created_nb["id"]

    # 3. Get created notebook
    get_res = client.get(f"/api/notebooks/{nb_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == nb_id

    # 4. Create Issue under this notebook
    issue_payload = {
        "title": "Hoist Cylinder Bleed Screw O-Ring Weepage",
        "description": "Slow hydraulic seepage observed at bleed screw port under 180 bar pressure test.",
        "severity": "critical",
        "status": "open",
        "component": "Hydraulic Hoist Cylinder",
        "part_number": "CYL-797-H01",
        "defect": "O-ring thermal degradation",
        "verified_torque": "50 Nm",
        "technician_id": "TECH-4091-FIELD",
        "citation_anchor": "SEC-8.3",
    }
    issue_res = client.post(f"/api/notebooks/{nb_id}/issues", json=issue_payload)
    assert issue_res.status_code == 201
    issue = issue_res.json()
    assert issue["title"] == issue_payload["title"]
    assert issue["component"] == issue_payload["component"]
    assert issue["verified_torque"] == "50 Nm"
    issue_id = issue["id"]

    # 5. List issues for notebook
    list_issues_res = client.get(f"/api/notebooks/{nb_id}/issues")
    assert list_issues_res.status_code == 200
    issues = list_issues_res.json()
    assert len(issues) == 1
    assert issues[0]["status"] == "open"

    # 6. Update issue to fixed
    update_res = client.patch(
        f"/api/notebooks/{nb_id}/issues/{issue_id}",
        json={"status": "fixed", "technician_id": "TECH-4091-FIELD"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "fixed"
    assert update_res.json()["resolved_at"] is not None

    # 7. Delete issue
    del_issue_res = client.delete(f"/api/notebooks/{nb_id}/issues/{issue_id}")
    assert del_issue_res.status_code == 200

    # 8. Delete notebook
    del_nb_res = client.delete(f"/api/notebooks/{nb_id}")
    assert del_nb_res.status_code == 200
