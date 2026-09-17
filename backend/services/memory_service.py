"""
backend/services/memory_service.py

Semantic memory extraction and retrieval.
Stores important conversation facts as vector embeddings.
"""

import os
import uuid
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")
MEMORY_IMPORTANCE_THRESHOLD = float(os.getenv("MEMORY_IMPORTANCE_THRESHOLD", "0.65"))
ENABLE_SEMANTIC_MEMORY = os.getenv("ENABLE_SEMANTIC_MEMORY", "true").lower() == "true"


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _score_importance(content: str) -> float:
    """
    Heuristic importance scoring for a piece of content.
    Higher score = more likely to be stored as long-term memory.
    """
    score = 0.3  # Base score
    content_lower = content.lower()

    # Business relevance signals
    important_keywords = [
        "update", "changed", "decided", "anomaly", "issue", "problem",
        "payroll", "salary", "advance", "deduction", "leave", "overtime",
        "pf", "esi", "employee", "department", "policy",
    ]
    keyword_hits = sum(1 for kw in important_keywords if kw in content_lower)
    score += min(0.4, keyword_hits * 0.05)

    # Specific facts boost
    import re
    if re.search(r"₹\d+|rs\.?\s*\d+|\d+%", content_lower):
        score += 0.15  # Contains monetary/percentage values

    if re.search(r"\b[A-Z]{2,5}\d{2,6}\b", content):
        score += 0.10  # Employee code mentioned

    # Length penalty for very short messages
    if len(content) < 30:
        score -= 0.2

    return min(1.0, max(0.0, score))


def store_memory(
    conversation_id: str,
    content: str,
    source_message_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Evaluate and optionally store a memory.
    Returns stored memory dict, or None if below importance threshold.
    """
    if not ENABLE_SEMANTIC_MEMORY:
        return None

    importance = _score_importance(content)
    if importance < MEMORY_IMPORTANCE_THRESHOLD:
        return None

    # Generate embedding
    try:
        from rag.embeddings import embed_text
        embedding = embed_text(content)
        emb_json = json.dumps(embedding)
    except Exception as e:
        print(f"MemoryService: embedding failed ({e})")
        emb_json = json.dumps([])

    memory_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    conn = _get_db()
    conn.execute(
        """
        INSERT INTO conversation_memories
            (id, conversation_id, content, embedding_blob, importance_score,
             created_at, last_accessed_at, source_message_id, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            memory_id, conversation_id, content, emb_json, importance,
            now, now, source_message_id, json.dumps(metadata or {}),
        ),
    )
    conn.commit()
    conn.close()

    # Also store in vector store for semantic search
    try:
        from rag.vector_store import get_vector_store
        store = get_vector_store()
        store.add(
            collection="chat_memory",
            doc_id=memory_id,
            text=content,
            embedding=json.loads(emb_json),
            metadata={
                "conversation_id": conversation_id,
                "importance_score": importance,
                "memory_id": memory_id,
            },
        )
    except Exception as e:
        print(f"MemoryService: vector store failed ({e})")

    return {
        "id": memory_id,
        "content": content,
        "importance_score": importance,
        "created_at": now,
    }


def retrieve_relevant_memories(
    query: str,
    conversation_id: str,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve semantically relevant memories with recency × importance ranking."""
    if not ENABLE_SEMANTIC_MEMORY:
        return []

    try:
        from rag.retriever import retrieve_conversation_memory
        results = retrieve_conversation_memory(query, conversation_id, top_k=top_k * 2)

        # Apply recency × importance decay
        now = datetime.utcnow()
        for r in results:
            meta = r.get("metadata", {})
            mem_id = meta.get("memory_id", "")
            importance = float(meta.get("importance_score", 0.5))
            sem_score = float(r.get("score", 0.0))

            # Get last accessed time for decay
            try:
                conn = _get_db()
                row = conn.execute(
                    "SELECT last_accessed_at FROM conversation_memories WHERE id = ?", (mem_id,)
                ).fetchone()
                conn.close()
                if row and row["last_accessed_at"]:
                    accessed = datetime.fromisoformat(row["last_accessed_at"])
                    days_ago = (now - accessed).days
                    recency_factor = max(0.5, 1.0 - (days_ago * 0.05))
                else:
                    recency_factor = 1.0
            except Exception:
                recency_factor = 1.0

            r["final_score"] = sem_score * importance * recency_factor

        # Update last_accessed_at for retrieved memories
        results.sort(key=lambda x: x.get("final_score", 0), reverse=True)
        top_results = results[:top_k]

        # Update access timestamps
        for r in top_results:
            mem_id = r.get("metadata", {}).get("memory_id", "")
            if mem_id:
                try:
                    conn = _get_db()
                    conn.execute(
                        "UPDATE conversation_memories SET last_accessed_at = ? WHERE id = ?",
                        (datetime.utcnow().isoformat(), mem_id),
                    )
                    conn.commit()
                    conn.close()
                except Exception:
                    pass

        return top_results

    except Exception as e:
        print(f"MemoryService: retrieval failed ({e})")
        return []


def get_conversation_memories(conversation_id: str) -> List[Dict[str, Any]]:
    """Get all memories for a conversation (for debugging)."""
    conn = _get_db()
    rows = conn.execute(
        """
        SELECT id, content, importance_score, created_at, last_accessed_at, source_message_id
        FROM conversation_memories
        WHERE conversation_id = ?
        ORDER BY importance_score DESC
        """,
        (conversation_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
