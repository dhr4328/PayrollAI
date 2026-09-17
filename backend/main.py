# backend/main.py
"""
PayrollAI FastAPI Backend
Production-grade AI HR Copilot with RAG, Conversation Management & Vector Search.
"""
import sys
import os

# Make backend root importable for sub-packages (rag/, ai/, services/)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import employees, payroll, attendance, leaves, ai_chat, payslip_pdf, upload
from routers import conversations, documents  # NEW
import database


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("PayrollAI Backend starting...")
    # Initialize DB schema (creates all tables including new ones)
    try:
        database.init_db()
    except Exception as e:
        print(f"Error during DB initialization: {e}")

    # Load payroll Excel if present
    try:
        upload_path = os.path.join(os.path.dirname(__file__), "uploads", "master_employee.xlsx")
        if os.path.exists(upload_path):
            print(f"Loading custom master employee data from {upload_path}")
            database.load_data_from_excel(upload_path)
        else:
            print("No custom upload found. Database initialized (awaiting file upload).")
    except Exception as e:
        print(f"Error loading Excel: {e}")

    # Auto-ingest knowledge documents from knowledge_docs/ folder
    try:
        from rag.ingestion import ingest_knowledge_docs_folder
        count = ingest_knowledge_docs_folder()
        if count:
            print(f"Knowledge Base: Auto-ingested {count} document(s).")
    except Exception as e:
        print(f"Knowledge Base auto-ingestion error: {e}")

    yield
    print("PayrollAI Backend shutting down.")


app = FastAPI(
    title="PayrollAI API",
    description="AI-first Payroll & HR Management Platform — Advanced AI Copilot with RAG",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing routers (preserved) ──────────────────────────────────
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(payroll.router, prefix="/api/payroll", tags=["Payroll"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api/leaves", tags=["Leaves"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(payslip_pdf.router, prefix="/api/payslip", tags=["Payslip PDF"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])

# ── New routers ───────────────────────────────────────────────────
app.include_router(conversations.router, prefix="/api/ai/conversations", tags=["Conversations"])
app.include_router(documents.router, prefix="/api/ai/documents", tags=["Knowledge Base"])


@app.get("/")
async def root():
    return {
        "message": "PayrollAI API v2.0",
        "status": "running",
        "features": ["RAG", "Conversations", "Memory", "Citations", "Feedback"],
    }


@app.get("/health")
async def health():
    try:
        count = database.get_record_count()
    except Exception:
        count = 0
    return {"status": "healthy", "employee_count": count, "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
