# backend/smart_column_mapper.py
"""
Smart column mapper for uploaded payroll Excel / CSV files.

Uses difflib sequence matching to fuzzy-match uploaded column headers
against canonical field aliases. Returns a mapping with confidence levels.
Explicitly ignores serial number / index columns (e.g. Sr. No, S.No).
"""

import difflib
from typing import Optional

# Keywords that explicitly identify row index / serial number columns
SERIAL_HEADER_KEYWORDS = {
    "sr no", "sr.no", "sr. no", "sr no.", "serial no", "serial number",
    "s.no", "s no", "sl.no", "sl no", "sn", "sr", "s. n.", "s.n.", "index", "#"
}

# ──────────────────────────────────────────────
# Canonical fields and their known aliases
# ──────────────────────────────────────────────
FIELD_ALIASES: dict[str, list[str]] = {
    "emp_code": [
        "emp code", "emp_code", "empcode", "employee code", "card no",
        "card number", "card no.", "card_no", "emp id", "employee id",
        "emp.code", "token no", "token number", "badge no", "badge number",
    ],
    "category": [
        "category", "cat", "emp category", "employee category", "type",
        "worker type", "labour type",
    ],
    "employee_name": [
        "name", "employee name", "emp name", "worker name", "full name",
        "employee_name", "staff name",
    ],
    "unit": ["unit", "unit no", "unit number"],
    "floor": ["floor", "floor no", "floor number", "area"],
    "department": [
        "department", "dept", "dept.", "dept name", "section",
        "work department",
    ],
    "contractor": ["contractor", "contractor name", "agency"],
    "doj": [
        "doj", "date of joining", "joining date", "date joined",
        "joining", "doj date",
    ],
    "bank_name": ["bank", "bank name", "bank_name", "bank nm"],
    "account_no": [
        "account no", "account number", "acc no", "acc number",
        "bank account", "a/c no",
    ],
    "ifsc": ["ifsc", "ifsc code", "ifsc_code", "bank ifsc"],
    "uan": ["uan", "uan no", "uan number", "pf no", "pf number"],
    "esic": [
        "esic", "esic no", "esic number", "esic_no", "esi no",
        "esi number",
    ],
    "aadhar": [
        "aadhar", "aadhaar", "aadhar no", "aadhaar number",
        "aadhar number", "adhar",
    ],
    "salary_type": ["salary type", "pay type", "wage type", "payment type"],
    "per_day_rate": [
        "per day rate", "per day", "daily rate", "rate", "per day wage",
        "daily wage", "per_day_rate",
    ],
    "fixed_pay": [
        "fixed pay", "fixed salary", "basic", "basic pay",
        "fixed_pay", "base pay",
    ],
    # Attendance / payroll fields
    "present": [
        "present", "present days", "days present", "working days",
        "attendance",
    ],
    "hours_ded_hr": [
        "hours ded hr", "hours ded", "deduction hours", "hrs ded",
        "hours deducted",
    ],
    "extra_duty_hrs": [
        "extra duty hrs", "extra duty", "overtime hrs", "ot hours",
        "overtime", "extra hours",
    ],
    "absent": ["absent", "absent days", "days absent", "leave days"],
    "ph": ["ph", "public holiday", "holiday", "paid holiday"],
    "weekly_off": ["weekly off", "weekly_off", "wo", "week off"],
    "per_piece": ["per piece", "per_piece", "piece count", "pieces"],
    "paid_days": ["paid days", "paid_days", "payable days", "days paid"],
    "total_days": [
        "total days", "total_days", "working days total", "days",
    ],
    "salary": [
        "salary", "basic salary", "gross salary", "earned salary",
        "monthly salary",
    ],
    "hours_ded_amt": [
        "hours ded amt", "deduction amount", "hrs ded amt",
        "deduction hrs amt",
    ],
    "extra_pay": [
        "extra pay", "overtime pay", "ot pay", "extra duty pay",
        "extra_pay",
    ],
    "difference_amount": [
        "difference amount", "diff amount", "difference", "diff amt",
        "difference_amount",
    ],
    "bin_card_amount": [
        "bin card", "bin card amount", "bin_card_amount", "piece wage",
        "incentive",
    ],
    "total_earning": [
        "total earning", "total_earning", "gross earning", "total earned",
        "gross pay",
    ],
    "other_deduction": [
        "other deduction", "other_deduction", "advance", "advance deduction",
        "misc deduction",
    ],
    "mediclaim_deduction": [
        "mediclaim", "mediclaim deduction", "health insurance",
        "mediclaim_deduction",
    ],
    "shoes_uniform": [
        "shoes", "uniform", "shoes uniform", "shoes_uniform",
        "uniform deduction",
    ],
    "total_payable_salary": [
        "total payable", "payable salary", "total_payable_salary",
        "net salary before statutory",
    ],
    "ee_pf": ["ee pf", "employee pf", "pf ee", "pf employee", "ee_pf"],
    "esi_ee": ["esi ee", "employee esi", "esi employee", "esi_ee"],
    "pt": ["pt", "professional tax", "prof tax"],
    "er_pf": ["er pf", "employer pf", "pf er", "pf employer", "er_pf"],
    "esi_er": ["esi er", "employer esi", "esi employer", "esi_er"],
    "net_pay": [
        "net pay", "net_pay", "take home", "final pay", "net payable",
        "net salary",
    ],
    "remarks": ["remarks", "remark", "note", "notes", "payment mode"],
    "lwf": [
        "lwf", "labour welfare fund", "labor welfare", "welfare fund",
    ],
}

# Fields that MUST be present for a valid import
REQUIRED_FIELDS = {"employee_name"}

# Fields that are "important" — warn if missing
IMPORTANT_FIELDS = {
    "emp_code", "per_day_rate", "paid_days", "department", "category",
    "net_pay", "total_earning",
}


def _normalise(s: str) -> str:
    """Lowercase, strip, remove punctuation for comparison."""
    return s.lower().strip().replace("_", " ").replace(".", "").replace("/", " ").strip()


def _best_match(header: str, all_aliases: dict[str, list[str]]) -> tuple[Optional[str], float]:
    """
    Find the best canonical field name for a given header string.
    Returns (field_name, score) where score is 0..1.
    Explicitly ignores serial number / index columns.
    """
    norm_header = _normalise(header)

    # Ignore serial number headers completely
    if norm_header in SERIAL_HEADER_KEYWORDS or norm_header.startswith("sr ") or norm_header.startswith("sl "):
        return None, 0.0

    best_field = None
    best_score = 0.0

    for field, aliases in all_aliases.items():
        # Exact match wins immediately
        if norm_header in [_normalise(a) for a in aliases]:
            return field, 1.0

        # Fuzzy match against all aliases
        for alias in aliases:
            score = difflib.SequenceMatcher(
                None, norm_header, _normalise(alias)
            ).ratio()
            if score > best_score:
                best_score = score
                best_field = field

    return best_field, best_score


def detect_columns(headers: list[str]) -> list[dict]:
    """
    Given a list of column header strings from an uploaded file,
    return a list of mapping dicts.
    """
    used_fields: set[str] = set()
    results = []

    # Build a sorted list of (score, field, source_col) for deduplication
    raw_matches: list[tuple[float, str, str, str]] = []
    for col in headers:
        field, score = _best_match(col, FIELD_ALIASES)
        raw_matches.append((score, field or "", col, col))

    # Greedy assignment: highest-score claims a field first
    score_sorted = sorted(raw_matches, key=lambda x: -x[0])
    claimed: dict[str, str] = {}  # field → source_col

    for score, field, col, _ in score_sorted:
        if field and field not in claimed:
            claimed[field] = col

    # Build result list in original column order
    for col in headers:
        field, score = _best_match(col, FIELD_ALIASES)

        # Was this column out-bid for its top match?
        if field and claimed.get(field) != col:
            remaining = {
                f: a
                for f, a in FIELD_ALIASES.items()
                if f not in claimed or claimed[f] == col
            }
            field2, score2 = _best_match(col, remaining)
            if score2 > 0.5:
                field = field2
                score = score2
            else:
                field = None
                score = 0.0

        # Confidence thresholds
        if score >= 0.88:
            confidence = "HIGH"
        elif score >= 0.65:
            confidence = "MEDIUM"
        elif score >= 0.45:
            confidence = "LOW"
        else:
            confidence = "NONE"
            field = None

        alternatives = []
        if field:
            for f, aliases in FIELD_ALIASES.items():
                if f == field:
                    continue
                s = difflib.SequenceMatcher(
                    None, _normalise(col), _normalise(aliases[0])
                ).ratio()
                alternatives.append((s, f))
            alternatives.sort(reverse=True)
            alternatives = [f for _, f in alternatives[:3]]

        results.append(
            {
                "source_col": col,
                "mapped_field": field,
                "confidence": confidence,
                "score": round(score, 3),
                "alternatives": alternatives,
            }
        )

        if field:
            used_fields.add(field)

    return results


def mapping_to_rename_dict(mapping: list[dict]) -> dict[str, str]:
    return {
        m["source_col"]: m["mapped_field"]
        for m in mapping
        if m.get("mapped_field")
    }
