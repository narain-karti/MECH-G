from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from app.database.notebook_repository import IssueRepository, NotebookRepository
from app.database.repository import ConversationRepository, DocumentRepository, MessageRepository
from app.models.notebook_models import (
    IssueCreate,
    IssueResponse,
    IssueUpdate,
    MissionReport,
    NotebookCreate,
    NotebookResponse,
    NotebookUpdate,
)

router = APIRouter(prefix="/api/notebooks", tags=["Equipment Notebooks"])


def notebook_response(raw: dict) -> NotebookResponse:
    return NotebookResponse(**raw)


@router.get("", response_model=List[NotebookResponse])
async def list_notebooks():
    return [notebook_response(item) for item in NotebookRepository.list_all()]


@router.post("", response_model=NotebookResponse, status_code=201)
async def create_notebook(request: NotebookCreate):
    notebook = NotebookRepository.create(
        title=request.title,
        description=request.description,
        model=request.model,
        category=request.category,
        location=request.location,
        status=request.status,
    )
    conversation = ConversationRepository.create(f"{notebook['title']} — Field Consultation", [], notebook_id=notebook["id"])
    notebook = NotebookRepository.get(notebook["id"])
    assert notebook is not None
    notebook["default_conversation_id"] = conversation["id"]
    return notebook_response(notebook)


@router.get("/{notebook_id}", response_model=NotebookResponse)
async def get_notebook(notebook_id: str):
    notebook = NotebookRepository.get(notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    conversations = ConversationRepository.list_for_notebook(notebook_id)
    notebook["default_conversation_id"] = conversations[0]["id"] if conversations else None
    return notebook_response(notebook)


@router.patch("/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(notebook_id: str, request: NotebookUpdate):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    NotebookRepository.update(
        notebook_id=notebook_id,
        title=request.title,
        description=request.description,
        model=request.model,
        category=request.category,
        location=request.location,
        status=request.status,
    )
    return notebook_response(NotebookRepository.get(notebook_id) or {})


@router.delete("/{notebook_id}")
async def delete_notebook(notebook_id: str):
    if not NotebookRepository.delete(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    return {"id": notebook_id, "status": "deleted"}


@router.get("/{notebook_id}/documents")
async def list_notebook_documents(notebook_id: str):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    return DocumentRepository.list_for_notebook(notebook_id)


@router.post("/{notebook_id}/documents/{document_id}")
async def link_document(notebook_id: str, document_id: str):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    NotebookRepository.link_document(notebook_id, document_id)
    return {"notebook_id": notebook_id, "document_id": document_id, "status": "linked"}


@router.delete("/{notebook_id}/documents/{document_id}")
async def unlink_document(notebook_id: str, document_id: str):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    NotebookRepository.unlink_document(notebook_id, document_id)
    return {"notebook_id": notebook_id, "document_id": document_id, "status": "unlinked"}


@router.get("/{notebook_id}/issues", response_model=List[IssueResponse])
async def list_issues(notebook_id: str):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    return [IssueResponse(**issue) for issue in IssueRepository.list_for_notebook(notebook_id)]


@router.post("/{notebook_id}/issues", response_model=IssueResponse, status_code=201)
async def create_issue(notebook_id: str, request: IssueCreate):
    if not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    issue = IssueRepository.create(
        notebook_id=notebook_id,
        title=request.title,
        description=request.description,
        severity=request.severity,
        status=request.status,
        component=request.component,
        part_number=request.part_number,
        defect=request.defect,
        verified_torque=request.verified_torque,
        technician_id=request.technician_id,
        citation_anchor=request.citation_anchor,
    )
    return IssueResponse(**issue)


@router.patch("/{notebook_id}/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(notebook_id: str, issue_id: str, request: IssueUpdate):
    issue = IssueRepository.get(issue_id)
    if not issue or issue["notebook_id"] != notebook_id:
        raise HTTPException(status_code=404, detail="Issue not found")
    IssueRepository.update(issue_id, **request.model_dump(exclude_none=True))
    return IssueResponse(**(IssueRepository.get(issue_id) or {}))


@router.delete("/{notebook_id}/issues/{issue_id}")
async def delete_issue(notebook_id: str, issue_id: str):
    issue = IssueRepository.get(issue_id)
    if not issue or issue["notebook_id"] != notebook_id:
        raise HTTPException(status_code=404, detail="Issue not found")
    IssueRepository.delete(issue_id)
    return {"id": issue_id, "status": "deleted"}


@router.get("/{notebook_id}/report", response_model=MissionReport)
async def mission_report(notebook_id: str):
    notebook = NotebookRepository.get(notebook_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Equipment notebook not found")
    conversations = ConversationRepository.list_for_notebook(notebook_id)
    messages = []
    for conversation in conversations:
        messages.extend(MessageRepository.list_by_conversation(conversation["id"]))
    return MissionReport(
        notebook=notebook_response(notebook),
        generated_at=datetime.now(timezone.utc).isoformat(),
        sources=DocumentRepository.list_for_notebook(notebook_id),
        issues=[IssueResponse(**issue) for issue in IssueRepository.list_for_notebook(notebook_id)],
        messages=messages,
    )
