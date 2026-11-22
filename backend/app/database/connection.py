import sqlite3
import json
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from app.config import settings

logger = logging.getLogger(__name__)


def get_db_path() -> Path:
    data_dir = settings.resolved_okf_dir.parent
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "workspace.db"


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Provides a transactional SQLite database connection."""
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path), check_same_thread=False, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database() -> None:
    """Initializes SQLite schema for documents, conversations, messages, and provenance."""
    db_path = get_db_path()
    logger.info("Initializing SQLite database at: %s", db_path)
    with get_db_connection() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            mime_type TEXT,
            file_size INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            concepts_count INTEGER DEFAULT 0,
            source_metadata TEXT DEFAULT '{}',
            error TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS document_nodes (
            document_id TEXT NOT NULL,
            node_path TEXT NOT NULL,
            PRIMARY KEY (document_id, node_path),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            notebook_id TEXT,
            selected_document_ids TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            citations_json TEXT DEFAULT '[]',
            related_nodes_json TEXT DEFAULT '[]',
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_doc_nodes_path ON document_nodes(node_path);

        CREATE TABLE IF NOT EXISTS notebooks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            model TEXT DEFAULT '',
            category TEXT DEFAULT 'General Machinery',
            location TEXT DEFAULT '',
            status TEXT DEFAULT 'operational',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notebook_documents (
            notebook_id TEXT NOT NULL,
            document_id TEXT NOT NULL,
            PRIMARY KEY (notebook_id, document_id),
            FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE,
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            severity TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'open',
            component TEXT DEFAULT '',
            part_number TEXT DEFAULT '',
            defect TEXT DEFAULT '',
            verified_torque TEXT DEFAULT '',
            technician_id TEXT DEFAULT '',
            citation_anchor TEXT DEFAULT '',
            source_message_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_notebook_documents_notebook ON notebook_documents(notebook_id);
        CREATE INDEX IF NOT EXISTS idx_issues_notebook ON issues(notebook_id, status);
        """)

        # Lightweight forward migrations for tables
        conv_cols = {row[1] for row in conn.execute("PRAGMA table_info(conversations)").fetchall()}
        if "notebook_id" not in conv_cols:
            conn.execute("ALTER TABLE conversations ADD COLUMN notebook_id TEXT")

        nb_cols = {row[1] for row in conn.execute("PRAGMA table_info(notebooks)").fetchall()}
        for col, col_type in [("model", "TEXT DEFAULT ''"), ("category", "TEXT DEFAULT 'General Machinery'"), ("location", "TEXT DEFAULT ''"), ("status", "TEXT DEFAULT 'operational'")]:
            if col not in nb_cols:
                conn.execute(f"ALTER TABLE notebooks ADD COLUMN {col} {col_type}")

        issue_cols = {row[1] for row in conn.execute("PRAGMA table_info(issues)").fetchall()}
        for col, col_type in [
            ("component", "TEXT DEFAULT ''"),
            ("part_number", "TEXT DEFAULT ''"),
            ("defect", "TEXT DEFAULT ''"),
            ("verified_torque", "TEXT DEFAULT ''"),
            ("technician_id", "TEXT DEFAULT ''"),
            ("citation_anchor", "TEXT DEFAULT ''"),
        ]:
            if col not in issue_cols:
                conn.execute(f"ALTER TABLE issues ADD COLUMN {col} {col_type}")

        # Seed baseline document if documents table is empty and OKF bundle exists
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        count = cursor.fetchone()[0]
        baseline_id = "doc-baseline-industrial"
        if count == 0 and settings.resolved_okf_dir.exists():
            okf_nodes = [
                p.relative_to(settings.resolved_okf_dir).as_posix()
                for p in settings.resolved_okf_dir.glob("**/*.md")
                if p.name != "index.md"
            ]
            if okf_nodes:
                cursor.execute("""
                    INSERT INTO documents (id, filename, stored_path, mime_type, file_size, status, concepts_count, source_metadata, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (
                    baseline_id,
                    "Industrial Machinery Field Service Manual.pdf",
                    str(settings.resolved_okf_dir / "index.md"),
                    "application/pdf",
                    245760,
                    "READY",
                    len(okf_nodes),
                    json.dumps({"description": "Pre-indexed field diagnostic manual with hydraulic and electrical subsystems.", "generated_nodes": okf_nodes})
                ))
                for np in okf_nodes:
                    cursor.execute("""
                        INSERT OR IGNORE INTO document_nodes (document_id, node_path) VALUES (?, ?)
                    """, (baseline_id, np))
                logger.info("Seeded baseline document '%s' with %d OKF nodes.", baseline_id, len(okf_nodes))

        # Seed initial production-grade industrial equipment notebooks if empty
        cursor.execute("SELECT COUNT(*) FROM notebooks")
        if cursor.fetchone()[0] == 0:
            seed_notebooks = [
                (
                    "nb-vestas-v112",
                    "Vestas V112 Nacelle Pitch System",
                    "Pitch control manifolds, hydraulic proportional valves, accumulator banks and emergency feathering.",
                    "V112-3.45MW",
                    "Wind Energy",
                    "Offshore Horns Rev 3",
                    "degraded"
                ),
                (
                    "nb-siemens-sgt400",
                    "Siemens SGT-400 Gas Turbine",
                    "Twin-shaft industrial gas turbine for offshore power generation and high-pressure mechanical drive.",
                    "SGT-400-15MW",
                    "Turbomachinery",
                    "North Sea Platform Alpha",
                    "operational"
                ),
                (
                    "nb-komatsu-930e",
                    "Komatsu 930E-5 Mining Haul Truck",
                    "Ultra-class haul truck featuring AC electric drive, high-flow hydraulic hoist cylinders, and wet disc braking.",
                    "930E-5-AC",
                    "Heavy Mining",
                    "Pilbara Iron Ore Pit #2",
                    "maintenance"
                )
            ]
            for nb_id, title, desc, model, cat, loc, status in seed_notebooks:
                cursor.execute("""
                    INSERT INTO notebooks (id, title, description, model, category, location, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (nb_id, title, desc, model, cat, loc, status))
                # Link baseline doc to each notebook
                cursor.execute("""
                    INSERT OR IGNORE INTO notebook_documents (notebook_id, document_id)
                    VALUES (?, ?)
                """, (nb_id, baseline_id))

            # Seed sample issues for Vestas V112
            seed_issues = [
                (
                    "issue-vestas-01",
                    "nb-vestas-v112",
                    "PRV-992-B Proportional Relief Valve Seal Weepage",
                    "High-pressure O-ring extrusion observed at PRV-992-B manifold interface. Requires LOTO de-energization and FKM 90-durometer seal replacement.",
                    "critical",
                    "open",
                    "Proportional Relief Valve",
                    "PRV-992-B",
                    "Hydraulic extrusion leak under 210 bar load",
                    "35 Nm (3-stage star pattern)",
                    "TECH-8842-OFFSHORE",
                    "SEC-4.2"
                ),
                (
                    "issue-vestas-02",
                    "nb-vestas-v112",
                    "PCB Bus Capacitor C14 Voltage Degradation",
                    "Capacitor ripple voltage exceeded 5.2% tolerance. Replaced and calibrated under OEM field bulletin PB-2026-08.",
                    "warning",
                    "fixed",
                    "Pitch Controller PCB",
                    "PCB-V112-CTRL",
                    "Capacitor dielectric breakdown",
                    "45 Nm",
                    "TECH-8842-OFFSHORE",
                    "ELEC-7.1"
                )
            ]
            for i_id, nb_id, title, desc, sev, stat, comp, part, defect, torque, tech, cite in seed_issues:
                cursor.execute("""
                    INSERT INTO issues (
                        id, notebook_id, title, description, severity, status,
                        component, part_number, defect, verified_torque, technician_id, citation_anchor,
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (i_id, nb_id, title, desc, sev, stat, comp, part, defect, torque, tech, cite))
            logger.info("Seeded initial industrial equipment notebooks and issue register.")
