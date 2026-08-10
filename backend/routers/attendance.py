from fastapi import APIRouter, HTTPException
from typing import Optional
import database

router = APIRouter()

@router.get("/summary")
def get_attendance_summary():
    try:
        return database.get_attendance_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/absent")
def get_absent_employees():
    try:
        return database.get_absent_employees()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overtime")
def get_overtime_report(department: Optional[str] = None):
    try:
        return database.get_overtime_report(department)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
