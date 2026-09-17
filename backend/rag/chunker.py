"""
backend/rag/chunker.py

Structure-aware document chunker.
Preserves paragraphs, headings, and sections.
Configurable chunk size and overlap (in approximate tokens).
"""

import re
from typing import List, Dict, Any

CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "800") if False else "800")  # ~800 tokens
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "100") if False else "100")  # ~100 tokens

import os
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "100"))


def _approx_tokens(text: str) -> int:
    """Approximate token count (4 chars ≈ 1 token)."""
    return max(1, len(text) // 4)


def _split_into_paragraphs(text: str) -> List[str]:
    """Split text on double newlines (paragraph boundaries)."""
    raw = re.split(r"\n\s*\n", text)
    paras = [p.strip() for p in raw if p.strip()]
    return paras


def _split_long_paragraph(para: str, max_tokens: int) -> List[str]:
    """Split a single long paragraph at sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", para)
    chunks = []
    current = []
    current_tokens = 0

    for sentence in sentences:
        s_tokens = _approx_tokens(sentence)
        if current_tokens + s_tokens > max_tokens and current:
            chunks.append(" ".join(current))
            current = [sentence]
            current_tokens = s_tokens
        else:
            current.append(sentence)
            current_tokens += s_tokens

    if current:
        chunks.append(" ".join(current))
    return chunks if chunks else [para]


def chunk_text(
    text: str,
    document_name: str = "",
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> List[Dict[str, Any]]:
    """
    Chunk a text document into structured, overlapping chunks.

    Returns list of dicts:
        {chunk_index, content, token_count, section, page_number, metadata}
    """
    paragraphs = _split_into_paragraphs(text)
    chunks: List[Dict[str, Any]] = []
    chunk_index = 0
    current_section = ""
    current_page = 1
    buffer: List[str] = []
    buffer_tokens = 0
    overlap_buffer: List[str] = []

    for para in paragraphs:
        # Detect headings
        if re.match(r"^#{1,4}\s+", para) or (len(para) < 80 and para.isupper()):
            current_section = para.strip("#").strip()

        # Detect page markers (e.g. "--- Page 3 ---" or "Page 3")
        page_match = re.search(r"(?:page|pg\.?)\s+(\d+)", para, re.IGNORECASE)
        if page_match:
            current_page = int(page_match.group(1))

        para_tokens = _approx_tokens(para)

        # If single paragraph is bigger than chunk_size, split it
        if para_tokens > chunk_size:
            # Flush current buffer first
            if buffer:
                content = "\n\n".join(buffer)
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": content,
                    "token_count": buffer_tokens,
                    "section": current_section,
                    "page_number": current_page,
                    "metadata": {"document_name": document_name},
                })
                chunk_index += 1
                overlap_buffer = buffer[-2:] if len(buffer) >= 2 else buffer[:]
                buffer = list(overlap_buffer)
                buffer_tokens = sum(_approx_tokens(p) for p in buffer)

            sub_chunks = _split_long_paragraph(para, chunk_size)
            for sub in sub_chunks:
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": sub,
                    "token_count": _approx_tokens(sub),
                    "section": current_section,
                    "page_number": current_page,
                    "metadata": {"document_name": document_name},
                })
                chunk_index += 1
            continue

        # Add to buffer
        if buffer_tokens + para_tokens > chunk_size and buffer:
            content = "\n\n".join(buffer)
            chunks.append({
                "chunk_index": chunk_index,
                "content": content,
                "token_count": buffer_tokens,
                "section": current_section,
                "page_number": current_page,
                "metadata": {"document_name": document_name},
            })
            chunk_index += 1
            # Keep overlap
            overlap_buffer = buffer[-2:] if len(buffer) >= 2 else buffer[:]
            buffer = list(overlap_buffer)
            buffer_tokens = sum(_approx_tokens(p) for p in buffer)

        buffer.append(para)
        buffer_tokens += para_tokens

    # Flush remaining buffer
    if buffer:
        content = "\n\n".join(buffer)
        chunks.append({
            "chunk_index": chunk_index,
            "content": content,
            "token_count": buffer_tokens,
            "section": current_section,
            "page_number": current_page,
            "metadata": {"document_name": document_name},
        })

    return chunks


def chunk_table_csv(rows: List[Dict[str, Any]], document_name: str = "") -> List[Dict[str, Any]]:
    """Chunk CSV/tabular data, preserving row relationships."""
    chunks = []
    batch_size = 20  # rows per chunk
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        lines = []
        if batch:
            lines.append(" | ".join(str(k) for k in batch[0].keys()))
            lines.append("-" * 40)
        for row in batch:
            lines.append(" | ".join(str(v) for v in row.values()))
        content = "\n".join(lines)
        chunks.append({
            "chunk_index": i // batch_size,
            "content": content,
            "token_count": _approx_tokens(content),
            "section": "Table Data",
            "page_number": 0,
            "metadata": {"document_name": document_name, "content_type": "table"},
        })
    return chunks
