"""
Analyze Route — POST /api/analyze, POST /api/suggest

Runs the LLM + code execution pipeline for user questions.
"""

import logging
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json

from models.schemas import AnalyzeRequest, AnalyzeResponse, QuestionResult, SuggestRequest, SuggestResponse
from services.llm_service import generate_chart_code, suggest_questions
from services.execution_service import execute_chart_code, _sanitize_question
from session_store import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_dataset(request: AnalyzeRequest):
    """
    Analyze a dataset by answering the given questions.
    Each question is passed through the LLM → code execution pipeline.
    """
    session = get_session(request.dataset_id)
    if not session:
        raise HTTPException(404, "Dataset not found. Please re-upload your file.")

    cleaned_df = session["cleaned_df"]
    column_info = session["column_info"]
    sample_rows = session["sample_rows"]

    # Filter empty questions
    questions = [q.strip() for q in request.questions if q and q.strip()]
    if not questions:
        raise HTTPException(400, "At least one non-empty question is required.")

    results: list[QuestionResult] = []

    for question in questions:
        # Sanitize question to prevent prompt injection
        sanitized_question = _sanitize_question(question)

        try:
            # Generate code + insight via LLM
            code, insight = await generate_chart_code(
                question=sanitized_question,
                column_info=column_info,
                sample_rows=sample_rows,
            )

            if not code:
                results.append(QuestionResult(
                    question=question,
                    status="failed",
                    error_message="LLM could not generate code for this question. Try rephrasing.",
                ))
                continue

            # Execute code in sandbox
            execution_result = execute_chart_code(code, cleaned_df)

            results.append(QuestionResult(
                question=question,
                chart_json=execution_result.get("chart_json"),
                chart_type=execution_result.get("chart_type"),
                insight=insight or "No insight generated.",
                status=execution_result.get("status", "failed"),
                error_message=execution_result.get("error_message"),
            ))

        except Exception as e:
            logger.error(f"Unexpected error processing question '{question}': {e}")
            results.append(QuestionResult(
                question=question,
                status="failed",
                error_message="An unexpected error occurred while processing this question.",
            ))

    # Store results in session
    session["analysis_results"] = [r.model_dump() for r in results]

    return AnalyzeResponse(
        dataset_id=request.dataset_id,
        results=results,
    )


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_dataset_questions(request: SuggestRequest):
    """
    Use AI to suggest 5 insightful questions based on the dataset schema.
    """
    session = get_session(request.dataset_id)
    if not session:
        raise HTTPException(404, "Dataset not found. Please re-upload your file.")

    column_info = session["column_info"]
    sample_rows = session["sample_rows"]

    try:
        questions = await suggest_questions(column_info, sample_rows)
        return SuggestResponse(questions=questions)
    except Exception as e:
        logger.error(f"Error suggesting questions: {e}")
        raise HTTPException(500, "Failed to generate question suggestions.")
