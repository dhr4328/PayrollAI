"""
backend/services/conversation_service.py

Conversation CRUD with:
- Auto-title generation
- Session → conversation backward compatibility
- Pagination via cursor
- Archive/restore
- Summary management
"""

import os
import uuid
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

from ai.router import generate_auto_title

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _now() -> str:
    return datetime.utcnow().isoformat()


# ── Conversation CRUD ──────────────────────────────────────────────

def create_conversation(
    session_id: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new conversation."""
    conv_id = str(uuid.uuid4())
    now = _now()
    t = title or "New Conversation"
    conn = _get_db()
    conn.execute(
        """
        INSERT INTO conversations
            (id, session_id, title, created_at, updated_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (conv_id, session_id, t, now, now, json.dumps(metadata or {})),
    )
    conn.commit()
    conn.close()
    return get_conversation(conv_id)


def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_db()
    row = conn.execute(
        "SELECT * FROM conversations WHERE id = ?", (conv_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def list_conversations(
    session_id: str,
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List conversations for a session, newest first."""
    conn = _get_db()
    query = "SELECT * FROM conversations WHERE session_id = ?"
    params: List[Any] = [session_id]
    if not include_archived:
        query += " AND is_archived = 0"
    query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_conversation(
    conv_id: str,
    title: Optional[str] = None,
    summary: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Update conversation metadata."""
    conn = _get_db()
    updates = []
    params: List[Any] = []
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if summary is not None:
        updates.append("summary = ?")
        params.append(summary)
    if metadata is not None:
        updates.append("metadata_json = ?")
        params.append(json.dumps(metadata))
    updates.append("updated_at = ?")
    params.append(_now())
    params.append(conv_id)

    conn.execute(f"UPDATE conversations SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return get_conversation(conv_id)


def archive_conversation(conv_id: str) -> bool:
    conn = _get_db()
    cursor = conn.execute(
        "UPDATE conversations SET is_archived = 1, updated_at = ? WHERE id = ?",
        (_now(), conv_id),
    )
    ok = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return ok


def restore_conversation(conv_id: str) -> bool:
    conn = _get_db()
    cursor = conn.execute(
        "UPDATE conversations SET is_archived = 0, updated_at = ? WHERE id = ?",
        (_now(), conv_id),
    )
    ok = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return ok


def delete_conversation(conv_id: str) -> bool:
    """Delete conversation and all associated data (cascade)."""
    # Delete vector embeddings from vector store
    try:
        from rag.vector_store import get_vector_store
        store = get_vector_store()
        store.delete_many("chat_memory", {"conversation_id": conv_id})
    except Exception as e:
        print(f"ConversationService: vector cleanup failed ({e})")

    conn = _get_db()
    # Delete from new chat_messages table
    conn.execute("DELETE FROM chat_messages WHERE conversation_id = ?", (conv_id,))
    # Delete memories, tool executions, feedback
    conn.execute("DELETE FROM conversation_memories WHERE conversation_id = ?", (conv_id,))
    conn.execute("DELETE FROM ai_tool_executions WHERE conversation_id = ?", (conv_id,))
    conn.execute("DELETE FROM ai_feedback WHERE conversation_id = ?", (conv_id,))
    # Delete conversation itself
    cursor = conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    ok = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return ok


# ── Message management ─────────────────────────────────────────────

def add_message(
    conversation_id: str,
    session_id: str,
    role: str,
    content: str,
    message_type: str = "text",
    metadata: Optional[Dict[str, Any]] = None,
    tool_name: Optional[str] = None,
    tool_call_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Add a message to a conversation and update conversation stats."""
    msg_id = str(uuid.uuid4())
    now = _now()
    # Approximate token count (1 token ≈ 4 chars)
    token_count = max(1, len(content) // 4)

    conn = _get_db()
    conn.execute(
        """
        INSERT INTO chat_messages
            (id, conversation_id, session_id, role, content, message_type,
             tool_name, tool_call_id, created_at, token_count, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            msg_id, conversation_id, session_id, role, content, message_type,
            tool_name, tool_call_id, now, token_count, json.dumps(metadata or {}),
        ),
    )
    # Update conversation stats
    conn.execute(
        """
        UPDATE conversations
        SET message_count = message_count + 1,
            last_message_at = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (now, now, conversation_id),
    )
    conn.commit()
    conn.close()

    return {
        "id": msg_id,
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "message_type": message_type,
        "created_at": now,
    }


def get_messages(
    conversation_id: str,
    limit: int = 50,
    cursor: Optional[str] = None,
) -> Dict[str, Any]:
    """Get paginated messages for a conversation (cursor-based)."""
    conn = _get_db()
    if cursor:
        rows = conn.execute(
            """
            SELECT * FROM chat_messages
            WHERE conversation_id = ? AND created_at < ?
            ORDER BY created_at DESC LIMIT ?
            """,
            (conversation_id, cursor, limit),
        ).fetchall()
        rows = list(reversed(rows))
    else:
        rows = conn.execute(
            """
            SELECT * FROM chat_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            LIMIT ?
            """,
            (conversation_id, limit),
        ).fetchall()
    conn.close()

    messages = [dict(r) for r in rows]
    next_cursor = messages[0]["created_at"] if len(messages) == limit else None
    return {
        "messages": messages,
        "next_cursor": next_cursor,
        "has_more": next_cursor is not None,
    }


def get_recent_messages(
    conversation_id: str,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Get the most recent N messages (for LLM context)."""
    conn = _get_db()
    rows = conn.execute(
        """
        SELECT * FROM chat_messages
        WHERE conversation_id = ? AND message_type NOT IN ('system', 'tool_result')
        ORDER BY created_at DESC LIMIT ?
        """,
        (conversation_id, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]


# ── Session backward compatibility ─────────────────────────────────

def get_or_create_conversation_for_session(session_id: str) -> Dict[str, Any]:
    """
    Backward compat: get the latest active conversation for a session,
    or create one if none exists.
    """
    conn = _get_db()
    row = conn.execute(
        """
        SELECT * FROM conversations
        WHERE session_id = ? AND is_archived = 0
        ORDER BY updated_at DESC LIMIT 1
        """,
        (session_id,),
    ).fetchone()
    conn.close()

    if row:
        return dict(row)
    return create_conversation(session_id, title="Chat Session")


# ── Search ─────────────────────────────────────────────────────────

def search_conversations(
    session_id: str,
    query: str,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """
    Semantic + lexical search over conversation titles and messages.
    """
    results = []
    query_lower = query.lower()

    # 1. Title search (lexical)
    conn = _get_db()
    title_rows = conn.execute(
        "SELECT * FROM conversations WHERE session_id = ? AND LOWER(title) LIKE ?",
        (session_id, f"%{query_lower}%"),
    ).fetchall()

    for row in title_rows:
        results.append({
            "conversation_id": row["id"],
            "title": row["title"],
            "matched_message": "",
            "match_type": "title",
            "score": 1.0,
        })

    # 2. Message content search (lexical)
    msg_rows = conn.execute(
        """
        SELECT m.conversation_id, m.content, c.title
        FROM chat_messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.session_id = ? AND LOWER(m.content) LIKE ?
        ORDER BY m.created_at DESC
        LIMIT 20
        """,
        (session_id, f"%{query_lower}%"),
    ).fetchall()
    conn.close()

    seen_convs = {r["conversation_id"] for r in results}
    for row in msg_rows:
        if row["conversation_id"] not in seen_convs:
            results.append({
                "conversation_id": row["conversation_id"],
                "title": row["title"],
                "matched_message": row["content"][:200],
                "match_type": "message",
                "score": 0.7,
            })
            seen_convs.add(row["conversation_id"])

    # 3. Semantic search via vector store (if available)
    try:
        from rag.embeddings import embed_text
        from rag.vector_store import get_vector_store
        store = get_vector_store()
        query_emb = embed_text(query)
        sem_results = store.search("chat_memory", query_emb, top_k=top_k)
        for sr in sem_results:
            meta = sr.get("metadata", {})
            conv_id = meta.get("conversation_id", "")
            if conv_id and conv_id not in seen_convs:
                conv = get_conversation(conv_id)
                if conv and conv.get("session_id") == session_id:
                    results.append({
                        "conversation_id": conv_id,
                        "title": conv.get("title", ""),
                        "matched_message": sr.get("text", "")[:200],
                        "match_type": "semantic",
                        "score": sr.get("score", 0.0),
                    })
                    seen_convs.add(conv_id)
    except Exception as e:
        print(f"ConversationService: semantic search failed ({e})")

    # Sort and return
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


# ── Title generation ───────────────────────────────────────────────

def auto_title_conversation(conv_id: str, first_message: str) -> str:
    """Generate and set title based on first user message."""
    title = generate_auto_title(first_message)
    update_conversation(conv_id, title=title)
    return title


# ── Export ─────────────────────────────────────────────────────────

def export_conversation(conv_id: str, format: str = "json") -> str:
    """Export conversation in specified format."""
    conv = get_conversation(conv_id)
    if not conv:
        return ""
    msgs_data = get_messages(conv_id, limit=1000)
    messages = msgs_data["messages"]

    if format == "json":
        return json.dumps({
            "conversation": conv,
            "messages": messages,
            "exported_at": _now(),
        }, indent=2, default=str)

    elif format == "md":
        lines = [f"# {conv.get('title', 'Conversation')}\n"]
        lines.append(f"*Exported: {_now()}*\n\n---\n")
        for msg in messages:
            role = msg["role"].upper()
            content = msg["content"]
            lines.append(f"**{role}**: {content}\n")
        return "\n".join(lines)

    elif format == "txt":
        lines = [f"Conversation: {conv.get('title', 'Chat')}\n"]
        for msg in messages:
            lines.append(f"{msg['role'].upper()}: {msg['content']}\n")
        return "\n".join(lines)

    return ""
