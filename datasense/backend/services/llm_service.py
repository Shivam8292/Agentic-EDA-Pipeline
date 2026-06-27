"""
LLM Service — Groq (Llama 3 70B) via groq SDK.

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
import asyncio

from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Groq client
_api_key = os.getenv("GROQ_API_KEY", "")
_client: Optional[AsyncGroq] = None

if _api_key:
    _client = AsyncGroq(api_key=_api_key)

GROQ_MODEL = "llama-3.3-70b-versatile"

CHART_COLORS = ["#6366F1", "#A78BFA", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316"]

SYSTEM_PROMPT = """You are a senior Python data analyst.
Always follow these exact instructions:
1. Write Python code using pandas and plotly to answer the user's question visually.
2. The code MUST create a plotly figure stored in a variable named `fig`.
3. Use dark theme for the chart: paper_bgcolor='#111118', plot_bgcolor='#0A0A0F', font color white.
4. Use these chart colors: {chart_colors}
5. The dataframe is already available as variable `df`. Do NOT load any data, just use `df`.
6. Handle missing columns gracefully.
7. After the code block, write a 3-4 sentence professional analyst insight about what the chart reveals, prefixed by "INSIGHT:".

Respond in EXACTLY this format (nothing before ```python, nothing between ``` and INSIGHT:):
```python
[your pandas + plotly code here, ending with fig assignment]
```
INSIGHT: [your 3-4 sentence analyst narrative here]
"""

SUGGEST_QUESTIONS_SYSTEM = """You are a data analyst. 
Generate exactly 5 insightful, specific, and answerable questions that a business analyst would ask about this dataset.
These questions MUST be answerable with a chart (bar, line, scatter, pie, heatmap, or box plot).

Respond with ONLY a JSON array of 5 question strings. No explanations, no markdown, just the JSON array.
Example: ["question 1", "question 2", "question 3", "question 4", "question 5"]
"""


def _build_column_schema(column_info: list[dict]) -> str:
    """Format column info into a readable schema string."""
    lines = []
    for col in column_info:
        lines.append(f"  - {col['name']} ({col['dtype']})")
    return "\n".join(lines)


def _build_sample_rows(sample_rows: list[dict]) -> str:
    """Format sample rows for the prompt (max 3 rows)."""
    if not sample_rows:
        return "No sample data available."
    rows = sample_rows[:3]
    lines = [str(row) for row in rows]
    return "\n".join(lines)


def _extract_code_and_insight(response_text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Parse LLM response to extract Python code block and insight text.
    Returns (code, insight) — either may be None if parsing fails.
    """
    # Extract code block (handle ```python or just ```)
    code_match = re.search(r"```(?:python)?\s*(.*?)```", response_text, re.DOTALL | re.IGNORECASE)
    code = code_match.group(1).strip() if code_match else None

    # Extract insight (everything after INSIGHT: label)
    insight_match = re.search(r"INSIGHT:\s*(.+)", response_text, re.DOTALL | re.IGNORECASE)
    insight = insight_match.group(1).strip() if insight_match else None

    # If insight ends with a ``` block, trim it
    if insight:
        insight = insight.split("```")[0].strip()

    return code, insight


async def generate_chart_code(
    question: str,
    column_info: list[dict],
    sample_rows: list[dict],
) -> tuple[Optional[str], Optional[str]]:
    """
    Call Groq to generate plotly code and insight for a given question.
    Returns (code, insight). On failure, returns (None, None).
    """
    if not _client:
        logger.error("Groq client not initialized — GROQ_API_KEY not set")
        return None, None

    column_schema = _build_column_schema(column_info)
    sample_str = _build_sample_rows(sample_rows)
    
    formatted_system = SYSTEM_PROMPT.format(chart_colors=json.dumps(CHART_COLORS))
    
    user_prompt = f"""Dataset Schema:\n{column_schema}\n\nSample Data:\n{sample_str}\n\nQuestion: "{question}"\n\nRemember: Output ONLY the ```python ... ``` block followed by INSIGHT: ..."""

    max_retries = 3
    base_delay = 2
    for attempt in range(max_retries):
        try:
            response = await _client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": formatted_system},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=2048,
            )
            
            response_text = response.choices[0].message.content
            code, insight = _extract_code_and_insight(response_text)

            if code:
                logger.info(f"LLM generated code successfully for: {question[:50]}")
                return code, insight
            else:
                logger.warning(f"Attempt {attempt + 1}: could not parse LLM response. Response: {response_text[:100]}... Retrying...")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Groq API error on attempt {attempt + 1}: {error_msg}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.info(f"Rate limited. Waiting {delay}s before retrying...")
                    await asyncio.sleep(delay)
                    continue
            # If it's not a rate limit error or we ran out of retries, we stop trying

    return None, None


async def suggest_questions(
    column_info: list[dict],
    sample_rows: list[dict],
) -> list[str]:
    """
    Use Groq to suggest 5 insightful questions based on dataset schema.
    Returns list of question strings (may be empty on failure).
    """
    if not _client:
        return []

    column_schema = _build_column_schema(column_info)
    sample_str = _build_sample_rows(sample_rows)

    user_prompt = f"""Dataset Schema:\n{column_schema}\n\nSample Data:\n{sample_str}\n\nOutput only a raw JSON array of 5 questions."""

    max_retries = 3
    base_delay = 2
    for attempt in range(max_retries):
        try:
            response = await _client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": SUGGEST_QUESTIONS_SYSTEM},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=512,
            )
            
            text = response.choices[0].message.content.strip()

            # Try to parse JSON array (handle ```json wrapping)
            json_match = re.search(r"\[.*\]", text, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group(0))
                return [q for q in questions if isinstance(q, str)][:5]
            
            return []

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error suggesting questions on attempt {attempt + 1}: {error_msg}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.info(f"Rate limited in suggest. Waiting {delay}s before retrying...")
                    await asyncio.sleep(delay)
                    continue
            return []
            
    return []
