"""
TDD tests for payslip PDF generation.

RED phase: all tests should fail before implementation.
GREEN phase: all tests pass after implementation.

Run with:
    cd backend
    python -m pytest tests/test_payslip_pdf.py -v
"""
import io
import os
import sys
import zipfile

import pytest

# Make sure we can import from the backend directory
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

SAMPLE_EMP = {
    "emp_code": "TEST001",
    "employee_name": "Test Employee",
    "category": "Permanent",
    "unit": "Unit A",
    "floor": "Ground",
    "department": "Production",
    "uan": "100123456789",
    "esic": "ESI123456",
    "account_no": "1234567890",
    "ifsc": "SBIN0000001",
    "bank_name": "State Bank of India",
    "per_day_rate": 500.0,
    "fixed_pay": 15000.0,
    "doj": "2020-01-01",
    # attendance
    "present": 25.0,
    "absent": 2.0,
    "extra_duty_hrs": 8.0,
    "weekly_off": 4.0,
    "per_piece": 0.0,
    "paid_days": 25.0,
    "total_days": 28.0,
    # payroll
    "salary": 12500.0,
    "hours_ded_amt": 0.0,
    "extra_pay": 500.0,
    "difference_amount": 0.0,
    "bin_card_amount": 0.0,
    "total_earning": 13000.0,
    "other_deduction": 0.0,
    "mediclaim_deduction": 0.0,
    "shoes_uniform": 0.0,
    "total_payable_salary": 13000.0,
    "ee_pf": 1560.0,
    "esi_ee": 97.5,
    "pt": 200.0,
    "er_pf": 1690.0,
    "esi_er": 422.5,
    "net_pay": 11142.5,
    "lwf": 0.0,
}

SAMPLE_COMPANY = {
    "name": "SHREE HARI ENTERPRISE",
    "address": "123 Test Street",
    "city": "Surat",
    "pincode": "395003",
    "phone": "9999999999",
}


# ─────────────────────────────────────────────
# Unit tests — PDF generator function
# ─────────────────────────────────────────────

class TestGeneratePayslipPDF:
    """Unit tests for the core PDF generation function."""

    def test_generate_single_payslip_returns_bytes(self):
        """generate_payslip_pdf should return non-empty bytes for a valid employee dict."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0

    def test_generated_pdf_has_valid_pdf_header(self):
        """The returned bytes should start with the PDF magic bytes %PDF."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)

        assert pdf_bytes[:4] == b"%PDF", "Output is not a valid PDF (missing %PDF header)"

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extract all text from a PDF using pdfplumber."""
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            return "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )

    def test_pdf_embeds_employee_name(self):
        """Employee name should appear in the extracted PDF text."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)
        text = self._extract_pdf_text(pdf_bytes)

        assert "Test Employee" in text or "TEST EMPLOYEE" in text, \
               f"Employee name not found in PDF text. Extracted: {text[:500]}"

    def test_pdf_embeds_company_name(self):
        """Company name should appear in the extracted PDF text."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)
        text = self._extract_pdf_text(pdf_bytes)

        assert "SHREE HARI" in text or "Shree Hari" in text, \
               f"Company name not found in PDF text. Extracted: {text[:500]}"

    def test_pdf_embeds_net_pay(self):
        """Net pay value (11,142.50) should appear in the extracted PDF text."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)
        text = self._extract_pdf_text(pdf_bytes)

        assert "11,142" in text or "11142" in text, \
               f"Net pay value not found in PDF text. Extracted: {text[:500]}"

    def test_pdf_embeds_november_2025(self):
        """The pay period 'November 2025' should appear in the extracted PDF text."""
        from routers.payslip_pdf import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(SAMPLE_EMP, SAMPLE_COMPANY)
        text = self._extract_pdf_text(pdf_bytes)

        assert "November 2025" in text or "Nov 2025" in text or "NOVEMBER 2025" in text, \
               f"Pay period not found in PDF text. Extracted: {text[:500]}"


# ─────────────────────────────────────────────
# Integration tests — FastAPI endpoints
# ─────────────────────────────────────────────

class TestPayslipPDFEndpoints:
    """Integration tests for /api/payslip/pdf/* and /api/payslip/bulk-zip."""

    @pytest.fixture(autouse=True)
    def client(self):
        """Set up FastAPI TestClient backed by a real (test) DB."""
        from fastapi.testclient import TestClient
        import database

        # Init a fresh in-memory-style DB using the real DB path
        database.init_db()

        # Insert a test employee so endpoints have data to work with
        import sqlite3
        conn = sqlite3.connect(database.DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO employees (
                emp_code, category, employee_name, unit, floor, department,
                contractor, doj, bank_name, account_no, ifsc, uan, esic, aadhar,
                salary_type, per_day_rate, fixed_pay
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "TEST001", "Permanent", "Test Employee", "Unit A", "Ground",
            "Production", "", "2020-01-01", "SBI", "1234567890",
            "SBIN0000001", "100123456789", "ESI123456", "123456789012",
            "Monthly", 500.0, 15000.0
        ))
        cursor.execute("""
            INSERT OR REPLACE INTO payroll_records (
                emp_code, present, hours_ded_hr, extra_duty_hrs, absent, ph,
                weekly_off, per_piece, paid_days, total_days, salary,
                hours_ded_amt, extra_pay, difference_amount, bin_card_amount,
                total_earning, other_deduction, mediclaim_deduction, shoes_uniform,
                total_payable_salary, ee_pf, esi_ee, pt, er_pf, esi_er,
                net_pay, remarks, lwf
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "TEST001", 25.0, 0.0, 8.0, 2.0, 0.0, 4.0, 0.0, 25.0, 28.0,
            12500.0, 0.0, 500.0, 0.0, 0.0, 13000.0, 0.0, 0.0, 0.0, 13000.0,
            1560.0, 97.5, 200.0, 1690.0, 422.5, 11142.5, "", 0.0
        ))
        conn.commit()
        conn.close()

        from main import app
        self.client = TestClient(app)
        yield

    def test_pdf_endpoint_returns_200_for_valid_emp(self):
        """GET /api/payslip/pdf/TEST001 should return HTTP 200."""
        response = self.client.get("/api/payslip/pdf/TEST001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_pdf_endpoint_returns_pdf_content_type(self):
        """GET /api/payslip/pdf/TEST001 should return application/pdf content type."""
        response = self.client.get("/api/payslip/pdf/TEST001")
        assert "application/pdf" in response.headers.get("content-type", ""), \
               f"Expected application/pdf, got {response.headers.get('content-type')}"

    def test_pdf_endpoint_returns_404_for_missing_emp(self):
        """GET /api/payslip/pdf/NONEXISTENT should return HTTP 404."""
        response = self.client.get("/api/payslip/pdf/NONEXISTENT_EMP_CODE")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"

    def test_pdf_endpoint_content_disposition_has_filename(self):
        """The PDF response should have a Content-Disposition header with a filename."""
        response = self.client.get("/api/payslip/pdf/TEST001")
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, \
               f"Expected 'attachment' in Content-Disposition, got: {content_disposition}"
        assert "TEST001" in content_disposition or ".pdf" in content_disposition, \
               f"Expected filename in Content-Disposition, got: {content_disposition}"

    def test_bulk_zip_endpoint_returns_200(self):
        """GET /api/payslip/bulk-zip should return HTTP 200."""
        response = self.client.get("/api/payslip/bulk-zip")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_bulk_zip_endpoint_returns_zip_content_type(self):
        """GET /api/payslip/bulk-zip should return application/zip content type."""
        response = self.client.get("/api/payslip/bulk-zip")
        assert "zip" in response.headers.get("content-type", ""), \
               f"Expected zip content-type, got {response.headers.get('content-type')}"

    def test_bulk_zip_contains_employee_pdf(self):
        """The downloaded ZIP should contain at least one PDF file for the test employee."""
        response = self.client.get("/api/payslip/bulk-zip")
        assert response.status_code == 200

        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, "r") as zf:
            names = zf.namelist()
            assert len(names) > 0, "ZIP is empty — expected at least one PDF"
            # At least one .pdf file should be present
            pdf_files = [n for n in names if n.endswith(".pdf")]
            assert len(pdf_files) > 0, f"No PDF files found in ZIP. Files: {names}"

    def test_bulk_zip_department_filter(self):
        """GET /api/payslip/bulk-zip?department=Production should filter to that department."""
        response = self.client.get("/api/payslip/bulk-zip?department=Production")
        assert response.status_code == 200

        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, "r") as zf:
            names = zf.namelist()
            assert len(names) > 0, "Expected at least one PDF for the Production department"
