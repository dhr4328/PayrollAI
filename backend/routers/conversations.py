"""
backend/routers/conversations.py

Conversation management API endpoints.
All under /api/ai/conversations
"""

import json
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services.conversation_service import (
    create_conversation, get_conversation, list_conversations,
    update_conversation, archive_conversation, restore_conversation,
    delete_conversation, get_messages, search_conversations,
    export_conversation, get_or_create_conversation_for_session,
)
from services.memory_service import get_conversation_memories

router = APIRouter()


# ── Request models ─────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    session_id: str
    title: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    session_id: str


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("/")
async def create_conversation_endpoint(req: CreateConversationRequest):
    """Create a new conversation."""
    conv = create_conversation(req.session_id, title=req.title)
    return {"conversation": conv}


@router.get("/")
async def list_conversations_endpoint(
    session_id: str = Query(...),
    include_archived: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
):
    """List all conversations for a session, newest first."""
    conversations = list_conversations(
        session_id,
        include_archived=include_archived,
        limit=limit,
        offset=offset,
    )
    # Group by date
    grouped: dict = {}
    import datetime
    for conv in conversations:
        try:
            dt = datetime.datetime.fromisoformat(conv.get("updated_at", ""))
            date_key = dt.strftime("%Y-%m-%d")
        except Exception:
            date_key = "older"
        grouped.setdefault(date_key, []).append(conv)

    return {
        "conversations": conversations,
        "grouped": grouped,
        "total": len(conversations),
    }


@router.get("/search")
async def search_conversations_endpoint(
    q: str = Query(..., min_length=1),
    session_id: str = Query(...),
    top_k: int = Query(10),
):
    """Semantic + lexical search across conversation titles and messages."""
    results = search_conversations(session_id, q, top_k=top_k)
    return {"results": results, "query": q}


@router.get("/{conv_id}")
async def get_conversation_endpoint(conv_id: str):
    """Get conversation details."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"conversation": conv}


@router.patch("/{conv_id}")
async def update_conversation_endpoint(conv_id: str, req: UpdateConversationRequest):
    """Rename/update conversation."""
    conv = update_conversation(conv_id, title=req.title)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"conversation": conv}


@router.delete("/{conv_id}")
async def delete_conversation_endpoint(conv_id: str):
    """Delete conversation with cascade (messages, memories, feedback)."""
    ok = delete_conversation(conv_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"message": "Conversation deleted.", "id": conv_id}


@router.post("/{conv_id}/archive")
async def archive_conversation_endpoint(conv_id: str):
    """Archive a conversation."""
    ok = archive_conversation(conv_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"message": "Conversation archived.", "id": conv_id}


@router.post("/{conv_id}/restore")
async def restore_conversation_endpoint(conv_id: str):
    """Restore an archived conversation."""
    ok = restore_conversation(conv_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"message": "Conversation restored.", "id": conv_id}


@router.get("/{conv_id}/messages")
async def get_messages_endpoint(
    conv_id: str,
    limit: int = Query(50, le=200),
    cursor: Optional[str] = Query(None),
):
    """Get paginated messages for a conversation."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    result = get_messages(conv_id, limit=limit, cursor=cursor)
    return result


@router.get("/{conv_id}/export")
async def export_conversation_endpoint(
    conv_id: str,
    format: str = Query("json", pattern="^(json|md|txt)$"),
):
    """Export conversation in JSON, Markdown, or plain text format."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    content = export_conversation(conv_id, format=format)
    media_types = {
        "json": "application/json",
        "md": "text/markdown",
        "txt": "text/plain",
    }
    filename = f"conversation_{conv_id[:8]}.{format}"
    return Response(
        content=content,
        media_type=media_types.get(format, "text/plain"),
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{conv_id}/memory")
async def get_conversation_memory_endpoint(conv_id: str):
    """Debug endpoint: view stored memories for a conversation."""
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    memories = get_conversation_memories(conv_id)
    return {"memories": memories, "count": len(memories)}


@router.get("/session/{session_id}/active")
async def get_active_conversation_endpoint(session_id: str):
    """Get or create the active conversation for a session (backward compat)."""
    conv = get_or_create_conversation_for_session(session_id)
    return {"conversation": conv}
