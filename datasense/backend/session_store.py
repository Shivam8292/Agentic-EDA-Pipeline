"""
Global in-memory session store.
Sessions are keyed by UUID (dataset_id) and cleaned up after 1 hour.
"""

import time
from typing import Any

# Global sessions store
# {dataset_id: {original_df, cleaned_df, filename, upload_time, cleaning_report, analysis_results}}
sessions: dict[str, dict[str, Any]] = {}

SESSION_TTL_SECONDS = 3600  # 1 hour


def store_session(dataset_id: str, data: dict[str, Any]) -> None:
    """Store session data."""
    data["upload_time"] = time.time()
    sessions[dataset_id] = data


def get_session(dataset_id: str) -> dict[str, Any] | None:
    """Retrieve session data, returning None if not found or expired."""
    session = sessions.get(dataset_id)
    if not session:
        return None
    # Check TTL
    if time.time() - session.get("upload_time", 0) > SESSION_TTL_SECONDS:
        del sessions[dataset_id]
        return None
    return session


def cleanup_expired_sessions() -> int:
    """Remove all expired sessions. Returns count of removed sessions."""
    now = time.time()
    expired = [
        sid for sid, s in sessions.items()
        if now - s.get("upload_time", 0) > SESSION_TTL_SECONDS
    ]
    for sid in expired:
        del sessions[sid]
    return len(expired)
