"""
Phase 4 Test Script -- validates PDF, PPT, and Excel exports.
Uses FastAPI TestClient so we can mock session data without making real LLM calls.
"""

import sys
import json
import pandas as pd
from fastapi.testclient import TestClient

# Import the FastAPI app
from main import app
from session_store import sessions as SESSION_STORE

client = TestClient(app)

def setup_mock_session():
    """Create a mock session to test exports without running the LLM."""
    dataset_id = "test-export-id"
    
    # Create a dummy dataframe
    df = pd.DataFrame({
        "employee_id": [1, 2, 3],
        "name": ["Alice", "Bob", "Charlie"],
        "salary": [50000, 60000, 70000]
    })
    
    # Mock Plotly JSON
    mock_chart_json = json.dumps({
        "data": [{"x": ["A", "B"], "y": [10, 20], "type": "bar"}],
        "layout": {"title": "Test Chart"}
    })
    
    # Populate the session store
    import time
    SESSION_STORE[dataset_id] = {
        "filename": "test_data.csv",
        "upload_time": time.time(),
        "cleaned_df": df,
        "cleaning_report": {
            "nulls_filled": 0,
            "duplicates_removed": 0,
            "outliers_flagged": 0,
            "type_corrections": []
        },
        "analysis_results": [
            {
                "question": "Test Question?",
                "chart_json": mock_chart_json,
                "chart_type": "bar",
                "insight": "This is a test insight.",
                "status": "success",
                "error_message": None
            },
            {
                "question": "Failed Question?",
                "chart_json": None,
                "chart_type": None,
                "insight": None,
                "status": "failed",
                "error_message": "Failed to analyze."
            }
        ]
    }
    return dataset_id

def test_export_excel(dataset_id):
    print("\n1. Testing GET /api/export/excel...")
    res = client.get(f"/api/export/excel?dataset_id={dataset_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "spreadsheetml" in res.headers["content-type"]
    assert "attachment" in res.headers["content-disposition"]
    assert len(res.content) > 1000, "Excel file is too small"
    print(f"   [OK] Excel export successful! Size: {len(res.content)} bytes")

def test_export_pdf(dataset_id):
    print("\n2. Testing GET /api/export/pdf...")
    res = client.get(f"/api/export/pdf?dataset_id={dataset_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "application/pdf" in res.headers["content-type"]
    assert len(res.content) > 1000, "PDF file is too small"
    print(f"   [OK] PDF export successful! Size: {len(res.content)} bytes")

def test_export_ppt(dataset_id):
    print("\n3. Testing GET /api/export/ppt...")
    res = client.get(f"/api/export/ppt?dataset_id={dataset_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "presentationml" in res.headers["content-type"]
    assert len(res.content) > 1000, "PPT file is too small"
    print(f"   [OK] PPT export successful! Size: {len(res.content)} bytes")

def test_missing_dataset():
    print("\n4. Testing export with invalid dataset_id...")
    res = client.get("/api/export/pdf?dataset_id=invalid-id")
    assert res.status_code == 404
    print("   [OK] Correctly rejected invalid dataset")

if __name__ == "__main__":
    print("=" * 55)
    print("DataSense -- Phase 4 Export Tests")
    print("=" * 55)
    try:
        dataset_id = setup_mock_session()
        test_export_excel(dataset_id)
        test_export_pdf(dataset_id)
        test_export_ppt(dataset_id)
        test_missing_dataset()
        print("\n" + "=" * 55)
        print("[PASS] All Phase 4 tests passed!")
        print("=" * 55)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
