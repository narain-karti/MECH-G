import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends

from app.models.diagnostic_models import (
    DiagnosticResponse,
    SafetyAckRequest,
    SafetyAckResponse
)
from app.services.diagnostic_service import DiagnosticService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/diagnose", tags=["Field Diagnostics"])

_diagnostic_service: DiagnosticService = None


def set_diagnostic_service(service: DiagnosticService):
    global _diagnostic_service
    _diagnostic_service = service


def get_diagnostic_service() -> DiagnosticService:
    if _diagnostic_service is None:
        raise HTTPException(status_code=503, detail="Diagnostic service is not initialized.")
    return _diagnostic_service


@router.post("", response_model=DiagnosticResponse)
async def run_hardware_diagnostic(
    image: Optional[UploadFile] = File(None),
    query_text: Optional[str] = Form(None),
    service: DiagnosticService = Depends(get_diagnostic_service)
):
    """
    Primary field diagnostic endpoint.
    Upload a picture of faulty physical hardware, error codes, or submit text notes.
    Gemma vision identifies the part and defect, traverses the local OKF graph,
    and returns a safety-gated remediation sequence with verifiable citations.
    """
    image_bytes: Optional[bytes] = None
    image_mime: str = "image/jpeg"

    if image:
        image_bytes = await image.read()
        image_mime = image.content_type or "image/jpeg"

    if not image_bytes and not query_text:
        raise HTTPException(status_code=400, detail="Either an image or query_text must be provided.")

    try:
        response = await service.run_diagnostic(
            image_bytes=image_bytes,
            image_mime=image_mime,
            query_text=query_text
        )
        return response
    except Exception as e:
        logger.error("Diagnostic execution error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Diagnostic error: {str(e)}")


@router.post("/{diagnostic_id}/safety-ack", response_model=SafetyAckResponse)
async def acknowledge_safety_gate(
    diagnostic_id: str,
    req: SafetyAckRequest,
    service: DiagnosticService = Depends(get_diagnostic_service)
):
    """
    Technician Lockout/Tagout (LOTO) sign-off endpoint.
    Unlocks physical repair sequences once all required safety items are confirmed.
    """
    if req.diagnostic_id != diagnostic_id:
        raise HTTPException(status_code=400, detail="Mismatched diagnostic ID")

    try:
        return service.acknowledge_safety(req)
    except KeyError:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")


@router.get("/{diagnostic_id}", response_model=DiagnosticResponse)
async def get_diagnostic_session(
    diagnostic_id: str,
    service: DiagnosticService = Depends(get_diagnostic_service)
):
    """Retrieves an existing diagnostic session and its verified state."""
    session = service.active_sessions.get(diagnostic_id)
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")
    return session


@router.post("/{diagnostic_id}/export")
async def export_work_order(
    diagnostic_id: str,
    service: DiagnosticService = Depends(get_diagnostic_service)
):
    """
    Exports structured field service work order with verified citations,
    OSHA 1910.147 LOTO permit records, and torque calibrations.
    """
    from datetime import datetime, timezone
    session = service.active_sessions.get(diagnostic_id)
    if not session:
        raise HTTPException(status_code=404, detail="Diagnostic session not found")

    return {
        "work_order_id": f"WO-2026-MECHG-{diagnostic_id[:8].upper()}",
        "diagnostic_id": diagnostic_id,
        "asset": session.detected_component.name,
        "defect": session.detected_component.observed_defect,
        "confidence": session.detected_component.confidence,
        "part_number": session.detected_component.part_number,
        "safety_clearance": (
            f"SIGNED ({session.safety_interlocks.acknowledged_by})"
            if session.safety_interlocks.acknowledged
            else "UNVERIFIED"
        ),
        "safety_acknowledged_at": session.safety_interlocks.acknowledged_at,
        "remediation_plan": session.remediation_plan.model_dump() if session.remediation_plan else None,
        "citations": [c.model_dump() for c in session.citations],
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "status": "APPROVED_FOR_EXECUTION" if session.safety_interlocks.acknowledged else "SAFETY_HELD"
    }


