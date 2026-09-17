"""
backend/ai/context_builder.py

Token-aware context assembler.
Builds the final prompt context respecting token budgets.
"""

import os
from typing import List, Dict, Any, Optional

# Token budgets (in approximate tokens, 1 token ≈ 4 chars)
MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "12000"))
MAX_RAG_TOKENS = int(os.getenv("MAX_RAG_TOKENS", "5000"))
MAX_MEMORY_TOKENS = int(os.getenv("MAX_MEMORY_TOKENS", "2000"))
MAX_RECENT_CHAT_TOKENS = int(os.getenv("MAX_RECENT_CHAT_TOKENS", "4000"))
MAX_TOOL_RESULT_TOKENS = int(os.getenv("MAX_TOOL_RESULT_TOKENS", "4000"))
RECENT_MESSAGE_LIMIT = int(os.getenv("RECENT_MESSAGE_LIMIT", "12"))


def _approx_tokens(text: str) -> int:
    """Approximate token count."""
    return max(1, len(text) // 4)


def _truncate_to_tokens(text: str, max_tokens: int) -> str:
    """Truncate text to approximate token limit."""
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[...truncated for context limit...]"


def build_rag_context(retrieved_chunks: List[Dict[str, Any]]) -> str:
    """Build RAG context block from retrieved document chunks."""
    if not retrieved_chunks:
        return ""

    parts = []
    total_tokens = 0

    for i, chunk in enumerate(retrieved_chunks):
        meta = chunk.get("metadata", {})
        doc_name = meta.get("document_name", "Document")
        page = meta.get("page_number", 0)
        section = meta.get("section", "")
        score = chunk.get("score", 0.0)

        header = f"[Source {i+1}] {doc_name}"
        if page:
            header += f" (Page {page})"
        if section:
            header += f" — {section}"
        header += f" [relevance: {score:.2f}]"

        chunk_text = f"{header}\n{chunk.get('text', '')}"
        chunk_tokens = _approx_tokens(chunk_text)

        if total_tokens + chunk_tokens > MAX_RAG_TOKENS:
            break

        parts.append(chunk_text)
        total_tokens += chunk_tokens

    if not parts:
        return ""

    return "## Retrieved Company Documents\n\n" + "\n\n---\n\n".join(parts)


def build_memory_context(memories: List[Dict[str, Any]]) -> str:
    """Build conversation memory context."""
    if not memories:
        return ""

    parts = []
    total_tokens = 0

    for m in memories:
        content = m.get("content", m.get("text", ""))
        if not content:
            continue
        mem_tokens = _approx_tokens(content)
        if total_tokens + mem_tokens > MAX_MEMORY_TOKENS:
            break
        parts.append(f"- {content}")
        total_tokens += mem_tokens

    if not parts:
        return ""

    return "## Relevant Conversation Context\n\n" + "\n".join(parts)


def build_recent_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Build recent message list for LLM context.
    Returns trimmed list respecting token budget.
    """
    if not messages:
        return []

    # Take last N messages
    recent = messages[-RECENT_MESSAGE_LIMIT:]

    # Trim by token budget
    total_tokens = 0
    trimmed = []

    for msg in reversed(recent):
        content = msg.get("content", "")
        msg_tokens = _approx_tokens(content)
        if total_tokens + msg_tokens > MAX_RECENT_CHAT_TOKENS:
            break
        trimmed.insert(0, {
            "role": msg.get("role", "user"),
            "content": _truncate_to_tokens(content, MAX_TOOL_RESULT_TOKENS),
        })
        total_tokens += msg_tokens

    return trimmed


def build_system_prompt_with_context(
    base_prompt: str,
    conversation_summary: Optional[str] = None,
    rag_context: Optional[str] = None,
    memory_context: Optional[str] = None,
) -> str:
    """Assemble final system prompt with optional context blocks."""
    parts = [base_prompt]

    if conversation_summary:
        summary_tokens = _approx_tokens(conversation_summary)
        if summary_tokens < MAX_MEMORY_TOKENS:
            parts.append(f"\n## Conversation Summary\n{conversation_summary}")

    if memory_context:
        parts.append(f"\n{memory_context}")

    if rag_context:
        parts.append(f"\n{rag_context}")

    full_prompt = "\n".join(parts)

    # Final safety truncation
    return _truncate_to_tokens(full_prompt, MAX_CONTEXT_TOKENS - MAX_RECENT_CHAT_TOKENS)


def build_full_context(
    base_prompt: str,
    recent_messages: List[Dict[str, Any]],
    conversation_summary: Optional[str] = None,
    retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
    memories: Optional[List[Dict[str, Any]]] = None,
) -> tuple[str, List[Dict[str, str]]]:
    """
    Build complete LLM context: system prompt + message list.
    Returns (system_prompt, messages_list).
    """
    rag_ctx = build_rag_context(retrieved_chunks or [])
    mem_ctx = build_memory_context(memories or [])
    system_prompt = build_system_prompt_with_context(
        base_prompt,
        conversation_summary=conversation_summary,
        rag_context=rag_ctx,
        memory_context=mem_ctx,
    )
    messages = build_recent_messages(recent_messages)
    return system_prompt, messages
