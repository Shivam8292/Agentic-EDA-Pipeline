"""
Export Route — GET /api/export/{pdf,ppt,excel}

Generates downloadable files from session data.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from services.export_service import generate_pdf, generate_ppt, generate_excel
from session_store import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/export/pdf")
async def export_pdf(dataset_id: str):
    """Generate and download a PDF analysis report."""
    session = get_session(dataset_id)
    if not session:
        raise HTTPException(404, "Dataset not found. Please re-upload and re-analyze.")

    analysis_results = session.get("analysis_results", [])
    if not analysis_results:
        raise HTTPException(400, "No analysis results found. Please run analysis first.")

    try:
        pdf_bytes = generate_pdf(
            filename=session["filename"],
            analysis_results=analysis_results,
            cleaning_report=session["cleaning_report"],
        )
        filename = session["filename"].rsplit(".", 1)[0] + "_datasense_report.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(500, f"Failed to generate PDF: {str(e)}")


@router.get("/export/ppt")
async def export_ppt(dataset_id: str):
    """Generate and download a PowerPoint presentation."""
    session = get_session(dataset_id)
    if not session:
        raise HTTPException(404, "Dataset not found. Please re-upload and re-analyze.")

    analysis_results = session.get("analysis_results", [])
    if not analysis_results:
        raise HTTPException(400, "No analysis results found. Please run analysis first.")

    try:
        ppt_bytes = generate_ppt(
            filename=session["filename"],
            analysis_results=analysis_results,
        )
        filename = session["filename"].rsplit(".", 1)[0] + "_datasense_report.pptx"
        return Response(
            content=ppt_bytes,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"PPT generation error: {e}")
        raise HTTPException(500, f"Failed to generate PowerPoint: {str(e)}")


@router.get("/export/excel")
async def export_excel(dataset_id: str):
    """Generate and download a cleaned Excel file with stats."""
    session = get_session(dataset_id)
    if not session:
        raise HTTPException(404, "Dataset not found. Please re-upload.")

    try:
        excel_bytes = generate_excel(
            cleaned_df=session["cleaned_df"],
            cleaning_report=session["cleaning_report"],
        )
        filename = session["filename"].rsplit(".", 1)[0] + "_cleaned.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"Excel generation error: {e}")
        raise HTTPException(500, f"Failed to generate Excel: {str(e)}")
