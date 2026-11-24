import uuid
import shutil
import logging
from typing import List
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form

from app.config import settings
from app.models.ingest_models import IngestResponse
from app.services.okf_compiler.compiler_service import OKFCompilerService
from app.services.okf_compiler.manifest import load_manifest
from app.database.repository import DocumentRepository
from app.database.notebook_repository import NotebookRepository
from app.routers.graph_router import get_graph_engine
from app.services.graph_engine import OKFGraphEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingest", tags=["Ingestion & OKF Compilation"])
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xlsx", ".xls", ".pptx", ".md", ".txt", ".html"}
MAX_DOC_BYTES = 25 * 1024 * 1024


def get_compiler_service() -> OKFCompilerService:
    return OKFCompilerService(output_dir=str(settings.resolved_okf_dir))


@router.post("/upload", response_model=IngestResponse)
async def upload_and_compile(
    files: List[UploadFile] = File(...),
    notebook_id: str | None = Form(default=None),
    compiler: OKFCompilerService = Depends(get_compiler_service),
    engine: OKFGraphEngine = Depends(get_graph_engine)
):
    """
    Uploads raw documents (PDF, DOCX, XLSX, Markdown) and compiles them into
    the Open Knowledge Format (OKF) bundle with SQLite provenance tracking.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    if notebook_id and not NotebookRepository.get(notebook_id):
        raise HTTPException(status_code=404, detail="Mission notebook not found")

    saved_paths: List[str] = []
    doc_id_map = {}
    raw_dir = settings.resolved_raw_docs_dir

    for file in files:
        safe_filename = Path(file.filename or "upload.bin").name
        if Path(safe_filename).suffix.lower() not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {safe_filename}")
        doc_id = f"doc-{uuid.uuid4().hex[:8]}"
        target_path = raw_dir / f"{doc_id}_{safe_filename}"

        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(str(target_path))
            file_size = target_path.stat().st_size
            if file_size > MAX_DOC_BYTES:
                target_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"{safe_filename} exceeds 25 MB limit.")

            # Create document in SQLite
            DocumentRepository.create(
                doc_id=doc_id,
                filename=safe_filename,
                stored_path=str(target_path),
                mime_type=file.content_type or "application/octet-stream",
                file_size=file_size,
                status="COMPILING_OKF"
            )
            if notebook_id:
                NotebookRepository.link_document(notebook_id, doc_id)
            doc_id_map[target_path.name] = doc_id
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Failed to save uploaded file %s: %s", safe_filename, e)
            raise HTTPException(status_code=500, detail=f"Failed to save {safe_filename}")

    # Run OmniOKF compilation
    result = compiler.compile_files(saved_paths)

    # Refresh in-memory knowledge graph
    engine.reload()

    # Link generated nodes and update status in database
    for item in result.file_details:
        doc_id = doc_id_map.get(item.filename)
        if not doc_id:
            continue

        if item.status in ["compiled", "cached"]:
            nodes_to_link = item.node_paths
            if not nodes_to_link:
                stem = Path(item.filename).stem.lower()
                nodes_to_link = [
                    p for p in engine.nodes_by_path.keys()
                    if stem in p.lower()
                ]
            DocumentRepository.link_nodes(doc_id, nodes_to_link)
            DocumentRepository.update_status(
                doc_id,
                status="READY",
                concepts_count=len(nodes_to_link)
            )
        else:
            DocumentRepository.update_status(
                doc_id,
                status="FAILED",
                error=item.error_message
            )

    return result


@router.post("/compile-all", response_model=IngestResponse)
async def compile_all_raw_docs(
    compiler: OKFCompilerService = Depends(get_compiler_service),
    engine: OKFGraphEngine = Depends(get_graph_engine)
):
    """Recompiles all documents present in the raw documents directory."""
    raw_dir = settings.resolved_raw_docs_dir
    raw_files = [str(p) for p in raw_dir.glob("*") if p.is_file() and not p.name.startswith(".")]

    if not raw_files:
        raise HTTPException(status_code=404, detail="No raw documents found to compile.")

    res = compiler.compile_files(raw_files)
    engine.reload()
    return res


@router.get("/manifest")
async def get_compilation_manifest():
    """Returns the current incremental compilation cache manifest."""
    return load_manifest(str(settings.resolved_okf_dir))
