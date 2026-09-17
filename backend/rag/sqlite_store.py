"""
backend/rag/sqlite_store.py

SQLite implementation of VectorStore.
Uses two tables:
  - vector_documents: stores text, embedding_blob, metadata per collection+doc_id
  - Cosine similarity computed in Python (no external extension needed)

Collections are namespaced by a 'collection' column, so chat memory,
document chunks, and conversation memories all share the same table
but are logically separated.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional

from rag.vector_store import VectorStore
from rag.embeddings import cosine_similarity

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute("""
    CREATE TABLE IF NOT EXISTS vector_documents (
        id TEXT NOT NULL,
        collection TEXT NOT NULL,
        text_content TEXT NOT NULL,
        embedding_blob TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection, id)
    )
    """)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_vecdocs_collection ON vector_documents(collection)"
    )
    conn.commit()


class SQLiteVectorStore(VectorStore):
    """SQLite-backed vector store with Python cosine similarity."""

    def add(
        self,
        collection: str,
        doc_id: str,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        conn = _get_db()
        _ensure_table(conn)
        meta_json = json.dumps(metadata or {})
        emb_json = json.dumps(embedding)
        conn.execute(
            """
            INSERT OR REPLACE INTO vector_documents
                (id, collection, text_content, embedding_blob, metadata_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (doc_id, collection, text, emb_json, meta_json),
        )
        conn.commit()
        conn.close()

    def search(
        self,
        collection: str,
        query_embedding: List[float],
        top_k: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        conn = _get_db()
        _ensure_table(conn)
        rows = conn.execute(
            "SELECT id, text_content, embedding_blob, metadata_json FROM vector_documents WHERE collection = ?",
            (collection,),
        ).fetchall()
        conn.close()

        scored = []
        for row in rows:
            meta = {}
            try:
                meta = json.loads(row["metadata_json"] or "{}")
            except Exception:
                pass

            # Apply metadata filter
            if filter_metadata:
                match = all(str(meta.get(k)) == str(v) for k, v in filter_metadata.items())
                if not match:
                    continue

            try:
                doc_vec = json.loads(row["embedding_blob"])
                score = cosine_similarity(query_embedding, doc_vec)
            except Exception:
                score = 0.0

            scored.append({
                "id": row["id"],
                "text": row["text_content"],
                "score": score,
                "metadata": meta,
                "collection": collection,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def delete(self, collection: str, doc_id: str) -> bool:
        conn = _get_db()
        _ensure_table(conn)
        cursor = conn.execute(
            "DELETE FROM vector_documents WHERE collection = ? AND id = ?",
            (collection, doc_id),
        )
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    def delete_many(self, collection: str, filter_metadata: Dict[str, Any]) -> int:
        """Delete documents by metadata filter or entire collection if filter is empty."""
        conn = _get_db()
        _ensure_table(conn)

        if not filter_metadata:
            cursor = conn.execute(
                "DELETE FROM vector_documents WHERE collection = ?", (collection,)
            )
            count = cursor.rowcount
        else:
            # Fetch all and filter in Python (SQLite doesn't have JSON field queries without extensions)
            rows = conn.execute(
                "SELECT id, metadata_json FROM vector_documents WHERE collection = ?",
                (collection,),
            ).fetchall()
            to_delete = []
            for row in rows:
                try:
                    meta = json.loads(row["metadata_json"] or "{}")
                except Exception:
                    meta = {}
                if all(str(meta.get(k)) == str(v) for k, v in filter_metadata.items()):
                    to_delete.append(row["id"])
            count = 0
            for doc_id in to_delete:
                conn.execute(
                    "DELETE FROM vector_documents WHERE collection = ? AND id = ?",
                    (collection, doc_id),
                )
                count += 1

        conn.commit()
        conn.close()
        return count

    def keyword_search(
        self,
        collection: str,
        query: str,
        top_k: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Simple FTS via SQL LIKE. Returns scored results by keyword hit count."""
        conn = _get_db()
        _ensure_table(conn)

        words = [w.lower() for w in query.split() if len(w) > 2]
        if not words:
            conn.close()
            return []

        rows = conn.execute(
            "SELECT id, text_content, metadata_json FROM vector_documents WHERE collection = ?",
            (collection,),
        ).fetchall()
        conn.close()

        scored = []
        for row in rows:
            meta = {}
            try:
                meta = json.loads(row["metadata_json"] or "{}")
            except Exception:
                pass

            if filter_metadata:
                if not all(str(meta.get(k)) == str(v) for k, v in filter_metadata.items()):
                    continue

            text_lower = row["text_content"].lower()
            hits = sum(1 for w in words if w in text_lower)
            if hits > 0:
                scored.append({
                    "id": row["id"],
                    "text": row["text_content"],
                    "score": hits / len(words),
                    "metadata": meta,
                    "collection": collection,
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
