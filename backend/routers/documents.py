"""
backend/routers/documents.py

Document knowledge base API endpoints.
All under /api/ai/documents
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel

from rag.ingestion import (
    ingest_document, get_document_status, delete_document,
    list_documents, _ingest_content,
)

router = APIRouter()


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document for ingestion into the knowledge base.
    Supported: PDF, DOCX, TXT, MD, CSV, XLSX
    """
    allowed_extensions = {"pdf", "docx", "txt", "md", "csv", "xlsx", "xls"}
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not supported. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    result = ingest_document(filename, content, file_type=ext)
    return {
        "message": result.get("message", ""),
        "doc_id": result.get("doc_id"),
        "status": result.get("status"),
        "version": result.get("version", 1),
        "filename": filename,
        "file_size": len(content),
    }


@router.get("/")
async def list_documents_endpoint():
    """List all indexed documents."""
    docs = list_documents()
    return {"documents": docs, "total": len(docs)}


@router.get("/{doc_id}")
async def get_document_endpoint(doc_id: str):
    """Get document details and ingestion status."""
    doc = get_document_status(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"document": doc}


@router.delete("/{doc_id}")
async def delete_document_endpoint(doc_id: str):
    """Delete a document and all its chunks and embeddings."""
    ok = delete_document(doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted.", "id": doc_id}


@router.post("/{doc_id}/reindex")
async def reindex_document_endpoint(doc_id: str):
    """Force re-ingestion of a document (if it failed or needs updating)."""
    doc = get_document_status(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Find document in knowledge_docs folder or fail
    import os
    import threading
    docs_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_docs")
    doc_path = os.path.join(docs_folder, doc["name"])

    if os.path.exists(doc_path):
        with open(doc_path, "rb") as f:
            content = f.read()
        t = threading.Thread(
            target=_ingest_content,
            args=(doc_id, doc["name"], content),
            daemon=True,
        )
        t.start()
        return {"message": f"Re-indexing started for '{doc['name']}'.", "doc_id": doc_id}
    else:
        raise HTTPException(
            status_code=400,
            detail="Cannot re-index: original file not found in knowledge_docs folder. Re-upload the file instead.",
        )


@router.post("/rag/debug")
async def rag_debug_endpoint(payload: dict):
    """
    Debug RAG retrieval.
    POST body: { "query": "...", "top_k": 5 }
    """
    query = payload.get("query", "")
    top_k = int(payload.get("top_k", 5))

    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        from rag.retriever import retrieve_documents
        results = retrieve_documents(query, top_k=top_k)
        return {
            "query": query,
            "results": results,
            "count": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {e}")
