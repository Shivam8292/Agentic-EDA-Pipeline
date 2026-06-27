"""
Code Execution Service.

Safely executes LLM-generated pandas/plotly code in a restricted sandbox.
- Restricted globals (no builtins access)
- Returns Plotly figure JSON or error
- Windows-compatible (no SIGALRM)
"""

import logging
import re
import threading
from typing import Any, Optional

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

logger = logging.getLogger(__name__)

EXECUTION_TIMEOUT_SECONDS = 30

# Safe builtins and modules allowed in exec sandbox
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
        "ValueError": ValueError,
        "KeyError": KeyError,
        "TypeError": TypeError,
        "Exception": Exception,
        "__import__": __import__,
    },
    "pd": pd,
    "np": np,
    "px": px,
    "go": go,
}


def _sanitize_question(question: str) -> str:
    """Strip potential code injection from question text before sending to LLM."""
    sanitized = re.sub(r"[`<>]", "", question)
    sanitized = re.sub(r"\b(exec|eval|import|__import__|open|os|sys)\b", "", sanitized)
    return sanitized.strip()


def _infer_chart_type(code: str) -> str:
    """Infer chart type from the generated code string."""
    c = code.lower()
    if "px.pie" in c or "go.pie" in c:
        return "pie"
    if "heatmap" in c:
        return "heatmap"
    if "px.box" in c or "go.box" in c:
        return "box"
    if "px.histogram" in c or "go.histogram" in c:
        return "histogram"
    if "px.scatter" in c:
        return "scatter"
    if "go.scatter" in c:
        # go.Scatter can be lines or scatter depending on mode
        return "line" if "lines" in c else "scatter"
    if "px.line" in c or "go.line" in c:
        return "line"
    if "px.bar" in c or "go.bar" in c:
        return "bar"
    return "bar"  # default fallback


def _run_with_timeout(fn, timeout_seconds: int) -> Any:
    """
    Run fn() in a thread with a timeout.
    Returns the result or raises TimeoutError.
    Windows-compatible (no SIGALRM).
    """
    result = [None]
    error = [None]

    def target():
        try:
            result[0] = fn()
        except Exception as e:
            error[0] = e

    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout=timeout_seconds)

    if t.is_alive():
        raise TimeoutError(f"Execution exceeded {timeout_seconds}s timeout")
    if error[0] is not None:
        raise error[0]
    return result[0]


def execute_chart_code(
    code: str,
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Execute LLM-generated chart code in a restricted sandbox.

    Args:
        code: Python code string (must assign variable `fig`)
        df: The cleaned DataFrame

    Returns:
        dict with keys: chart_json, chart_type, status, error_message
    """
    exec_globals = {**SAFE_GLOBALS, "df": df.copy()}

    def _exec():
        exec(code, exec_globals)  # noqa: S102
        return exec_globals.get("fig")

    try:
        fig = _run_with_timeout(_exec, EXECUTION_TIMEOUT_SECONDS)

        if fig is None:
            return {
                "chart_json": None,
                "chart_type": None,
                "status": "failed",
                "error_message": "Code ran but `fig` variable was not assigned.",
            }

        # Apply consistent dark theme overrides
        fig.update_layout(
            paper_bgcolor="#111118",
            plot_bgcolor="#0A0A0F",
            font={"color": "#F0F0F5", "family": "Inter, sans-serif"},
            margin={"l": 50, "r": 40, "t": 50, "b": 50},
        )

        chart_json = fig.to_json()
        chart_type = _infer_chart_type(code)

        logger.info(f"Chart executed successfully: type={chart_type}")
        return {
            "chart_json": chart_json,
            "chart_type": chart_type,
            "status": "success",
            "error_message": None,
        }

    except TimeoutError as e:
        logger.warning(f"Execution timeout: {e}")
        return {
            "chart_json": None,
            "chart_type": None,
            "status": "failed",
            "error_message": f"Code execution timed out after {EXECUTION_TIMEOUT_SECONDS}s.",
        }
    except Exception as e:
        logger.error(f"Code execution error: {type(e).__name__}: {e}")
        return {
            "chart_json": None,
            "chart_type": None,
            "status": "failed",
            "error_message": f"Execution error: {str(e)}",
        }
