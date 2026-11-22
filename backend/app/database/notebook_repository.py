import uuid
from typing import Any, Dict, List, Optional

from app.database.connection import get_db_connection


class NotebookRepository:
    @staticmethod
    def create(
        title: str,
        description: str = "",
        model: str = "",
        category: str = "General Machinery",
        location: str = "",
        status: str = "operational",
    ) -> Dict[str, Any]:
        notebook_id = f"nb-{uuid.uuid4().hex[:10]}"
        with get_db_connection() as conn:
            conn.execute(
                """INSERT INTO notebooks (id, title, description, model, category, location, status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))""",
                (notebook_id, title.strip(), description.strip(), model.strip(), category.strip(), location.strip(), status.strip()),
            )
        return NotebookRepository.get(notebook_id)  # type: ignore[return-value]

    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute(
                """SELECT n.*, COUNT(DISTINCT nd.document_id) source_count,
                          COUNT(DISTINCT i.id) issue_count,
                          COUNT(DISTINCT CASE WHEN i.status NOT IN ('resolved', 'fixed') THEN i.id END) open_issue_count
                   FROM notebooks n
                   LEFT JOIN notebook_documents nd ON nd.notebook_id = n.id
                   LEFT JOIN issues i ON i.notebook_id = n.id
                   GROUP BY n.id ORDER BY n.updated_at DESC"""
            ).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get(notebook_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            row = conn.execute(
                """SELECT n.*, COUNT(DISTINCT nd.document_id) source_count,
                          COUNT(DISTINCT i.id) issue_count,
                          COUNT(DISTINCT CASE WHEN i.status NOT IN ('resolved', 'fixed') THEN i.id END) open_issue_count
                   FROM notebooks n
                   LEFT JOIN notebook_documents nd ON nd.notebook_id = n.id
                   LEFT JOIN issues i ON i.notebook_id = n.id
                   WHERE n.id = ? GROUP BY n.id""",
                (notebook_id,),
            ).fetchone()
        return dict(row) if row else None

    @staticmethod
    def update(
        notebook_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        model: Optional[str] = None,
        category: Optional[str] = None,
        location: Optional[str] = None,
        status: Optional[str] = None,
    ) -> None:
        updates, values = ["updated_at = datetime('now')"], []
        field_map = {
            "title": title,
            "description": description,
            "model": model,
            "category": category,
            "location": location,
            "status": status,
        }
        for col, val in field_map.items():
            if val is not None:
                updates.append(f"{col} = ?")
                values.append(val.strip())
        values.append(notebook_id)
        with get_db_connection() as conn:
            conn.execute(f"UPDATE notebooks SET {', '.join(updates)} WHERE id = ?", values)

    @staticmethod
    def delete(notebook_id: str) -> bool:
        with get_db_connection() as conn:
            result = conn.execute("DELETE FROM notebooks WHERE id = ?", (notebook_id,))
        return result.rowcount > 0

    @staticmethod
    def link_document(notebook_id: str, document_id: str) -> None:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO notebook_documents (notebook_id, document_id) VALUES (?, ?)",
                (notebook_id, document_id),
            )
            conn.execute("UPDATE notebooks SET updated_at = datetime('now') WHERE id = ?", (notebook_id,))

    @staticmethod
    def unlink_document(notebook_id: str, document_id: str) -> None:
        with get_db_connection() as conn:
            conn.execute(
                "DELETE FROM notebook_documents WHERE notebook_id = ? AND document_id = ?",
                (notebook_id, document_id),
            )
            conn.execute("UPDATE notebooks SET updated_at = datetime('now') WHERE id = ?", (notebook_id,))

    @staticmethod
    def document_ids(notebook_id: str) -> List[str]:
        with get_db_connection() as conn:
            rows = conn.execute(
                "SELECT document_id FROM notebook_documents WHERE notebook_id = ?", (notebook_id,)
            ).fetchall()
        return [row[0] for row in rows]


class IssueRepository:
    @staticmethod
    def create(
        notebook_id: str,
        title: str,
        description: str = "",
        severity: str = "medium",
        status: str = "open",
        component: str = "",
        part_number: str = "",
        defect: str = "",
        verified_torque: str = "",
        technician_id: str = "",
        citation_anchor: str = "",
        source_message_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        issue_id = f"issue-{uuid.uuid4().hex[:10]}"
        with get_db_connection() as conn:
            conn.execute(
                """INSERT INTO issues (
                    id, notebook_id, title, description, severity, status,
                    component, part_number, defect, verified_torque, technician_id, citation_anchor,
                    source_message_id, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))""",
                (
                    issue_id,
                    notebook_id,
                    title.strip(),
                    description.strip(),
                    severity,
                    status,
                    component.strip(),
                    part_number.strip(),
                    defect.strip(),
                    verified_torque.strip(),
                    technician_id.strip(),
                    citation_anchor.strip(),
                    source_message_id,
                ),
            )
        return IssueRepository.get(issue_id)  # type: ignore[return-value]

    @staticmethod
    def get(issue_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            row = conn.execute("SELECT * FROM issues WHERE id = ?", (issue_id,)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_for_notebook(notebook_id: str) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute(
                """SELECT * FROM issues WHERE notebook_id = ? 
                   ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1 ELSE 2 END, updated_at DESC""",
                (notebook_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def update(issue_id: str, **fields: Optional[str]) -> None:
        updates, values = ["updated_at = datetime('now')"], []
        valid_keys = (
            "title",
            "description",
            "severity",
            "status",
            "component",
            "part_number",
            "defect",
            "verified_torque",
            "technician_id",
            "citation_anchor",
        )
        for key in valid_keys:
            value = fields.get(key)
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
                if key == "status":
                    if value in ("resolved", "fixed"):
                        updates.append("resolved_at = datetime('now')")
                    else:
                        updates.append("resolved_at = NULL")
        values.append(issue_id)
        with get_db_connection() as conn:
            conn.execute(f"UPDATE issues SET {', '.join(updates)} WHERE id = ?", values)

    @staticmethod
    def delete(issue_id: str) -> bool:
        with get_db_connection() as conn:
            result = conn.execute("DELETE FROM issues WHERE id = ?", (issue_id,))
        return result.rowcount > 0

    @staticmethod
    def find_open_match(notebook_id: str, words: List[str]) -> Optional[Dict[str, Any]]:
        if not words:
            return None
        with get_db_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM issues WHERE notebook_id = ? AND status NOT IN ('resolved', 'fixed')", (notebook_id,)
            ).fetchall()
        for row in rows:
            haystack = f"{row['title']} {row['description']} {row.get('component', '')} {row.get('defect', '')}".lower()
            if sum(word in haystack for word in words) >= min(2, len(words)):
                return dict(row)
        return None
