"""
backend/rag/vector_store.py

Abstract VectorStore interface + factory.
Backend is selected via VECTOR_STORE env var (default: sqlite).
"""

import os
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class VectorStore(ABC):
    """Abstract interface for vector storage backends."""

    @abstractmethod
    def add(
        self,
        collection: str,
        doc_id: str,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add or replace a document in the collection."""
        ...

    @abstractmethod
    def search(
        self,
        collection: str,
        query_embedding: List[float],
        top_k: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Return top_k documents by cosine similarity with optional metadata filter."""
        ...

    @abstractmethod
    def delete(self, collection: str, doc_id: str) -> bool:
        """Delete a single document from the collection."""
        ...

    @abstractmethod
    def delete_many(self, collection: str, filter_metadata: Dict[str, Any]) -> int:
        """Delete all documents matching filter. Returns count deleted."""
        ...

    @abstractmethod
    def keyword_search(
        self,
        collection: str,
        query: str,
        top_k: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Keyword/lexical search over text content."""
        ...


def get_vector_store() -> VectorStore:
    """Factory: return the configured VectorStore implementation."""
    backend = os.getenv("VECTOR_STORE", "sqlite").lower()
    if backend == "pgvector":
        try:
            from rag.pgvector_store import PgVectorStore
            return PgVectorStore()
        except ImportError:
            print("VectorStore: pgvector not available, falling back to sqlite.")
    from rag.sqlite_store import SQLiteVectorStore
    return SQLiteVectorStore()
