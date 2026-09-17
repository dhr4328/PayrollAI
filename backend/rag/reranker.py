"""
backend/rag/reranker.py

Optional cross-encoder reranker.
Falls back to fusion scores if reranker model is unavailable.

Enabled via: ENABLE_RERANKER=true
Model via: RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
"""

import os
from typing import List, Dict, Any

RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

_reranker = None
_reranker_loaded = False


def _load_reranker():
    global _reranker, _reranker_loaded
    if _reranker_loaded:
        return _reranker
    _reranker_loaded = True
    try:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder(RERANKER_MODEL)
        print(f"Reranker: Loaded cross-encoder '{RERANKER_MODEL}'.")
    except Exception as e:
        print(f"Reranker: model unavailable ({e}). Disabled.")
        _reranker = None
    return _reranker


def rerank(
    query: str,
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Rerank candidates using cross-encoder scores.
    Falls back to existing scores if model unavailable.
    """
    model = _load_reranker()
    if model is None or not candidates:
        return candidates[:top_k]

    try:
        pairs = [(query, c["text"]) for c in candidates]
        scores = model.predict(pairs)
        for i, candidate in enumerate(candidates):
            candidate["rerank_score"] = float(scores[i])
            candidate["score"] = float(scores[i])

        reranked = sorted(candidates, key=lambda x: x.get("rerank_score", 0.0), reverse=True)
        return reranked[:top_k]
    except Exception as e:
        print(f"Reranker: prediction failed ({e}). Using original scores.")
        return candidates[:top_k]
