"""
Phase 1 Test Script -- validates upload endpoint end-to-end.
Run AFTER starting the FastAPI backend: python main.py
"""

import sys
import requests

BASE_URL = "http://localhost:8000/api"


def test_health():
    print("1. Testing GET /api/health...")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ok"
    print(f"   [OK] Health: {data}")


def test_upload_valid_csv():
    print("\n2. Testing POST /api/upload with valid CSV...")
    with open("test_data/employees.csv", "rb") as f:
        files = {"file": ("employees.csv", f, "text/csv")}
        res = requests.post(f"{BASE_URL}/upload", files=files)

    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()

    assert "dataset_id" in data
    assert data["filename"] == "employees.csv"
    assert data["shape"]["rows"] > 0
    assert data["shape"]["columns"] > 0
    assert len(data["columns"]) > 0
    assert len(data["sample_rows"]) <= 5
    assert "cleaning_report" in data

    cr = data["cleaning_report"]
    print(f"   [OK] Upload successful!")
    print(f"   Shape: {data['shape']['rows']} rows x {data['shape']['columns']} cols")
    print(f"   Columns: {[c['name'] for c in data['columns']]}")
    print(f"   Nulls filled: {cr['nulls_filled']}, Dupes removed: {cr['duplicates_removed']}")
    print(f"   Outliers flagged: {cr['outliers_flagged']}")
    print(f"   Dataset ID: {data['dataset_id']}")
    return data["dataset_id"]


def test_upload_invalid_type():
    print("\n3. Testing POST /api/upload with invalid file type...")
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    res = requests.post(f"{BASE_URL}/upload", files=files)
    assert res.status_code in (400, 422), f"Expected 400/422, got {res.status_code}"
    print(f"   [OK] Correctly rejected: {res.json()['detail'][:80]}")


def test_upload_empty():
    print("\n4. Testing POST /api/upload with empty CSV...")
    files = {"file": ("empty.csv", b"col1,col2\n", "text/csv")}
    res = requests.post(f"{BASE_URL}/upload", files=files)
    assert res.status_code in (200, 422), f"Got: {res.status_code}"
    print(f"   [OK] Empty CSV handled: {res.status_code}")


if __name__ == "__main__":
    print("=" * 55)
    print("DataSense -- Phase 1 Integration Tests")
    print("=" * 55)
    try:
        test_health()
        dataset_id = test_upload_valid_csv()
        test_upload_invalid_type()
        test_upload_empty()
        print("\n" + "=" * 55)
        print("[PASS] All Phase 1 tests passed!")
        print(f"  dataset_id: {dataset_id}")
        print("=" * 55)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect. Start backend first: python main.py")
        sys.exit(1)
