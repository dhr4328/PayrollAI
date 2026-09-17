"""
backend/ai/router.py

Intent classifier and query router.
Determines how to handle each incoming query:
  DATABASE_QUERY   → Use SQL/tools directly
  DOCUMENT_QUERY   → Use RAG document retrieval
  CONVERSATION_QUERY → Search conversation memory
  HYBRID_QUERY     → Combine SQL + RAG
  ACTION_REQUEST   → Write operation (requires safety check)
  GENERAL_QUERY    → General payroll knowledge
"""

import re
from typing import Dict, Any, Tuple


class QueryIntent:
    DATABASE_QUERY = "DATABASE_QUERY"
    DOCUMENT_QUERY = "DOCUMENT_QUERY"
    CONVERSATION_QUERY = "CONVERSATION_QUERY"
    HYBRID_QUERY = "HYBRID_QUERY"
    ACTION_REQUEST = "ACTION_REQUEST"
    GENERAL_QUERY = "GENERAL_QUERY"


# Patterns for database-bound queries
_DB_PATTERNS = [
    re.compile(r"\b(show|get|fetch|list|display|what is|how much|who has|find)\b.*\b(payslip|salary|attendance|overtime|employee|pf|esi|net pay|gross|advance|department)\b", re.IGNORECASE),
    re.compile(r"\b(payroll summary|attendance summary|overtime report|absent employees|department summary)\b", re.IGNORECASE),
    re.compile(r"\b(how many employees?|total employees?|employee count)\b", re.IGNORECASE),
    re.compile(r"\b[A-Z]{2,5}\d{2,6}\b"),  # Employee code
]

# Patterns for document/policy queries
_DOC_PATTERNS = [
    re.compile(r"\b(policy|procedure|rule|guideline|handbook|regulation|manual|document)\b", re.IGNORECASE),
    re.compile(r"\b(how many (leave|casual|earned|sick)|carry forward|leave balance|leave entitlement)\b", re.IGNORECASE),
    re.compile(r"\b(what (is|are) our|what does (our|the) company|company (policy|rule|practice))\b", re.IGNORECASE),
    re.compile(r"\b(allowed|permitted|eligible|entitled|applicable under)\b", re.IGNORECASE),
    re.compile(r"\b(overtime (policy|rules?|eligibility|limit))\b", re.IGNORECASE),
]

# Patterns for conversation memory queries
_MEMORY_PATTERNS = [
    re.compile(r"\b(we (discussed|talked|mentioned|said)|what did (we|i|you) (say|discuss|decide|mention))\b", re.IGNORECASE),
    re.compile(r"\b(earlier|previously|last time|before|remember|as (we|i) (said|mentioned))\b", re.IGNORECASE),
    re.compile(r"\b(follow up on|what about that|continue from)\b", re.IGNORECASE),
]

# Patterns for write/action requests
_ACTION_PATTERNS = [
    re.compile(r"\b(update|change|set|modify|edit|increase|decrease|reduce|add)\b.*\b(rate|salary|advance|deduction|attendance|present|absent)\b", re.IGNORECASE),
    re.compile(r"\b(update|set|change)\b.*\b(for all|company.wide|everyone|all employees)\b", re.IGNORECASE),
    re.compile(r"\b(generate|create|produce|export|download|send)\b.*\b(payslip|pdf|report|zip|form xxii|register)\b", re.IGNORECASE),
    re.compile(r"\b(reset|clear|delete|remove)\b.*\b(data|employee|record)\b", re.IGNORECASE),
]

# Patterns requiring both DB and docs (hybrid)
_HYBRID_PATTERNS = [
    re.compile(r"\b(why|explain|analyze|compare|consistent with|according to)\b.*\b(policy|rule|payroll|salary|overtime)\b", re.IGNORECASE),
    re.compile(r"\b(is (it|this) (allowed|permitted|correct|valid))\b", re.IGNORECASE),
    re.compile(r"\b(should|can|may|must)\b.*\b(employee|company|we)\b.*\b(get|have|take|pay)\b", re.IGNORECASE),
]

# Temporal expressions
_TEMPORAL_MAP = {
    "today": "current_date",
    "this month": "current_month",
    "last month": "previous_month",
    "previous month": "previous_month",
    "this year": "current_year",
    "last year": "previous_year",
    "q1": "Q1", "q2": "Q2", "q3": "Q3", "q4": "Q4",
    "january": "01", "february": "02", "march": "03",
    "april": "04", "may": "05", "june": "06",
    "july": "07", "august": "08", "september": "09",
    "october": "10", "november": "11", "december": "12",
}


def classify_intent(message: str) -> Tuple[str, Dict[str, Any]]:
    """
    Classify query intent and extract metadata.
    Returns (intent, metadata_dict).
    """
    msg = message.strip()
    metadata: Dict[str, Any] = {}

    # Extract employee codes
    emp_codes = re.findall(r"\b([A-Z]{2,5}\d{2,6})\b", msg, re.IGNORECASE)
    if emp_codes:
        metadata["emp_codes"] = [c.upper() for c in emp_codes]

    # Extract temporal expressions
    msg_lower = msg.lower()
    for expr, normalized in _TEMPORAL_MAP.items():
        if expr in msg_lower:
            metadata.setdefault("temporal_refs", []).append(normalized)

    # Score each intent
    action_score = sum(1 for p in _ACTION_PATTERNS if p.search(msg))
    db_score = sum(1 for p in _DB_PATTERNS if p.search(msg))
    doc_score = sum(1 for p in _DOC_PATTERNS if p.search(msg))
    memory_score = sum(1 for p in _MEMORY_PATTERNS if p.search(msg))
    hybrid_score = sum(1 for p in _HYBRID_PATTERNS if p.search(msg))

    metadata.update({
        "scores": {
            "action": action_score,
            "database": db_score,
            "document": doc_score,
            "memory": memory_score,
            "hybrid": hybrid_score,
        }
    })

    # Decision logic
    if action_score >= 1:
        return QueryIntent.ACTION_REQUEST, metadata

    if hybrid_score >= 1 or (db_score >= 1 and doc_score >= 1):
        return QueryIntent.HYBRID_QUERY, metadata

    if memory_score >= 2:
        return QueryIntent.CONVERSATION_QUERY, metadata

    if doc_score > db_score:
        return QueryIntent.DOCUMENT_QUERY, metadata

    if db_score >= 1:
        return QueryIntent.DATABASE_QUERY, metadata

    if doc_score >= 1:
        return QueryIntent.DOCUMENT_QUERY, metadata

    return QueryIntent.GENERAL_QUERY, metadata


def should_use_rag(intent: str) -> bool:
    """Determine if RAG document retrieval should be performed."""
    return intent in (QueryIntent.DOCUMENT_QUERY, QueryIntent.HYBRID_QUERY, QueryIntent.GENERAL_QUERY)


def should_use_tools(intent: str) -> bool:
    """Determine if database tools should be called."""
    return intent in (QueryIntent.DATABASE_QUERY, QueryIntent.HYBRID_QUERY, QueryIntent.ACTION_REQUEST)


def requires_confirmation(intent: str, message: str) -> bool:
    """Determine if a write operation needs user confirmation."""
    if intent != QueryIntent.ACTION_REQUEST:
        return False
    # Check for bulk/company-wide operations
    bulk_patterns = [
        re.compile(r"\b(all|everyone|company.wide|all employees)\b", re.IGNORECASE),
        re.compile(r"\b(increase|decrease|update all|change all)\b", re.IGNORECASE),
    ]
    return any(p.search(message) for p in bulk_patterns)


def generate_auto_title(message: str) -> str:
    """Generate a meaningful conversation title from the first user message."""
    msg = message.strip()

    # Remove employee codes for cleaner titles
    clean = re.sub(r"\b[A-Z]{2,5}\d{2,6}\b", "Employee", msg, flags=re.IGNORECASE)

    # Trim to reasonable length
    if len(clean) <= 50:
        return clean.title()

    # Try to extract key topic
    topics = {
        "payroll": "Payroll Analysis",
        "attendance": "Attendance Review",
        "overtime": "Overtime Analysis",
        "absent": "Absence Analysis",
        "payslip": "Payslip Request",
        "salary": "Salary Review",
        "advance": "Advance Register",
        "form xxii": "Form XXII Register",
        "pf": "PF Compliance",
        "esi": "ESI Compliance",
        "leave policy": "Leave Policy",
        "department": "Department Summary",
        "update": "Record Update",
        "statutory": "Statutory Rules",
        "compliance": "Compliance Query",
    }

    msg_lower = msg.lower()
    for keyword, title in topics.items():
        if keyword in msg_lower:
            return title

    # Truncate at word boundary
    words = msg.split()
    title = " ".join(words[:6])
    return title[:50] + ("..." if len(msg) > 50 else "")
