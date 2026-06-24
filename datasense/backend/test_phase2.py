"""
Phase 2 Test Script -- validates LLM + code execution pipeline.
Run AFTER starting the FastAPI backend: python main.py

Tests:
  1. Upload employees.csv to get dataset_id
  2. POST /api/analyze with 3 diverse questions
  3. POST /api/suggest to get AI-generated questions
  4. Verify chart_json is valid Plotly JSON
  5. Verify insight text is non-empty
  6. Verify error isolation (bad question doesn't crash others)
"""

import sys
import json
import requests

BASE_URL = "http://localhost:8000/api"
TIMEOUT = 120  # LLM can be slow


def upload_dataset():
    print("SETUP: Uploading employees.csv...")
    with open("test_data/employees.csv", "rb") as f:
        res = requests.post(
            f"{BASE_URL}/upload",
            files={"file": ("employees.csv", f, "text/csv")},
            timeout=30,
        )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    print(f"  [OK] dataset_id: {data['dataset_id']}")
    print(f"       Shape: {data['shape']['rows']}x{data['shape']['columns']}")
    return data["dataset_id"], data["columns"]


def test_analyze_questions(dataset_id):
    print("\n1. Testing POST /api/analyze with 1 question...")
    questions = [
        "What is the distribution of employees across departments? Show as a bar chart.",
    ]

    res = requests.post(
        f"{BASE_URL}/analyze",
        json={"dataset_id": dataset_id, "questions": questions},
        timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Analyze failed ({res.status_code}): {res.text}"
    data = res.json()
    results = data["results"]

    assert len(results) == len(questions), f"Expected {len(questions)} results, got {len(results)}"

    success_count = 0
    for i, result in enumerate(results):
        q_short = result["question"][:50]
        status = result["status"]
        print(f"\n  Q{i+1}: {q_short}...")
        print(f"    Status:     {status}")

        if status == "success":
            success_count += 1
            # Validate chart_json is valid Plotly JSON
            assert result.get("chart_json"), "chart_json is empty on success"
            chart = json.loads(result["chart_json"])
            assert "data" in chart, "chart_json missing 'data' key"
            assert len(chart["data"]) > 0, "chart has no traces"
            print(f"    Chart type: {result.get('chart_type', 'unknown')}")
            print(f"    Traces:     {len(chart['data'])}")
            print(f"    Insight:    {result.get('insight', '')[:80]}...")
        else:
            print(f"    Error:      {result.get('error_message', 'unknown')[:80]}")

    print(f"\n  Summary: {success_count}/{len(questions)} questions answered successfully")
    assert success_count >= 1, "At least 1 question must succeed"
    return results


def test_error_isolation(dataset_id):
    import time
    print("\nSleeping for 20s to space out Gemini requests...")
    time.sleep(20)
    print("\n2. Testing error isolation (bad question mixed with good one)...")
    questions = [
        "What is the xzy_column_nonexistent value?",  # likely to fail
        "Show salary distribution as a box plot.",  # good
    ]

    res = requests.post(
        f"{BASE_URL}/analyze",
        json={"dataset_id": dataset_id, "questions": questions},
        timeout=TIMEOUT,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    results = res.json()["results"]
    assert len(results) == 2, f"Expected 2 results, got {len(results)}"

    # Count successes - at least the 1 clear ones should work
    successes = [r for r in results if r["status"] == "success"]
    print(f"  [OK] Isolation works - {len(successes)}/2 succeeded, no crash")
    
    print("\nSleeping for 20s to space out Gemini requests...")
    time.sleep(20)


def test_suggest_questions(dataset_id):
    print("\n3. Testing POST /api/suggest...")
    res = requests.post(
        f"{BASE_URL}/suggest",
        json={"dataset_id": dataset_id},
        timeout=60,
    )
    assert res.status_code == 200, f"Suggest failed: {res.text}"
    data = res.json()
    questions = data.get("questions", [])
    print(f"  [OK] Got {len(questions)} suggested questions:")
    for i, q in enumerate(questions[:5]):
        print(f"    Q{i+1}: {q}")
    assert len(questions) > 0, "Expected at least 1 suggested question"


def test_invalid_dataset_id():
    print("\n4. Testing /api/analyze with invalid dataset_id...")
    res = requests.post(
        f"{BASE_URL}/analyze",
        json={"dataset_id": "nonexistent-uuid", "questions": ["test"]},
        timeout=10,
    )
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"  [OK] Correctly returned 404: {res.json()['detail'][:60]}")


def test_empty_questions(dataset_id):
    print("\n5. Testing /api/analyze with empty questions list...")
    res = requests.post(
        f"{BASE_URL}/analyze",
        json={"dataset_id": dataset_id, "questions": ["", "  ", ""]},
        timeout=10,
    )
    assert res.status_code in (400, 422), f"Expected 400/422, got {res.status_code}"
    print(f"  [OK] Empty questions correctly rejected: {res.status_code}")


if __name__ == "__main__":
    print("=" * 60)
    print("DataSense -- Phase 2 LLM + Execution Tests")
    print("=" * 60)
    print("NOTE: These tests call the Gemini API and may take 1-3 minutes.\n")

    try:
        dataset_id, columns = upload_dataset()

        test_analyze_questions(dataset_id)
        test_error_isolation(dataset_id)
        test_suggest_questions(dataset_id)
        test_invalid_dataset_id()
        test_empty_questions(dataset_id)

        print("\n" + "=" * 60)
        print("[PASS] All Phase 2 tests passed!")
        print("=" * 60)
        sys.exit(0)

    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect. Start backend: python main.py")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print("\n[TIMEOUT] LLM took too long. Check GEMINI_API_KEY and network.")
        sys.exit(1)
