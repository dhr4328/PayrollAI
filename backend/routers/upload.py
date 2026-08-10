# backend/routers/upload.py
"""
Upload router — handles Excel/CSV payroll file uploads.

Endpoints:
  POST /api/upload/preview   → analyse headers, return column mapping for UI confirmation
  POST /api/upload/confirm   → accept confirmed mapping, import into DB, save file
  GET  /api/upload/status    → { hasData, rowCount, uploadedFile }
"""

import io
import os
import json
import shutil
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse

import database
from smart_column_mapper import detect_columns, mapping_to_rename_dict, REQUIRED_FIELDS

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
SAVED_FILE = os.path.join(UPLOAD_DIR, "master_employee.xlsx")


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _read_file_to_df(content: bytes, filename: str) -> pd.DataFrame:
    """Read uploaded bytes into a pandas DataFrame, auto-detecting the header row."""
    name = filename.lower()
    if name.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False)
        df = df.dropna(how="all").reset_index(drop=True)
        return df
    elif name.endswith(".xlsx") or name.endswith(".xls"):
        # Keywords that indicate a row contains real column headers
        HEADER_KEYWORDS = {
            "emp", "name", "salary", "department", "category", "doj", "bank",
            "uan", "esic", "aadhar", "pf", "net", "pay", "rate", "present",
            "absent", "deduction", "earn", "code", "floor", "unit",
        }

        # Read raw with no header to scan rows
        raw = pd.read_excel(io.BytesIO(content), header=None, dtype=str, keep_default_na=False)

        header_row_idx = 0  # default: first row is header
        best_score = 0

        for row_idx in range(min(10, len(raw))):
            row_vals = [str(v).lower() for v in raw.iloc[row_idx].values]
            score = sum(
                1 for v in row_vals
                if any(kw in v for kw in HEADER_KEYWORDS)
            )
            if score > best_score:
                best_score = score
                header_row_idx = row_idx

        # Re-read with detected header row
        df = pd.read_excel(
            io.BytesIO(content),
            header=header_row_idx,
            dtype=str,
            keep_default_na=False,
        )
        df = df.dropna(how="all").reset_index(drop=True)
        return df
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload .xlsx or .csv")



def _apply_mapping_and_import(df: pd.DataFrame, confirmed_mapping: list[dict]):
    """
    Given a DataFrame and the user-confirmed column mapping,
    rename columns → insert into DB (full replace).
    """
    rename_dict = mapping_to_rename_dict(confirmed_mapping)
    if not rename_dict:
        raise HTTPException(status_code=400, detail="No valid column mappings provided.")

    # Check required fields
    mapped_fields = set(rename_dict.values())
    missing = REQUIRED_FIELDS - mapped_fields
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Required fields not mapped: {', '.join(missing)}"
        )

    # Rename columns to canonical names
    df = df.rename(columns=rename_dict)

    # Filter out empty names and summary / total rows
    if "employee_name" in df.columns:
        df = df[df["employee_name"].notna() & (df["employee_name"].astype(str).str.strip() != "")]
        df = df[~df["employee_name"].astype(str).str.strip().str.lower().isin(["total", "totals", "grand total", "summary"])]

    if "per_day_rate" in df.columns:
        df = df[~df["per_day_rate"].astype(str).str.strip().str.lower().isin(["total", "totals"])]

    # Auto-generate or sanitize emp_code if missing or empty
    if "emp_code" not in df.columns:
        df["emp_code"] = [f"EMP{i+1:03d}" for i in range(len(df))]
    else:
        codes = []
        for i, row in df.iterrows():
            code = str(row.get("emp_code") or "").strip()
            if not code or code == "nan":
                code = f"EMP{i+1:03d}"
            codes.append(code)
        df["emp_code"] = codes

    # Load into DB
    database.load_data_from_dataframe(df)



# ─────────────────────────────────────────────
# GET /status
# ─────────────────────────────────────────────
@router.get("/status")
def upload_status():
    """Check whether payroll data has been loaded."""
    count = database.get_record_count()
    uploaded_file = None
    if os.path.exists(SAVED_FILE):
        uploaded_file = os.path.basename(SAVED_FILE)
    return {
        "hasData": count > 0,
        "rowCount": count,
        "uploadedFile": uploaded_file,
    }




# ─────────────────────────────────────────────
# POST /direct-import (Used by AI Chat Box)
# ─────────────────────────────────────────────
@router.post("/direct-import")
async def upload_direct_import(file: UploadFile = File(...)):
    """
    Accept an uploaded Excel or CSV file directly from the AI Chat box,
    auto-detect column headers, import records into the DB, and save the file.
    """
    content = await file.read()
    filename = file.filename or "uploaded_payroll.xlsx"

    try:
        df = _read_file_to_df(content, filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="File appears to be empty.")

    headers = [str(c) for c in df.columns]
    mapping = detect_columns(headers)

    # Filter mapped fields
    confirmed_mapping = [m for m in mapping if m.get("mapped_field")]

    # Import into DB
    try:
        _apply_mapping_and_import(df, confirmed_mapping)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")

    # Save file to disk
    _ensure_upload_dir()
    try:
        with open(SAVED_FILE, "wb") as f:
            f.write(content)
    except Exception as e:
        print(f"Warning: Could not save uploaded file: {e}")

    count = database.get_record_count()
    mapped_names = [f"{m['source_col']} → {m['mapped_field']}" for m in confirmed_mapping]

    return {
        "success": True,
        "filename": filename,
        "rowCount": count,
        "mappedColumnsCount": len(confirmed_mapping),
        "mappedColumns": mapped_names[:8],
        "message": f"Successfully imported **{filename}** with **{count} employee records**.",
    }


# ─────────────────────────────────────────────
# POST /reset
# ─────────────────────────────────────────────
@router.post("/reset")
def reset_data():
    """Clear all loaded employee and payroll data from the database."""
    if os.path.exists(SAVED_FILE):
        try:
            os.remove(SAVED_FILE)
        except Exception:
            pass
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM payroll_records")
    cursor.execute("DELETE FROM employees")
    conn.commit()
    conn.close()
    return {"success": True, "message": "All data cleared successfully.", "rowCount": 0}




# ─────────────────────────────────────────────
# POST /preview
# ─────────────────────────────────────────────
@router.post("/preview")
async def upload_preview(file: UploadFile = File(...)):
    """
    Accept an uploaded file, detect its column headers, and return:
    - A sample of the first 5 data rows
    - The auto-detected column mapping with confidence levels
    """
    content = await file.read()

    try:
        df = _read_file_to_df(content, file.filename or "upload.xlsx")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="File appears to be empty.")

    headers = [str(c) for c in df.columns]
    mapping = detect_columns(headers)

    # First 5 rows as list of lists for the preview table
    sample = df.head(5).values.tolist()

    return {
        "filename": file.filename,
        "totalRows": len(df),
        "headers": headers,
        "mapping": mapping,
        "sample": [[str(v) for v in row] for row in sample],
    }


# ─────────────────────────────────────────────
# POST /confirm
# ─────────────────────────────────────────────
@router.post("/confirm")
async def upload_confirm(
    file: UploadFile = File(...),
    mapping_json: str = Form(...),
):
    """
    Accept the uploaded file + user-confirmed column mapping JSON,
    import into the DB (replacing existing data), and save the file.

    mapping_json: JSON array of {source_col, mapped_field} objects
    """
    content = await file.read()

    try:
        confirmed_mapping: list[dict] = json.loads(mapping_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON.")

    try:
        df = _read_file_to_df(content, file.filename or "upload.xlsx")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {e}")

    # Import into DB
    try:
        _apply_mapping_and_import(df, confirmed_mapping)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")

    # Save file for persistence
    _ensure_upload_dir()
    try:
        save_path = SAVED_FILE
        with open(save_path, "wb") as f:
            f.write(content)
    except Exception as e:
        # Not fatal — DB already updated
        print(f"Warning: Could not save uploaded file: {e}")

    count = database.get_record_count()
    return {
        "success": True,
        "message": f"Successfully imported {count} employee records.",
        "rowCount": count,
    }
