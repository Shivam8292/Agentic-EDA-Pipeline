"""
Pydantic schemas / data models for DataSense API.
"""

from typing import Any, Optional
from pydantic import BaseModel


# ─────────────────────────────────────────────
# Upload / Session
# ─────────────────────────────────────────────

class CleaningReport(BaseModel):
    nulls_filled: int
    duplicates_removed: int
    type_corrections: list[str]
    outliers_flagged: int


class ColumnInfo(BaseModel):
    name: str
    dtype: str         # "numeric" | "categorical" | "datetime" | "other"
    null_count: int
    null_pct: float


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    shape: dict[str, int]          # {"rows": N, "columns": M}
    columns: list[ColumnInfo]
    sample_rows: list[dict[str, Any]]
    cleaning_report: CleaningReport


# ─────────────────────────────────────────────
# Analysis
# ─────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    dataset_id: str
    questions: list[str]


class QuestionResult(BaseModel):
    question: str
    chart_json: Optional[str] = None
    chart_type: Optional[str] = None
    insight: Optional[str] = None
    status: str   # "success" | "failed"
    error_message: Optional[str] = None


class AnalyzeResponse(BaseModel):
    dataset_id: str
    results: list[QuestionResult]


# ─────────────────────────────────────────────
# Suggest Questions
# ─────────────────────────────────────────────

class SuggestRequest(BaseModel):
    dataset_id: str


class SuggestResponse(BaseModel):
    questions: list[str]
