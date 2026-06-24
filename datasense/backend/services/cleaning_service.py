"""
Data Cleaning Service.

Implements the full cleaning pipeline:
1. Strip whitespace from string columns
2. Standardize column names (lowercase, underscores)
3. Detect and fill numeric nulls with median
4. Detect and fill categorical nulls with mode
5. Remove fully duplicate rows
6. Fix obvious type mismatches
7. Flag outliers using IQR method
8. Return cleaned_df + cleaning_report
"""

import re
import numpy as np
import pandas as pd
from typing import Any


def _classify_dtype(series: pd.Series) -> str:
    """Classify a pandas Series into semantic dtype categories."""
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    # Try to parse as datetime
    if series.dtype == object:
        try:
            sample = series.dropna().head(20)
            pd.to_datetime(sample)
            return "datetime"
        except Exception:
            pass
    return "categorical"


def _standardize_column_name(name: str) -> str:
    """Convert column name to lowercase_with_underscores."""
    name = str(name).strip()
    name = re.sub(r"[^\w\s]", "", name)       # remove special chars
    name = re.sub(r"\s+", "_", name)           # spaces → underscores
    name = name.lower()
    return name


def _fix_type_mismatches(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Attempt to coerce string columns that look numeric to numeric."""
    corrections = []
    for col in df.columns:
        if df[col].dtype == object:
            # Try numeric coercion on a sample
            sample = df[col].dropna().head(50)
            coerced = pd.to_numeric(sample, errors="coerce")
            if coerced.notna().mean() > 0.85:  # 85% parseable → convert
                original_nulls = df[col].isna().sum()
                df[col] = pd.to_numeric(df[col], errors="coerce")
                new_nulls = df[col].isna().sum()
                corrections.append(
                    f"Column '{col}': string → numeric (introduced {new_nulls - original_nulls} NaN)"
                )
    return df, corrections


def _flag_outliers_iqr(df: pd.DataFrame) -> int:
    """Count outliers across all numeric columns using IQR method."""
    total_outliers = 0
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outlier_mask = (df[col] < lower) | (df[col] > upper)
        total_outliers += outlier_mask.sum()
    return int(total_outliers)


def clean_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Run the full cleaning pipeline on the input DataFrame.

    Returns:
        cleaned_df: The cleaned DataFrame
        cleaning_report: Dict with summary of changes
    """
    df = df.copy()
    nulls_filled = 0
    type_corrections: list[str] = []

    # 1. Standardize column names
    df.columns = [_standardize_column_name(c) for c in df.columns]

    # 2. Strip whitespace from string columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    # 3. Fix type mismatches (string → numeric)
    df, corrections = _fix_type_mismatches(df)
    type_corrections.extend(corrections)

    # 4. Fill numeric nulls with median
    for col in df.select_dtypes(include=[np.number]).columns:
        n_null = df[col].isna().sum()
        if n_null > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            nulls_filled += int(n_null)

    # 5. Fill categorical nulls with mode
    for col in df.select_dtypes(include="object").columns:
        n_null = df[col].isna().sum()
        if n_null > 0:
            mode_vals = df[col].mode()
            if len(mode_vals) > 0:
                df[col] = df[col].fillna(mode_vals[0])
            else:
                df[col] = df[col].fillna("Unknown")
            nulls_filled += int(n_null)

    # 6. Remove fully duplicate rows
    original_len = len(df)
    df = df.drop_duplicates()
    duplicates_removed = original_len - len(df)

    # 7. Flag outliers (count only, do not remove)
    outliers_flagged = _flag_outliers_iqr(df)

    df = df.reset_index(drop=True)

    cleaning_report = {
        "nulls_filled": nulls_filled,
        "duplicates_removed": int(duplicates_removed),
        "type_corrections": type_corrections,
        "outliers_flagged": outliers_flagged,
    }

    return df, cleaning_report


def get_column_info(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Build column info list with name, dtype, null_count, null_pct."""
    info = []
    total_rows = len(df)
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        null_pct = round(null_count / total_rows * 100, 2) if total_rows > 0 else 0.0
        info.append({
            "name": col,
            "dtype": _classify_dtype(df[col]),
            "null_count": null_count,
            "null_pct": null_pct,
        })
    return info
