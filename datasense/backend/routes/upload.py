"""
Upload Route — POST /api/upload

Accepts CSV or Excel file, runs cleaning pipeline, stores session,
returns dataset preview and cleaning report.
"""

import io
import uuid
import logging
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from models.schemas import UploadResponse, CleaningReport, ColumnInfo
from services.cleaning_service import clean_dataset, get_column_info
from session_store import store_session

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

# Magic bytes for file type validation
CSV_MAGIC = None  # CSV has no magic bytes; rely on extension + parse attempt
XLSX_MAGIC = bytes([0x50, 0x4B, 0x03, 0x04])  # PK zip header (OOXML)
XLS_MAGIC = bytes([0xD0, 0xCF, 0x11, 0xE0])   # Compound Document (old xls)


def _validate_file_type(content: bytes, filename: str) -> str:
    """Validate file type by magic bytes AND extension. Returns 'csv' or 'excel'."""
    ext = filename.lower().split(".")[-1]

    if ext == "csv":
        # CSV has no magic bytes; just verify it's text-parseable
        try:
            content[:1024].decode("utf-8")
        except UnicodeDecodeError:
            try:
                content[:1024].decode("latin-1")
            except Exception:
                raise HTTPException(400, "File does not appear to be a valid CSV.")
        return "csv"

    elif ext in ("xlsx", "xls"):
        if ext == "xlsx" and content[:4] != XLSX_MAGIC:
            raise HTTPException(400, "File does not appear to be a valid Excel (.xlsx) file.")
        if ext == "xls" and content[:4] != XLS_MAGIC:
            raise HTTPException(400, "File does not appear to be a valid Excel (.xls) file.")
        return "excel"

    else:
        raise HTTPException(400, "Only CSV and Excel (.xlsx, .xls) files are supported.")


def _load_dataframe(content: bytes, file_type: str, filename: str) -> pd.DataFrame:
    """Load DataFrame from file content, with encoding fallback for CSV."""
    if file_type == "csv":
        for encoding in ["utf-8", "latin-1", "cp1252"]:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                return df
            except UnicodeDecodeError:
                continue
        raise HTTPException(422, "Could not decode CSV file. Try re-saving with UTF-8 encoding.")

    else:  # excel
        try:
            df = pd.read_excel(io.BytesIO(content), sheet_name=0, engine="openpyxl")
            return df
        except Exception:
            try:
                df = pd.read_excel(io.BytesIO(content), sheet_name=0, engine="xlrd")
                return df
            except Exception as e:
                raise HTTPException(422, f"Could not read Excel file: {str(e)}")


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file.
    Returns dataset preview + cleaning report.
    """
    # Read file content
    content = await file.read()

    # Validate size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            413,
            f"File exceeds 50MB limit. File size: {len(content) / 1024 / 1024:.1f}MB"
        )

    if not file.filename:
        raise HTTPException(400, "No filename provided.")

    # Validate type (magic bytes + extension)
    file_type = _validate_file_type(content, file.filename)

    # Load DataFrame
    df = _load_dataframe(content, file_type, file.filename)

    # Handle empty dataset
    if df.empty:
        raise HTTPException(422, "The uploaded dataset appears to be empty.")

    if df.shape[1] == 0:
        raise HTTPException(422, "The dataset has no columns.")

    # Run cleaning pipeline
    cleaned_df, cleaning_report = clean_dataset(df)

    # Build column info
    column_info = get_column_info(cleaned_df)

    # Get sample rows (first 5, serializable)
    sample_rows = cleaned_df.head(5).fillna("").astype(str).to_dict(orient="records")

    # Store session
    dataset_id = str(uuid.uuid4())
    store_session(dataset_id, {
        "original_df": df,
        "cleaned_df": cleaned_df,
        "filename": file.filename,
        "cleaning_report": cleaning_report,
        "column_info": column_info,
        "sample_rows": sample_rows,
        "analysis_results": [],
    })

    logger.info(f"Uploaded dataset {dataset_id}: {cleaned_df.shape}, type={file_type}")

    return UploadResponse(
        dataset_id=dataset_id,
        filename=file.filename,
        shape={"rows": cleaned_df.shape[0], "columns": cleaned_df.shape[1]},
        columns=[ColumnInfo(**c) for c in column_info],
        sample_rows=sample_rows,
        cleaning_report=CleaningReport(**cleaning_report),
    )
