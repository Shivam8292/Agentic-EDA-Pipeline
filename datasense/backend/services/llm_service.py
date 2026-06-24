"""
LLM Service — Google Gemini 1.5 Flash Integration.

Handles:
- Building prompts from dataset schema + user question
- Parsing LLM responses (code block + INSIGHT section)
- Retry logic on malformed responses
- Suggesting questions from dataset schema
"""

import os
import re
import json
import logging
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Gemini client
_api_key = os.getenv("GEMINI_API_KEY", "")
if _api_key:
    genai.configure(api_key=_api_key)

CHART_COLORS = ["#6366F1", "#A78BFA", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316"]

ANALYSIS_PROMPT_TEMPLATE = """You are a senior data analyst. You have access to a dataset with the following schema:

Column Names and Types:
{column_schema}

Sample data (first 3 rows):
{sample_rows}

The user asks: "{question}"

Your task:
1. Write Python code using pandas and plotly to answer this question visually.
2. The code must create a plotly figure stored in variable `fig`.
3. Use dark theme for the chart: paper_bgcolor='#111118', plot_bgcolor='#0A0A0F', font color white.
4. Use these chart colors: {chart_colors}
5. The dataframe is available as variable `df`.
6. Keep the code concise and focused.
7. Handle potential errors (e.g., missing columns) gracefully in the code.
8. After the code block, write a 3-4 sentence professional analyst insight about what the chart reveals.

Respond in EXACTLY this format (nothing before ```python, nothing between ``` and INSIGHT:):
```python
[your pandas + plotly code here, ending with fig assignment]
```
INSIGHT: [your 3-4 sentence analyst narrative here]
"""

SUGGEST_QUESTIONS_PROMPT = """You are a data analyst. You have a dataset with the following columns:

{column_schema}

Sample data (first 3 rows):
{sample_rows}

Generate exactly 5 insightful, specific, and answerable questions that a business analyst would ask about this dataset.
These questions should be answerable with a chart (bar, line, scatter, pie, heatmap, or box plot).

Respond with ONLY a JSON array of 5 question strings. No explanations, no numbering.
Example: ["question 1", "question 2", "question 3", "question 4", "question 5"]
"""


def _build_column_schema(column_info: list[dict]) -> str:
    """Format column info into a readable schema string."""
    lines = []
    for col in column_info:
        lines.append(f"  - {col['name']} ({col['dtype']})")
    return "\n".join(lines)


def _build_sample_rows(sample_rows: list[dict]) -> str:
    """Format sample rows for the prompt."""
    if not sample_rows:
        return "No sample data available."
    # Take max 3 rows
    rows = sample_rows[:3]
    lines = [str(row) for row in rows]
    return "\n".join(lines)


def _extract_code_and_insight(response_text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Parse LLM response to extract Python code block and insight text.
    Returns (code, insight) — either may be None if parsing fails.
    """
    # Extract code block
    code_match = re.search(r"```python\s*(.*?)```", response_text, re.DOTALL)
    code = code_match.group(1).strip() if code_match else None

    # Extract insight
    insight_match = re.search(r"INSIGHT:\s*(.+)", response_text, re.DOTALL)
    insight = insight_match.group(1).strip() if insight_match else None

    return code, insight


async def generate_chart_code(
    question: str,
    column_info: list[dict],
    sample_rows: list[dict],
) -> tuple[Optional[str], Optional[str]]:
    """
    Call Gemini to generate plotly code and insight for a given question.
    Returns (code, insight). On failure, returns (None, None).
    """
    if not _api_key:
        logger.error("GEMINI_API_KEY not set")
        return None, None

    column_schema = _build_column_schema(column_info)
    sample_str = _build_sample_rows(sample_rows)

    prompt = ANALYSIS_PROMPT_TEMPLATE.format(
        column_schema=column_schema,
        sample_rows=sample_str,
        question=question,
        chart_colors=json.dumps(CHART_COLORS),
    )

    model = genai.GenerativeModel("gemini-1.5-flash")

    for attempt in range(2):  # retry once if malformed
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                ),
            )
            response_text = response.text
            code, insight = _extract_code_and_insight(response_text)

            if code:  # at least code must be present
                return code, insight
            else:
                logger.warning(f"Attempt {attempt + 1}: could not parse LLM response. Retrying...")
        except Exception as e:
            logger.error(f"Gemini API error on attempt {attempt + 1}: {e}")

    return None, None


async def suggest_questions(
    column_info: list[dict],
    sample_rows: list[dict],
) -> list[str]:
    """
    Use Gemini to suggest 5 insightful questions based on dataset schema.
    Returns list of question strings (may be empty on failure).
    """
    if not _api_key:
        return []

    column_schema = _build_column_schema(column_info)
    sample_str = _build_sample_rows(sample_rows)

    prompt = SUGGEST_QUESTIONS_PROMPT.format(
        column_schema=column_schema,
        sample_rows=sample_str,
    )

    model = genai.GenerativeModel("gemini-1.5-flash")

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=512,
            ),
        )
        text = response.text.strip()
        # Try to parse JSON array
        # Sometimes Gemini wraps it in ```json ... ```
        json_match = re.search(r"\[.*\]", text, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group(0))
            return [q for q in questions if isinstance(q, str)][:5]
    except Exception as e:
        logger.error(f"Error suggesting questions: {e}")

    return []
