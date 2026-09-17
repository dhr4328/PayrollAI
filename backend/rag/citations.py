"""
backend/rag/citations.py

Citation generation and tracking.
Stores sources in message_sources table and generates
in-text citation references like [1], [2].
"""

import os
import uuid
import json
import sqlite3
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")

# Confidence thresholds
HIGH_CONFIDENCE = 0.75
MEDIUM_CONFIDENCE = 0.50
LOW_CONFIDENCE = 0.30


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def build_citations(
    retrieved_chunks: List[Dict[str, Any]],
    message_id: str,
) -> List[Dict[str, Any]]:
    """
    Build structured citations from retrieved document chunks.
    Returns list of citation dicts and stores them in message_sources.

    Each citation:
        {citation_index, document_name, page_number, excerpt, score, confidence_level}
    """
    if not retrieved_chunks:
        return []

    citations = []
    conn = _get_db()

    for i, chunk in enumerate(retrieved_chunks):
        score = float(chunk.get("score", 0.0))
        meta = chunk.get("metadata", {})
        doc_name = meta.get("document_name", "Unknown Document")
        doc_id = meta.get("document_id", "")
        chunk_id = chunk.get("id", "")
        page = int(meta.get("page_number", 0))

        # Determine confidence level
        if score >= HIGH_CONFIDENCE:
            confidence = "high"
        elif score >= MEDIUM_CONFIDENCE:
            confidence = "medium"
        elif score >= LOW_CONFIDENCE:
            confidence = "low"
        else:
            continue  # Skip very low confidence results

        # Build excerpt (first 200 chars)
        excerpt = chunk.get("text", "")[:200].strip()
        if len(chunk.get("text", "")) > 200:
            excerpt += "..."

        citation_index = i + 1
        citation_id = str(uuid.uuid4())

        # Store in message_sources
        try:
            conn.execute(
                """
                INSERT INTO message_sources
                    (id, message_id, source_type, document_id, chunk_id,
                     page_number, relevance_score, citation_index, excerpt, metadata_json)
                VALUES (?, ?, 'document', ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    citation_id, message_id, doc_id, chunk_id,
                    page, score, citation_index, excerpt,
                    json.dumps(meta),
                ),
            )
        except Exception as e:
            print(f"Citations: failed to store source ({e})")

        citations.append({
            "citation_index": citation_index,
            "document_name": doc_name,
            "page_number": page,
            "excerpt": excerpt,
            "score": score,
            "confidence_level": confidence,
            "chunk_id": chunk_id,
        })

    conn.commit()
    conn.close()
    return citations


def format_citation_footer(citations: List[Dict[str, Any]]) -> str:
    """Format citations as a footer block for AI responses."""
    if not citations:
        return ""
    lines = ["\n\n---\n**Sources:**"]
    for c in citations:
        page_info = f" — Page {c['page_number']}" if c.get("page_number") else ""
        conf = c.get("confidence_level", "")
        conf_indicator = {"high": "🟢", "medium": "🟡", "low": "🔴"}.get(conf, "")
        lines.append(
            f"[{c['citation_index']}] {conf_indicator} **{c['document_name']}**{page_info}"
        )
    return "\n".join(lines)


def get_message_sources(message_id: str) -> List[Dict[str, Any]]:
    """Retrieve all sources for a given message."""
    conn = _get_db()
    rows = conn.execute(
        "SELECT * FROM message_sources WHERE message_id = ? ORDER BY citation_index",
        (message_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def calculate_retrieval_confidence(chunks: List[Dict[str, Any]]) -> str:
    """Calculate overall retrieval confidence."""
    if not chunks:
        return "none"
    avg_score = sum(c.get("score", 0) for c in chunks) / len(chunks)
    if avg_score >= HIGH_CONFIDENCE:
        return "high"
    elif avg_score >= MEDIUM_CONFIDENCE:
        return "medium"
    elif avg_score >= LOW_CONFIDENCE:
        return "low"
    return "none"
