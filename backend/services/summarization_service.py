"""
backend/services/summarization_service.py

Conversation summarization triggered when message count exceeds threshold.
Uses LLM or rule-based fallback.
"""

import os
import json
from typing import List, Dict, Any, Optional

RECENT_MESSAGE_LIMIT = int(os.getenv("RECENT_MESSAGE_LIMIT", "12"))
SUMMARIZATION_WINDOW = int(os.getenv("SUMMARIZATION_WINDOW", "20"))


def _build_conversation_text(messages: List[Dict[str, Any]]) -> str:
    """Format messages as readable text for summarization."""
    lines = []
    for msg in messages:
        role = msg.get("role", "unknown").upper()
        content = msg.get("content", "")
        if content.strip():
            lines.append(f"{role}: {content[:500]}")
    return "\n\n".join(lines)


def _rule_based_summary(messages: List[Dict[str, Any]]) -> str:
    """Simple rule-based summary extraction when LLM is unavailable."""
    topics = []
    emp_codes = set()
    actions = []

    import re
    for msg in messages:
        content = msg.get("content", "")
        # Extract employee codes
        codes = re.findall(r"\b[A-Z]{2,5}\d{2,6}\b", content)
        emp_codes.update(codes)

        # Extract action signals
        if any(kw in content.lower() for kw in ["updated", "changed", "set", "generated"]):
            snippet = content[:100].strip()
            if snippet:
                actions.append(snippet)

        # Extract topics
        topic_keywords = {
            "payroll": "payroll analysis",
            "attendance": "attendance review",
            "overtime": "overtime analysis",
            "leave": "leave policy",
            "pf": "PF compliance",
            "esi": "ESI compliance",
            "advance": "advance register",
            "payslip": "payslip generation",
        }
        for kw, topic in topic_keywords.items():
            if kw in content.lower() and topic not in topics:
                topics.append(topic)

    summary_parts = []
    if topics:
        summary_parts.append(f"Topics discussed: {', '.join(topics[:5])}.")
    if emp_codes:
        summary_parts.append(f"Employees referenced: {', '.join(list(emp_codes)[:10])}.")
    if actions:
        summary_parts.append(f"Actions performed: {actions[0][:100]}.")

    return " ".join(summary_parts) if summary_parts else f"Conversation covering {len(messages)} exchanges on payroll management topics."


def summarize_conversation(
    conversation_id: str,
    messages: Optional[List[Dict[str, Any]]] = None,
) -> Optional[str]:
    """
    Generate and store a conversation summary.
    Uses LLM if available, else rule-based fallback.
    """
    # Load messages if not provided
    if messages is None:
        from services.conversation_service import get_messages
        msgs_data = get_messages(conversation_id, limit=SUMMARIZATION_WINDOW)
        messages = msgs_data.get("messages", [])

    if len(messages) < 3:
        return None

    conv_text = _build_conversation_text(messages)

    # Try LLM summarization
    try:
        from openai import OpenAI
        api_key = (
            os.getenv("NVIDIA_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("AI_API_KEY")
        )
        if api_key and not any(p in api_key.lower() for p in ["your_", "placeholder", "xxxx"]):
            base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
            model = os.getenv("NVIDIA_MODEL", "nvidia/nemotron-4-340b-instruct")
            client = OpenAI(api_key=api_key, base_url=base_url)

            from ai.prompts.summarization import CONVERSATION_SUMMARY_PROMPT
            prompt = CONVERSATION_SUMMARY_PROMPT.format(conversation=conv_text)

            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.2,
            )
            summary = response.choices[0].message.content.strip()
            if summary:
                _store_summary(conversation_id, summary)
                return summary
    except Exception as e:
        print(f"SummarizationService: LLM failed ({e}), using rule-based fallback.")

    # Rule-based fallback
    summary = _rule_based_summary(messages)
    _store_summary(conversation_id, summary)
    return summary


def _store_summary(conversation_id: str, summary: str) -> None:
    """Store summary in conversations table."""
    try:
        from services.conversation_service import update_conversation
        update_conversation(conversation_id, summary=summary)
    except Exception as e:
        print(f"SummarizationService: storage failed ({e})")


def should_summarize(message_count: int) -> bool:
    """Check if conversation is long enough to trigger summarization."""
    return message_count > 0 and message_count % SUMMARIZATION_WINDOW == 0
