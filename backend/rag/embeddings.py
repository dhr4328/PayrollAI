"""
backend/rag/embeddings.py

Embedding service with:
- Lazy model loading (SentenceTransformers all-MiniLM-L6-v2)
- SHA256-based embedding cache in SQLite
- Batch embedding support
- CPU/GPU auto-detection
- Hash-based fallback vectorizer when sentence-transformers is unavailable
"""

import os
import json
import math
import hashlib
import sqlite3
from typing import List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))
ENABLE_CACHE = os.getenv("ENABLE_EMBEDDING_CACHE", "true").lower() == "true"

# Global model singleton — lazy loaded
_model = None
_model_loaded = False


def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _load_model():
    """Lazily load the SentenceTransformer model."""
    global _model, _model_loaded
    if _model_loaded:
        return _model
    _model_loaded = True
    try:
        from sentence_transformers import SentenceTransformer
        # Use the short model name after '/' for local loading
        model_name = EMBEDDING_MODEL_NAME.split("/")[-1] if "/" in EMBEDDING_MODEL_NAME else EMBEDDING_MODEL_NAME
        _model = SentenceTransformer(model_name)
        print(f"EmbeddingService: Loaded model '{model_name}'.")
    except Exception as e:
        print(f"EmbeddingService: SentenceTransformer unavailable ({e}). Using fallback vectorizer.")
        _model = None
    return _model


def _fallback_vector(text: str, dim: int = 128) -> List[float]:
    """Lightweight hash-based term frequency vector for offline/fallback mode."""
    words = [w.lower() for w in text.split() if len(w) > 1]
    vec = [0.0] * dim
    if not words:
        return vec
    for w in words:
        idx = hash(w) % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def _cache_key(text: str) -> str:
    """SHA256 hash of text + model name → cache key."""
    raw = f"{text}|{EMBEDDING_MODEL_NAME}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cached(key: str) -> Optional[List[float]]:
    if not ENABLE_CACHE:
        return None
    try:
        conn = _get_db()
        row = conn.execute(
            "SELECT embedding_blob FROM embedding_cache WHERE cache_key = ?", (key,)
        ).fetchone()
        conn.close()
        if row:
            return json.loads(row["embedding_blob"])
    except Exception:
        pass
    return None


def _set_cached(key: str, embedding: List[float]) -> None:
    if not ENABLE_CACHE:
        return
    try:
        conn = _get_db()
        conn.execute(
            "INSERT OR REPLACE INTO embedding_cache (cache_key, embedding_blob, model_name) VALUES (?, ?, ?)",
            (key, json.dumps(embedding), EMBEDDING_MODEL_NAME),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def embed_text(text: str) -> List[float]:
    """Generate a dense embedding vector for a text string."""
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIMENSION

    key = _cache_key(text)
    cached = _get_cached(key)
    if cached:
        return cached

    model = _load_model()
    if model is not None:
        try:
            vec = model.encode(text, convert_to_numpy=True).tolist()
            result = [float(x) for x in vec]
        except Exception as e:
            print(f"EmbeddingService: encode error ({e}). Using fallback.")
            result = _fallback_vector(text, EMBEDDING_DIMENSION)
    else:
        result = _fallback_vector(text, min(EMBEDDING_DIMENSION, 128))

    _set_cached(key, result)
    return result


def embed_documents(texts: List[str]) -> List[List[float]]:
    """Batch embed a list of texts efficiently."""
    if not texts:
        return []

    model = _load_model()

    # Find uncached texts
    results: List[Optional[List[float]]] = [None] * len(texts)
    uncached_indices = []
    uncached_texts = []

    for i, text in enumerate(texts):
        if not text or not text.strip():
            results[i] = [0.0] * EMBEDDING_DIMENSION
            continue
        key = _cache_key(text)
        cached = _get_cached(key)
        if cached:
            results[i] = cached
        else:
            uncached_indices.append(i)
            uncached_texts.append(text)

    if uncached_texts:
        if model is not None:
            try:
                batch_vecs = model.encode(uncached_texts, convert_to_numpy=True, batch_size=32)
                for j, idx in enumerate(uncached_indices):
                    vec = [float(x) for x in batch_vecs[j]]
                    results[idx] = vec
                    _set_cached(_cache_key(texts[idx]), vec)
            except Exception as e:
                print(f"EmbeddingService: batch encode error ({e}). Falling back per-item.")
                for j, idx in enumerate(uncached_indices):
                    vec = _fallback_vector(uncached_texts[j], EMBEDDING_DIMENSION)
                    results[idx] = vec
                    _set_cached(_cache_key(texts[idx]), vec)
        else:
            for j, idx in enumerate(uncached_indices):
                vec = _fallback_vector(uncached_texts[j], min(EMBEDDING_DIMENSION, 128))
                results[idx] = vec

    return [r if r is not None else [0.0] * EMBEDDING_DIMENSION for r in results]


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two dense vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def get_embedding_dimension() -> int:
    """Return the current embedding dimension."""
    model = _load_model()
    if model is not None:
        try:
            test_vec = embed_text("test")
            return len(test_vec)
        except Exception:
            pass
    return min(EMBEDDING_DIMENSION, 128)
