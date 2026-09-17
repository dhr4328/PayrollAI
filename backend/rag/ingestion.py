"""
backend/rag/ingestion.py

Document ingestion pipeline:
  Upload → Parse → Clean → Chunk → Embed → Index

Supports: PDF, DOCX, TXT, Markdown, CSV, XLSX
Features:
  - SHA256 checksum deduplication (skip if unchanged)
  - Document versioning on content change
  - Background threading for large files
  - Status tracking in documents table
"""

import os
import io
import uuid
import json
import hashlib
import sqlite3
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional

from rag.chunker import chunk_text, chunk_table_csv
from rag.embeddings import embed_documents
from rag.vector_store import get_vector_store

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")
DOCS_COLLECTION = "documents"
LARGE_FILE_THRESHOLD = 100 * 1024  # 100KB


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _compute_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _set_doc_status(doc_id: str, status: str, conn: Optional[sqlite3.Connection] = None) -> None:
    close = False
    if conn is None:
        conn = _get_db()
        close = True
    conn.execute(
        "UPDATE documents SET status = ?, updated_at = ? WHERE id = ?",
        (status, datetime.utcnow().isoformat(), doc_id),
    )
    conn.commit()
    if close:
        conn.close()


def _parse_document(content: bytes, filename: str) -> tuple[str, List[Dict[str, Any]]]:
    """
    Parse document content into raw text.
    Returns (text, table_rows) where table_rows is populated for CSV/XLSX.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    # PDF
    if ext == "pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            pages = []
            for i, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    pages.append(f"--- Page {i + 1} ---\n{text}")
            return "\n\n".join(pages), []
        except Exception as e:
            print(f"Ingestion: PDF parse error ({e})")
            return content.decode("utf-8", errors="replace"), []

    # DOCX
    elif ext == "docx":
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs), []
        except Exception as e:
            print(f"Ingestion: DOCX parse error ({e})")
            return content.decode("utf-8", errors="replace"), []

    # CSV
    elif ext == "csv":
        try:
            import csv
            rows = list(csv.DictReader(io.StringIO(content.decode("utf-8", errors="replace"))))
            # Also provide as text for embedding
            text = content.decode("utf-8", errors="replace")
            return text, rows
        except Exception as e:
            print(f"Ingestion: CSV parse error ({e})")
            return content.decode("utf-8", errors="replace"), []

    # XLSX
    elif ext in ("xlsx", "xls"):
        try:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(content))
            rows = df.fillna("").to_dict("records")
            text = df.to_string(index=False)
            return text, rows
        except Exception as e:
            print(f"Ingestion: XLSX parse error ({e})")
            return "", []

    # TXT / Markdown
    else:
        try:
            return content.decode("utf-8", errors="replace"), []
        except Exception:
            return "", []


def _ingest_content(doc_id: str, filename: str, content: bytes) -> None:
    """Core ingestion logic: parse → chunk → embed → index."""
    conn = _get_db()
    store = get_vector_store()

    try:
        _set_doc_status(doc_id, "processing", conn)

        # 1. Parse
        text, table_rows = _parse_document(content, filename)
        if not text and not table_rows:
            _set_doc_status(doc_id, "failed", conn)
            conn.close()
            return

        # 2. Chunk
        meta_base = {"document_id": doc_id, "document_name": filename}
        if table_rows:
            chunks = chunk_table_csv(table_rows, document_name=filename)
        else:
            chunks = chunk_text(text, document_name=filename)

        if not chunks:
            _set_doc_status(doc_id, "failed", conn)
            conn.close()
            return

        # Add document_id to each chunk's metadata
        for chunk in chunks:
            chunk["metadata"]["document_id"] = doc_id

        # 3. Remove old chunks and vectors for this doc
        conn.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
        conn.commit()
        store.delete_many(DOCS_COLLECTION, {"document_id": doc_id})

        # 4. Embed (batch)
        texts = [c["content"] for c in chunks]
        embeddings = embed_documents(texts)

        # 5. Store chunks in DB and vector store
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = f"{doc_id}_chunk_{i}"
            emb_json = json.dumps(embedding)

            conn.execute(
                """
                INSERT OR REPLACE INTO document_chunks
                    (id, document_id, chunk_index, content, page_number, section,
                     token_count, embedding_blob, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    chunk_id, doc_id, chunk["chunk_index"], chunk["content"],
                    chunk.get("page_number", 0), chunk.get("section", ""),
                    chunk.get("token_count", 0), emb_json,
                    json.dumps({**chunk.get("metadata", {}), "chunk_id": chunk_id}),
                ),
            )

            # Add to vector store
            store.add(
                collection=DOCS_COLLECTION,
                doc_id=chunk_id,
                text=chunk["content"],
                embedding=embedding,
                metadata={
                    **chunk.get("metadata", {}),
                    "chunk_id": chunk_id,
                    "page_number": chunk.get("page_number", 0),
                    "section": chunk.get("section", ""),
                },
            )

        conn.commit()
        _set_doc_status(doc_id, "indexed", conn)
        print(f"Ingestion: '{filename}' indexed ({len(chunks)} chunks).")

    except Exception as e:
        print(f"Ingestion: failed for '{filename}' ({e})")
        _set_doc_status(doc_id, "failed", conn)
    finally:
        conn.close()


def ingest_document(
    filename: str,
    content: bytes,
    file_type: str = "",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Start document ingestion. Returns immediately with doc_id and status.
    Large files are processed in background thread.
    """
    conn = _get_db()
    checksum = _compute_checksum(content)

    # Check for existing document with same checksum
    existing = conn.execute(
        "SELECT id, version, status FROM documents WHERE checksum = ?", (checksum,)
    ).fetchone()

    if existing and existing["status"] == "indexed":
        conn.close()
        return {
            "doc_id": existing["id"],
            "status": "already_indexed",
            "message": "Document already indexed (same checksum).",
            "version": existing["version"],
        }

    # Check for same filename (new version)
    prev = conn.execute(
        "SELECT id, version FROM documents WHERE name = ? ORDER BY version DESC LIMIT 1",
        (filename,),
    ).fetchone()
    version = (prev["version"] + 1) if prev else 1

    doc_id = str(uuid.uuid4())
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else file_type or "txt"

    conn.execute(
        """
        INSERT INTO documents (id, name, file_type, file_size, checksum, status, version, metadata_json)
        VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)
        """,
        (doc_id, filename, ext, len(content), checksum, version, json.dumps(metadata or {})),
    )
    conn.commit()
    conn.close()

    # Background processing for large files
    if len(content) > LARGE_FILE_THRESHOLD:
        t = threading.Thread(target=_ingest_content, args=(doc_id, filename, content), daemon=True)
        t.start()
        return {
            "doc_id": doc_id,
            "status": "processing",
            "message": f"Document queued for background ingestion ({len(content) // 1024}KB).",
            "version": version,
        }
    else:
        _ingest_content(doc_id, filename, content)
        return {
            "doc_id": doc_id,
            "status": "indexed",
            "message": f"Document ingested successfully ({version} chunk(s) created).",
            "version": version,
        }


def get_document_status(doc_id: str) -> Optional[Dict[str, Any]]:
    """Get ingestion status for a document."""
    conn = _get_db()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    # Add chunk count
    conn2 = _get_db()
    count = conn2.execute(
        "SELECT COUNT(*) as cnt FROM document_chunks WHERE document_id = ?", (doc_id,)
    ).fetchone()
    conn2.close()
    d["chunk_count"] = count["cnt"] if count else 0
    return d


def delete_document(doc_id: str) -> bool:
    """Delete document, chunks, and vector embeddings."""
    store = get_vector_store()
    store.delete_many(DOCS_COLLECTION, {"document_id": doc_id})

    conn = _get_db()
    conn.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
    conn.execute("DELETE FROM message_sources WHERE document_id = ?", (doc_id,))
    cursor = conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def list_documents() -> List[Dict[str, Any]]:
    """List all documents with chunk counts."""
    conn = _get_db()
    rows = conn.execute(
        "SELECT * FROM documents ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for row in rows:
        d = dict(row)
        count = conn.execute(
            "SELECT COUNT(*) as cnt FROM document_chunks WHERE document_id = ?", (row["id"],)
        ).fetchone()
        d["chunk_count"] = count["cnt"] if count else 0
        result.append(d)
    conn.close()
    return result


def ingest_knowledge_docs_folder() -> int:
    """Auto-ingest all .md and .txt files from knowledge_docs/ folder on startup."""
    folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_docs")
    if not os.path.isdir(folder):
        return 0
    count = 0
    for fname in os.listdir(folder):
        if fname.endswith((".md", ".txt", ".pdf")):
            fpath = os.path.join(folder, fname)
            with open(fpath, "rb") as f:
                content = f.read()
            result = ingest_document(fname, content)
            if result.get("status") not in ("already_indexed",):
                count += 1
                print(f"Ingestion: Auto-ingested knowledge doc '{fname}'.")
    return count
