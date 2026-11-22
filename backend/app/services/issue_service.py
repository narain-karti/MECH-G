import re
from typing import Optional

from app.database.notebook_repository import IssueRepository
from app.database.repository import ConversationRepository


class IssueService:
    """Keeps a mission issue register in sync with chat language.

    This deterministic fallback deliberately errs on the side of traceable drafts:
    it creates an issue only when the technician names a concrete fault signal and
    marks a matching issue resolved only after explicit resolution language.
    """

    ISSUE_TERMS = ("issue", "fault", "failure", "leak", "alarm", "error", "defect", "problem", "damage")
    RESOLVED_TERMS = ("resolved", "repaired", "fixed", "completed", "cleared", "verified working")

    @classmethod
    def capture_from_chat(cls, conversation_id: str, user_text: str, assistant_text: str, source_message_id: Optional[str]) -> None:
        conversation = ConversationRepository.get(conversation_id)
        notebook_id = (conversation or {}).get("notebook_id")
        if not notebook_id:
            return

        normalized = user_text.lower()
        keywords = cls._keywords(normalized)
        candidate = IssueRepository.find_open_match(notebook_id, keywords)
        resolved = any(term in normalized or term in assistant_text.lower() for term in cls.RESOLVED_TERMS)
        if resolved and candidate:
            IssueRepository.update(candidate["id"], status="resolved")
            return
        if not any(term in normalized for term in cls.ISSUE_TERMS) or candidate:
            return

        title = cls._title(user_text)
        severity = "high" if any(term in normalized for term in ("safety", "pressure", "arc", "critical", "emergency")) else "medium"
        IssueRepository.create(notebook_id, title, user_text.strip(), severity, source_message_id)

    @staticmethod
    def _keywords(text: str) -> list[str]:
        return [word for word in re.findall(r"[a-z0-9-]{4,}", text) if word not in {"there", "please", "about", "would", "could", "should", "issue"}][:8]

    @staticmethod
    def _title(text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text.strip()).rstrip("?.!")
        return cleaned[:177] + ("..." if len(cleaned) > 177 else "")
