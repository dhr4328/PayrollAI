"""
backend/ai/tool_executor.py

Safe tool execution with:
- READ/WRITE categorization
- Execution logging to ai_tool_executions table
- Write impact preview generation
- Execution time tracking
- Structured error handling
"""

import os
import uuid
import json
import time
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "payroll.db")

# Import database functions
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import database

# Tool category registry
TOOL_CATEGORIES = {
    # READ tools
    "get_employee": "read",
    "get_all_employees": "read",
    "get_attendance_summary": "read",
    "get_absent_employees": "read",
    "get_overtime_report": "read",
    "get_payroll_summary": "read",
    "get_department_summary": "read",
    "get_statutory_rules": "read",
    "generate_payslip_pdf_link": "read",
    "search_company_policy": "read",
    "search_conversation": "read",
    # WRITE tools
    "update_all_employees_records": "write",
    "update_employee_record": "write",
}


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _log_execution(
    tool_name: str,
    arguments: Dict[str, Any],
    result: Any,
    status: str,
    execution_time_ms: int,
    conversation_id: Optional[str] = None,
    message_id: Optional[str] = None,
    error: Optional[str] = None,
) -> str:
    """Log tool execution to ai_tool_executions table."""
    exec_id = str(uuid.uuid4())
    category = TOOL_CATEGORIES.get(tool_name, "read")
    try:
        conn = _get_db()
        conn.execute(
            """
            INSERT INTO ai_tool_executions
                (id, conversation_id, message_id, tool_name, tool_category,
                 arguments_json, result_json, status, execution_time_ms, created_at, error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                exec_id, conversation_id, message_id, tool_name, category,
                json.dumps(arguments, default=str),
                json.dumps(result, default=str) if result is not None else None,
                status, execution_time_ms,
                datetime.utcnow().isoformat(), error,
            ),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"ToolExecutor: Failed to log execution ({e})")
    return exec_id


def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    conversation_id: Optional[str] = None,
    message_id: Optional[str] = None,
) -> Tuple[str, Dict[str, Any]]:
    """
    Execute a named tool safely with logging.
    Returns (result_json_string, execution_info_dict).
    """
    start_time = time.time()
    result = None
    status = "success"
    error = None

    try:
        result = _dispatch(tool_name, arguments)
    except Exception as e:
        status = "error"
        error = str(e)
        result = {"error": f"Tool execution failed: {e}"}
        print(f"ToolExecutor: {tool_name} failed: {e}")

    exec_time_ms = int((time.time() - start_time) * 1000)
    exec_id = _log_execution(
        tool_name, arguments, result, status,
        exec_time_ms, conversation_id, message_id, error,
    )

    result_str = json.dumps(result, default=str)
    return result_str, {
        "tool_name": tool_name,
        "category": TOOL_CATEGORIES.get(tool_name, "read"),
        "execution_time_ms": exec_time_ms,
        "status": status,
        "exec_id": exec_id,
    }


def _dispatch(name: str, arguments: Dict[str, Any]) -> Any:
    """Dispatch tool call to actual implementation."""
    if name == "get_employee":
        emp_code = str(arguments.get("emp_code", "")).strip().upper()
        result = database.get_employee(emp_code)
        return result if result else {"error": f"Employee {emp_code} not found."}

    elif name == "get_all_employees":
        return database.get_all_employees(
            department=arguments.get("department"),
            category=arguments.get("category"),
        )

    elif name == "get_attendance_summary":
        return database.get_attendance_summary()

    elif name == "get_absent_employees":
        return database.get_absent_employees()

    elif name == "get_overtime_report":
        return database.get_overtime_report(arguments.get("department"))

    elif name == "get_payroll_summary":
        return database.get_payroll_summary()

    elif name == "get_department_summary":
        return database.get_department_summary()

    elif name == "update_all_employees_records":
        updates = arguments.get("updates", {})
        count = database.update_all_employees_records(updates)
        summary = database.get_payroll_summary()
        return {
            "message": f"Updated {count} employee records company-wide.",
            "updated_count": count,
            "company_payroll_summary": summary,
        }

    elif name == "update_employee_record":
        emp_code = str(arguments.get("emp_code", "")).strip().upper()
        updates = arguments.get("updates", {})
        database.update_employee_record(emp_code, updates)
        return database.get_employee(emp_code)

    elif name == "get_statutory_rules":
        return {
            "provident_fund": {
                "employee_rate": "12% of basic (capped at ₹15,000)",
                "employer_rate": "13% of basic (capped at ₹15,000)",
            },
            "esi": {
                "employee_rate": "0.75% of gross (if gross ≤ ₹21,000)",
                "employer_rate": "3.25% of gross (if gross ≤ ₹21,000)",
            },
            "professional_tax": {
                "rate": "₹200/month if gross > ₹12,000",
            },
            "overtime": {
                "formula": "Extra Pay = (Per Day Rate / 8) × Extra Hours",
            },
        }

    elif name == "generate_payslip_pdf_link":
        emp_code = str(arguments.get("emp_code", "")).strip().upper()
        emp = database.get_employee(emp_code)
        if not emp:
            return {"error": f"Employee {emp_code} not found."}
        base_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        return {
            "emp_code": emp_code,
            "employee_name": emp.get("employee_name", ""),
            "download_url": f"{base_url}/api/payslip/pdf/{emp_code}",
            "bulk_zip_url": f"{base_url}/api/payslip/bulk-zip",
        }

    elif name == "search_company_policy":
        query = str(arguments.get("query", ""))
        if not query:
            return {"results": [], "message": "No query provided."}
        try:
            from rag.retriever import retrieve_documents
            results = retrieve_documents(query, top_k=3)
            return {
                "results": [
                    {
                        "document": r.get("metadata", {}).get("document_name", ""),
                        "excerpt": r.get("text", "")[:300],
                        "score": r.get("score", 0),
                    }
                    for r in results
                ],
                "count": len(results),
            }
        except Exception as e:
            return {"error": str(e), "results": []}

    else:
        return {"error": f"Unknown tool: {name}"}


def generate_write_preview(tool_name: str, arguments: Dict[str, Any]) -> Optional[str]:
    """
    Generate a human-readable impact preview for write operations.
    Returns None for read operations.
    """
    category = TOOL_CATEGORIES.get(tool_name, "read")
    if category != "write":
        return None

    if tool_name == "update_all_employees_records":
        count = database.get_record_count()
        updates = arguments.get("updates", {})
        field_str = ", ".join(f"{k}={v}" for k, v in updates.items())
        return (
            f"⚠️ **Impact Preview — Company-Wide Update**\n\n"
            f"- **Affected employees:** {count}\n"
            f"- **Changes:** {field_str}\n"
            f"- **Action:** Update all {count} employee records\n\n"
            f"This will recalculate payroll for all employees. "
            f"Reply **confirm** to proceed or **cancel** to abort."
        )

    elif tool_name == "update_employee_record":
        emp_code = str(arguments.get("emp_code", "")).upper()
        emp = database.get_employee(emp_code)
        if not emp:
            return None
        updates = arguments.get("updates", {})
        field_str = ", ".join(f"{k}={v}" for k, v in updates.items())
        return (
            f"⚠️ **Impact Preview — Employee Update**\n\n"
            f"- **Employee:** {emp.get('employee_name', emp_code)} ({emp_code})\n"
            f"- **Changes:** {field_str}\n\n"
            f"Reply **confirm** to proceed."
        )

    return None
