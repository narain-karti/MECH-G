from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NotebookCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    model: str = Field(default="", max_length=120)
    category: str = Field(default="General Machinery", max_length=120)
    location: str = Field(default="", max_length=120)
    status: str = Field(default="operational", pattern="^(operational|degraded|maintenance)$")


class NotebookUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    model: Optional[str] = Field(default=None, max_length=120)
    category: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)
    status: Optional[str] = Field(default=None, pattern="^(operational|degraded|maintenance)$")


class NotebookResponse(BaseModel):
    id: str
    title: str
    description: str = ""
    model: str = ""
    category: str = "General Machinery"
    location: str = ""
    status: str = "operational"
    default_conversation_id: Optional[str] = None
    source_count: int = 0
    issue_count: int = 0
    open_issue_count: int = 0
    created_at: str
    updated_at: str


class IssueCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=180)
    description: str = Field(default="", max_length=2000)
    severity: str = Field(default="medium", pattern="^(low|medium|high|critical|warning|advisory)$")
    status: str = Field(default="open", pattern="^(open|investigating|fixed|resolved)$")
    component: str = Field(default="", max_length=150)
    part_number: str = Field(default="", max_length=100)
    defect: str = Field(default="", max_length=300)
    verified_torque: str = Field(default="", max_length=100)
    technician_id: str = Field(default="", max_length=100)
    citation_anchor: str = Field(default="", max_length=100)


class IssueUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=180)
    description: Optional[str] = Field(default=None, max_length=2000)
    severity: Optional[str] = Field(default=None, pattern="^(low|medium|high|critical|warning|advisory)$")
    status: Optional[str] = Field(default=None, pattern="^(open|investigating|fixed|resolved)$")
    component: Optional[str] = Field(default=None, max_length=150)
    part_number: Optional[str] = Field(default=None, max_length=100)
    defect: Optional[str] = Field(default=None, max_length=300)
    verified_torque: Optional[str] = Field(default=None, max_length=100)
    technician_id: Optional[str] = Field(default=None, max_length=100)
    citation_anchor: Optional[str] = Field(default=None, max_length=100)


class IssueResponse(BaseModel):
    id: str
    notebook_id: str
    title: str
    description: str = ""
    severity: str = "medium"
    status: str = "open"
    component: str = ""
    part_number: str = ""
    defect: str = ""
    verified_torque: str = ""
    technician_id: str = ""
    citation_anchor: str = ""
    source_message_id: Optional[str] = None
    created_at: str
    updated_at: str
    resolved_at: Optional[str] = None


class MissionReport(BaseModel):
    notebook: NotebookResponse
    generated_at: str
    sources: List[dict] = Field(default_factory=list)
    issues: List[IssueResponse] = Field(default_factory=list)
    messages: List[dict] = Field(default_factory=list)
