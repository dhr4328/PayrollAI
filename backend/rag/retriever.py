"""
backend/rag/retriever.py

Hybrid retrieval engine combining:
1. Semantic vector similarity search
2. Keyword/BM25-style search
3. Candidate fusion + deduplication
4. Optional reranking (see reranker.py)

Collections:
  - "documents"        → document knowledge base chunks
  - "chat_memory"      → conversation semantic memories
"""

import os
from typing import List, Dict, Any, Optional

from rag.embeddings import embed_text
from rag.vector_store import get_vector_store

RAG_TOP_K = int(os.getenv("RAG_TOP_K", "10"))
RAG_FINAL_K = int(os.getenv("RAG_FINAL_K", "5"))
ENABLE_RERANKER = os.getenv("ENABLE_RERANKER", "false").lower() == "true"

# Singleton vector store
_store = None


def _get_store():
    global _store
    if _store is None:
        _store = get_vector_store()
    return _store


def retrieve_documents(
    query: str,
    top_k: int = RAG_FINAL_K,
    filter_metadata: Optional[Dict[str, Any]] = None,
    collection: str = "documents",
) -> List[Dict[str, Any]]:
    """
    Hybrid retrieval: vector + keyword, fused and deduplicated.
    Returns top_k results with scores and metadata.
    """
    store = _get_store()
    query_embedding = embed_text(query)

    # 1. Vector search (semantic)
    vector_results = store.search(
        collection=collection,
        query_embedding=query_embedding,
        top_k=RAG_TOP_K,
        filter_metadata=filter_metadata,
    )

    # 2. Keyword search (lexical)
    keyword_results = store.keyword_search(
        collection=collection,
        query=query,
        top_k=RAG_TOP_K,
        filter_metadata=filter_metadata,
    )

    # 3. Fusion: combine and normalize scores
    fused: Dict[str, Dict[str, Any]] = {}

    for r in vector_results:
        doc_id = r["id"]
        fused[doc_id] = {**r, "vector_score": r["score"], "keyword_score": 0.0}

    for r in keyword_results:
        doc_id = r["id"]
        if doc_id in fused:
            fused[doc_id]["keyword_score"] = r["score"]
            # RRF-style fusion: combined score
            fused[doc_id]["score"] = (
                0.7 * fused[doc_id]["vector_score"] + 0.3 * r["score"]
            )
        else:
            fused[doc_id] = {
                **r,
                "vector_score": 0.0,
                "keyword_score": r["score"],
                "score": 0.3 * r["score"],
            }

    # 4. Sort by combined score
    candidates = sorted(fused.values(), key=lambda x: x["score"], reverse=True)

    # 5. Optional reranking
    if ENABLE_RERANKER and candidates:
        try:
            from rag.reranker import rerank
            candidates = rerank(query, candidates, top_k=top_k)
        except Exception as e:
            print(f"Retriever: reranker failed ({e}), using fusion scores.")
            candidates = candidates[:top_k]
    else:
        candidates = candidates[:top_k]

    return candidates


def retrieve_conversation_memory(
    query: str,
    conversation_id: str,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Retrieve semantically relevant memories from a specific conversation.
    """
    return retrieve_documents(
        query=query,
        top_k=top_k,
        filter_metadata={"conversation_id": conversation_id},
        collection="chat_memory",
    )


def retrieve_chat_history(
    query: str,
    session_id: str,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Retrieve semantically relevant past chat messages for a session.
    Backward compat: searches 'chat_vector_store' via vector_db module.
    """
    try:
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        import vector_db
        results = vector_db.search_relevant_history(session_id, query, top_k=top_k)
        return results
    except Exception as e:
        print(f"Retriever: chat history lookup failed ({e})")
        return []
