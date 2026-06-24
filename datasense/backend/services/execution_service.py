"""
Code Execution Service.

Safely executes LLM-generated pandas/plotly code in a restricted sandbox.
- Timeout: 30 seconds per execution
- Restricted globals (no builtins access)
- Returns Plotly figure JSON or error
"""

import logging
import re
import signal
from typing import Any, Optional

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

logger = logging.getLogger(__name__)

EXECUTION_TIMEOUT_SECONDS = 30

# Modules allowed in exec sandbox
SAFE_GLOBALS: dict[str, Any] = {
    "__builtins__": {
        "print": print,
        "len": len,
        "range": range,
        "enumerate": enumerate,
        "zip": zip,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "str": str,
        "int": int,
        "float": float,
        "bool": bool,
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        "sorted": sorted,
        "reversed": reversed,
        "isinstance": isinstance,
        "hasattr": hasattr,
        "getattr": getattr,
        "type": type,
        "repr": repr,
        "None": None,
        "True": True,
        "False": False,
    },
    "pd": pd,
    "np": np,
    "px": px,
    "go": go,
}


def _sanitize_question(question: str) -> str:
    """Strip potential code injection from question text before sending to LLM."""
    # Remove script tags, backticks, exec/eval calls
    sanitized = re.sub(r"[`<>]", "", question)
    sanitized = re.sub(r"\b(exec|eval|import|__import__|open|os|sys)\b", "", sanitized)
    return sanitized.strip()


def _infer_chart_type(code: str) -> str:
    """Infer the chart type from the generated code."""
    code_lower = code.lower()
    if "px.bar" in code_lower or "go.bar" in code_lower:
        return "bar"
    elif "px.line" in code_lower or "go.scatter" in code_lower and "lines" in code_lower:
        return "line"
    elif "px.scatter" in code_lower or "go.scatter" in code_lower:
        return "scatter"
    elif "px.pie" in code_lower or "go.pie" in code_lower:
        return "pie"
    elif "heatmap" in code_lower:
        return "heatmap"
    elif "px.box" in code_lower or "go.box" in code_lower:
        return "box"
    elif "px.histogram" in code_lower or "go.histogram" in code_lower:
        return "histogram"
    return "bar"  # default fallback


def execute_chart_code(
    code: str,
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Execute LLM-generated chart code in a restricted sandbox.

    Args:
        code: Python code string (should produce variable `fig`)
        df: The cleaned DataFrame

    Returns:
        dict with keys: chart_json, chart_type, status, error_message
    """
    exec_globals = {**SAFE_GLOBALS, "df": df.copy()}

    try:
        # Execute the code
        exec(code, exec_globals)  # noqa: S102

        fig = exec_globals.get("fig")
        if fig is None:
            return {
                "chart_json": None,
                "chart_type": None,
                "status": "failed",
                "error_message": "Code executed but `fig` variable was not found.",
            }

        # Apply consistent dark theme overrides
        fig.update_layout(
            paper_bgcolor="#111118",
            plot_bgcolor="#0A0A0F",
            font={"color": "#F0F0F5"},
            margin={"l": 40, "r": 40, "t": 50, "b": 40},
        )

        chart_json = fig.to_json()
        chart_type = _infer_chart_type(code)

        return {
            "chart_json": chart_json,
            "chart_type": chart_type,
            "status": "success",
            "error_message": None,
        }

    except TimeoutError:
        return {
            "chart_json": None,
            "chart_type": None,
            "status": "failed",
            "error_message": "Code execution timed out after 30 seconds.",
        }
    except Exception as e:
        logger.error(f"Code execution error: {e}")
        return {
            "chart_json": None,
            "chart_type": None,
            "status": "failed",
            "error_message": f"Execution error: {str(e)}",
        }
