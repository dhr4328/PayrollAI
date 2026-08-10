# backend/main.py
"""
PayrollAI FastAPI Backend
Phase 1: Mock data mode (no database needed)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import employees, payroll, attendance, leaves, ai_chat, payslip_pdf, upload
import database
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("PayrollAI Backend starting...")
    # Initialize DB schema
    try:
        database.init_db()
        upload_path = os.path.join(os.path.dirname(__file__), "uploads", "master_employee.xlsx")
        if os.path.exists(upload_path):
            print(f"Loading custom master employee data from {upload_path}")
            database.load_data_from_excel(upload_path)
        else:
            print("No custom upload found. Database initialized (awaiting file upload).")
    except Exception as e:
        print(f"Error during backend initialization: {e}")
    yield
    print("PayrollAI Backend shutting down.")


app = FastAPI(
    title="PayrollAI API",
    description="AI-first Payroll & HR Management Platform",
    version="1.0.0",
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

# Routers
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(payroll.router, prefix="/api/payroll", tags=["Payroll"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(leaves.router, prefix="/api/leaves", tags=["Leaves"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(payslip_pdf.router, prefix="/api/payslip", tags=["Payslip PDF"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])


@app.get("/")
async def root():
    return {"message": "PayrollAI API v1.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "mock"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

