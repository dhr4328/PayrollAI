from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
import os
import json
import shutil
from datetime import datetime
import database

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
MASTER_EXCEL_PATH = os.path.join(UPLOAD_DIR, "master_employee.xlsx")
METADATA_PATH = os.path.join(UPLOAD_DIR, "metadata.json")

@router.get("/")
def read_all_employees():
    try:
        data = database.get_all_employees()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-master")
async def upload_master_file(file: UploadFile = File(...)):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed.")
    
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        # Save file to destination
        with open(MASTER_EXCEL_PATH, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Load data into database
        records_count = database.load_data_from_excel(MASTER_EXCEL_PATH)
        
        # Save metadata
        metadata = {
            "uploaded": True,
            "original_filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "record_count": records_count or 0
        }
        with open(METADATA_PATH, "w") as f:
            json.dump(metadata, f, indent=2)
            
        return metadata
    except Exception as e:
        if os.path.exists(MASTER_EXCEL_PATH):
            try:
                os.remove(MASTER_EXCEL_PATH)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {str(e)}")

@router.get("/upload-status")
def get_upload_status():
    if os.path.exists(METADATA_PATH) and os.path.exists(MASTER_EXCEL_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                metadata = json.load(f)
            return metadata
        except Exception:
            pass
    return {"uploaded": False, "original_filename": None, "upload_date": None, "record_count": 0}

@router.get("/download-current")
def download_current_file():
    if not os.path.exists(MASTER_EXCEL_PATH):
        raise HTTPException(status_code=404, detail="No custom master file has been uploaded yet.")
        
    return FileResponse(
        path=MASTER_EXCEL_PATH,
        filename="master_employee.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get("/{emp_code}")
def read_employee(emp_code: str):
    try:
        emp = database.get_employee(emp_code)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

