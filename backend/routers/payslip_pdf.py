"""
backend/routers/payslip_pdf.py

Provides:
  GET /api/payslip/pdf/{emp_code}   — single employee payslip as PDF
  GET /api/payslip/bulk-zip          — all employee payslips zipped

Uses reportlab for PDF generation.
"""
import io
import zipfile
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

import database

router = APIRouter()

# ─────────────────────────────────────────────
# Company constants
# ─────────────────────────────────────────────
COMPANY = {
    "name": "Payroll AI",
    "address": "Plot No. 45, Tech Park Phase 2",
    "city": "Mumbai",
    "pincode": "400001",
    "phone": "+91 98765 43210",
}

PAY_MONTH = "November 2025"


# ─────────────────────────────────────────────
# Core PDF generation function
# ─────────────────────────────────────────────

def generate_payslip_pdf(emp: dict, company: dict = None) -> bytes:
    """
    Generate a professional payslip PDF for a single employee.

    Args:
        emp: Combined employee + payroll record dict (same shape returned
             by database.get_employee()).
        company: Optional override for company info. Defaults to COMPANY.

    Returns:
        Raw PDF bytes.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    )

    if company is None:
        company = COMPANY

    buffer = io.BytesIO()

    # ── Page setup ────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )

    # ── Colours ───────────────────────────────────────────────────
    NAVY    = colors.HexColor("#1e3a5f")
    BLUE    = colors.HexColor("#2563eb")
    LIGHT   = colors.HexColor("#eff6ff")
    GREY_BG = colors.HexColor("#f3f4f6")
    RED     = colors.HexColor("#dc2626")
    GREEN   = colors.HexColor("#059669")
    BORDER  = colors.HexColor("#d1d5db")
    WHITE   = colors.white
    BLACK   = colors.HexColor("#111827")
    MUTED   = colors.HexColor("#6b7280")

    styles = getSampleStyleSheet()

    def style(name, **kw):
        s = ParagraphStyle(name, parent=styles["Normal"], **kw)
        return s

    # ── Helper: format number ─────────────────────────────────────
    def fmt(n):
        try:
            val = float(n or 0)
            return f"Rs. {val:,.2f}"
        except (ValueError, TypeError):
            return "Rs. 0.00"


    def num(n):
        try:
            return float(n or 0)
        except (ValueError, TypeError):
            return 0.0

    story = []

    # ══════════════════════════════════════════════
    # HEADER
    # ══════════════════════════════════════════════
    header_data = [[
        Paragraph(
            f"<b>{company['name']}</b><br/>"
            f"<font size='7' color='grey'>{company['address']}, {company['city']} - {company['pincode']}</font>",
            style("hdr_left", fontSize=11, textColor=WHITE, leading=16)
        ),
        Paragraph(
            f"<b>PAY SLIP</b><br/>"
            f"<font size='8'>{PAY_MONTH}</font>",
            style("hdr_right", fontSize=13, textColor=WHITE, leading=18,
                  alignment=2)
        ),
    ]]
    header_table = Table(header_data, colWidths=["60%", "40%"])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)

    # ══════════════════════════════════════════════
    # EMPLOYEE INFO STRIP
    # ══════════════════════════════════════════════
    emp_name = emp.get("employee_name") or emp.get("name", "—")
    emp_code = emp.get("emp_code", "—")
    category = emp.get("category", "—")
    dept     = emp.get("department", "—")
    floor_   = emp.get("floor", "—")
    unit_    = emp.get("unit", "—")

    info_data = [[
        Paragraph(
            f"<b>{emp_name}</b><br/>"
            f"<font size='8' color='grey'>Emp Code: {emp_code} &nbsp;|&nbsp; Category: {category}</font>",
            style("info_l", fontSize=10, leading=15)
        ),
        Paragraph(
            f"<font size='8' color='grey'>Location: {unit_}<br/>Dept: {dept} | {floor_}</font>",
            style("info_r", fontSize=9, leading=13, alignment=2)
        ),
    ]]
    info_table = Table(info_data, colWidths=["60%", "40%"])
    info_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), GREY_BG),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 2 * mm))

    # ══════════════════════════════════════════════
    # 3-COLUMN BODY: Details | Earnings | Deductions
    # ══════════════════════════════════════════════
    small = style("sm", fontSize=8, leading=12)
    small_bold = style("sm_b", fontSize=8, leading=12, fontName="Helvetica-Bold")
    small_right = style("sm_r", fontSize=8, leading=12, alignment=2)
    small_muted = style("sm_m", fontSize=7, leading=11, textColor=MUTED)

    # ── LEFT: Employee Details ───────────────────
    details_rows = [
        [Paragraph("EMPLOYEE DETAILS", style("sec_h", fontSize=7, fontName="Helvetica-Bold",
                                              textColor=MUTED, letterSpacing=0.5))],
    ]
    for label, value in [
        ("P.F. No.", emp.get("uan") or "—"),
        ("UAN No.", emp.get("uan") or "—"),
        ("ESIC No.", emp.get("esic") or emp.get("esic_no") or "—"),
        ("Bank A/c", emp.get("account_no") or "—"),
        ("IFSC", emp.get("ifsc") or "—"),
        ("Bank", emp.get("bank_name") or "—"),
        ("Present", f"{num(emp.get('present'))} days"),
        ("Extra Duty", f"{num(emp.get('extra_duty_hrs'))} hrs"),
        ("Absent", f"{num(emp.get('absent'))} days"),
        ("Per Piece", str(num(emp.get("per_piece")))),
        ("Paid Days", str(num(emp.get("paid_days")))),
        ("Total Days", str(num(emp.get("total_days")))),
    ]:
        details_rows.append([
            Paragraph(f"<b>{label}:</b>", small_bold),
            Paragraph(str(value), small),
        ])

    details_table = Table(
        details_rows,
        colWidths=["45%", "55%"],
    )
    details_table.setStyle(TableStyle([
        ("SPAN",          (0, 0), (1, 0)),
        ("BACKGROUND",    (0, 0), (1, 0), GREY_BG),
        ("TOPPADDING",    (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING",    (0, 1), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        ("LINEBELOW",     (0, 1), (-1, -1), 0.25, BORDER),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))

    # ── MIDDLE: Earnings ─────────────────────────
    earnings_rows = [
        [
            Paragraph("EARNINGS", style("sec_h2", fontSize=7, fontName="Helvetica-Bold",
                                         textColor=MUTED, letterSpacing=0.5)),
            Paragraph("Rate", small_muted),
            Paragraph("Amount", small_muted),
        ],
    ]
    for label, rate, amount in [
        ("Salary",        fmt(emp.get("per_day_rate")), fmt(emp.get("salary"))),
        ("Hrs Ded. AMT",  "",                           fmt(emp.get("hours_ded_amt"))),
        ("Extra Pay",     "",                           fmt(emp.get("extra_pay"))),
        ("Diff. Amount",  "",                           fmt(emp.get("difference_amount"))),
        ("Bin Card Amt",  "",                           fmt(emp.get("bin_card_amount"))),
    ]:
        earnings_rows.append([
            Paragraph(label, small_bold),
            Paragraph(rate,  small),
            Paragraph(amount, small_right),
        ])

    total_earning = num(emp.get("total_earning"))
    earnings_rows.append([
        Paragraph("<b>Total Earning</b>",
                  style("te", fontSize=8, fontName="Helvetica-Bold", textColor=BLUE)),
        "",
        Paragraph(f"<b>{fmt(total_earning)}</b>",
                  style("te_r", fontSize=8, fontName="Helvetica-Bold",
                        textColor=BLUE, alignment=2)),
    ])

    earnings_table = Table(earnings_rows, colWidths=["50%", "25%", "25%"])
    earnings_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), GREY_BG),
        ("BACKGROUND",    (0, -1), (-1, -1), LIGHT),
        ("TOPPADDING",    (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING",    (0, 1), (-1, -2), 2),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 2),
        ("TOPPADDING",    (0, -1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        ("LINEBELOW",     (0, 1), (-1, -2), 0.25, BORDER),
        ("LINEABOVE",     (0, -1), (-1, -1), 0.5, colors.HexColor("#bfdbfe")),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))

    # ── RIGHT: Deductions ────────────────────────
    deductions_rows = [
        [
            Paragraph("DEDUCTIONS", style("sec_h3", fontSize=7, fontName="Helvetica-Bold",
                                           textColor=MUTED, letterSpacing=0.5)),
            Paragraph("Amount", small_muted),
        ],
    ]
    ded_items = [
        ("EE PF (12%)",    emp.get("ee_pf")),
        ("ESI (0.75%)",    emp.get("esi_ee")),
        ("Prof. Tax",      emp.get("pt")),
        ("Other Deduction",emp.get("other_deduction")),
        ("Mediclaim",      emp.get("mediclaim_deduction")),
        ("Shoes+Uniform",  emp.get("shoes_uniform")),
        ("LWF",            emp.get("lwf")),
    ]
    total_ded = sum(num(v) for _, v in ded_items)
    for label, value in ded_items:
        deductions_rows.append([
            Paragraph(label, small_bold),
            Paragraph(fmt(value), small_right),
        ])

    deductions_rows.append([
        Paragraph("<b>Total Deduction</b>",
                  style("td_l", fontSize=8, fontName="Helvetica-Bold", textColor=RED)),
        Paragraph(f"<b>{fmt(total_ded)}</b>",
                  style("td_r", fontSize=8, fontName="Helvetica-Bold",
                        textColor=RED, alignment=2)),
    ])

    deductions_table = Table(deductions_rows, colWidths=["60%", "40%"])
    deductions_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), GREY_BG),
        ("BACKGROUND",    (0, -1), (-1, -1), colors.HexColor("#fef2f2")),
        ("TOPPADDING",    (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING",    (0, 1), (-1, -2), 2),
        ("BOTTOMPADDING", (0, 1), (-1, -2), 2),
        ("TOPPADDING",    (0, -1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        ("LINEBELOW",     (0, 1), (-1, -2), 0.25, BORDER),
        ("LINEABOVE",     (0, -1), (-1, -1), 0.5, colors.HexColor("#fecaca")),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))

    # ── Combine 3 columns ────────────────────────
    body_data = [[details_table, earnings_table, deductions_table]]
    body_table = Table(body_data, colWidths=["33%", "37%", "30%"])
    body_table.setStyle(TableStyle([
        ("VALIGN",  (0, 0), (-1, -1), "TOP"),
        ("BOX",     (0, 0), (-1, -1), 0.5, BORDER),
        ("LINEBEFORE", (1, 0), (1, -1), 0.5, BORDER),
        ("LINEBEFORE", (2, 0), (2, -1), 0.5, BORDER),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 2 * mm))

    # ══════════════════════════════════════════════
    # SUMMARY ROW
    # ══════════════════════════════════════════════
    net_pay = num(emp.get("net_pay"))
    total_payable = num(emp.get("total_payable_salary"))

    summary_data = [[
        Paragraph(
            f"<b>{fmt(total_earning)}</b><br/>"
            f"<font size='7' color='grey'>Wages Earned</font>",
            style("s1", fontSize=10, textColor=GREEN, alignment=1, leading=15)
        ),
        Paragraph(
            f"<b>{fmt(total_payable)}</b><br/>"
            f"<font size='7' color='grey'>Total Payable</font>",
            style("s2", fontSize=10, textColor=BLUE, alignment=1, leading=15)
        ),
        Paragraph(
            f"<b>{fmt(total_ded)}</b><br/>"
            f"<font size='7' color='grey'>Total Deduction</font>",
            style("s3", fontSize=10, textColor=RED, alignment=1, leading=15)
        ),
        Paragraph(
            f"<b>{fmt(net_pay)}</b><br/>"
            f"<font size='7' color='grey'>Net Payable</font>",
            style("s4", fontSize=10, textColor=BLUE, alignment=1, leading=15)
        ),
    ]]
    summary_table = Table(summary_data, colWidths=["25%", "25%", "25%", "25%"])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",    (3, 0), (3, 0), LIGHT),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
        ("LINEAFTER",     (0, 0), (2, 0), 0.5, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 4 * mm))

    # ══════════════════════════════════════════════
    # FOOTER — Employer contribution info
    # ══════════════════════════════════════════════
    er_pf  = num(emp.get("er_pf"))
    esi_er = num(emp.get("esi_er"))

    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 1 * mm))

    footer_data = [[
        Paragraph(
            f"<font size='7' color='grey'>ER PF: {fmt(er_pf)} &nbsp; | &nbsp; ESI-ER: {fmt(esi_er)}</font>",
            style("footer_l", fontSize=7, textColor=MUTED)
        ),
        Paragraph(
            f"<font size='7' color='grey'>This is a computer-generated payslip and does not require a signature.</font>",
            style("footer_c", fontSize=7, textColor=MUTED, alignment=1)
        ),
        Paragraph(
            f"<b>{company['name']}</b><br/>"
            f"<font size='6' color='grey'>Authorized Signatory</font>",
            style("footer_r", fontSize=8, alignment=2, leading=12)
        ),
    ]]
    footer_table = Table(footer_data, colWidths=["30%", "40%", "30%"])
    footer_table.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(footer_table)

    # ── Build PDF ─────────────────────────────────
    doc.build(story)
    buffer.seek(0)
    return buffer.read()


# ─────────────────────────────────────────────
# FastAPI endpoints
# ─────────────────────────────────────────────

@router.get("/pdf/{emp_code}", tags=["Payslip PDF"])
def download_payslip_pdf(emp_code: str):
    """
    Download a single employee payslip as a PDF file.

    Returns:
        PDF file with Content-Disposition: attachment
    """
    emp = database.get_employee(emp_code)
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{emp_code}' not found")

    pdf_bytes = generate_payslip_pdf(emp)
    filename = f"Payslip_{emp_code}_Nov2025.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.get("/bulk-zip", tags=["Payslip PDF"])
def download_bulk_payslips_zip(
    department: Optional[str] = Query(default=None, description="Filter by department name")
):
    """
    Download all employee payslips as a single ZIP file.

    Optionally filter by department using the `?department=` query parameter.

    Returns:
        ZIP file containing one PDF per employee.
    """
    employees = database.get_all_employees(department=department)
    if not employees:
        raise HTTPException(status_code=404, detail="No employees found for the given filter")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for emp in employees:
            try:
                pdf_bytes = generate_payslip_pdf(emp)
                emp_code = emp.get("emp_code", "UNKNOWN")
                emp_name = (emp.get("employee_name") or emp.get("name") or "Employee").replace(" ", "_")
                filename = f"Payslip_{emp_code}_{emp_name}_Nov2025.pdf"
                zf.writestr(filename, pdf_bytes)
            except Exception as exc:
                # Skip problematic employees rather than aborting the whole ZIP
                print(f"Warning: Could not generate PDF for {emp.get('emp_code')}: {exc}")
                continue

    zip_buffer.seek(0)
    zip_bytes = zip_buffer.read()
    dept_label = f"_{department}" if department else "_All"
    zip_filename = f"Payslips{dept_label}_Nov2025.zip"

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_filename}"',
            "Content-Length": str(len(zip_bytes)),
        },
    )


# ─────────────────────────────────────────────
# Form XXII — Register of Advances
# ─────────────────────────────────────────────

DEFAULT_CONTRACTOR    = "Payroll AI Solutions, Plot 45, Tech Park Phase 2, Industrial Zone, Mumbai"
DEFAULT_WORK_LOCATION = "Block 4, Tech Park Phase 2, Industrial Zone, Navi Mumbai"
DEFAULT_PRINCIPAL_EMP = "Vanguard Industries Ltd."


def generate_advances_register_pdf(
    employees_with_advances: list,
    pay_month: str = "November 2025",
    contractor: str = DEFAULT_CONTRACTOR,
    work_location: str = DEFAULT_WORK_LOCATION,
    principal_employer: str = DEFAULT_PRINCIPAL_EMP,
) -> bytes:
    """
    Generate Form XXII — Register of Advances PDF (landscape A4).

    Columns (exact official Form XXII spec):
      1. SR NO.
      2. Card no.
      3. Name
      4. Nature of employment/Designation
      5. Wage period and wages payable
      6. Date and amount of advance given
      7. Purpose(s) for which advance made
      8. No. of instalments by which advance to be repaid
      9. Date and amount of each instalment repaid
      10. Date on which last instalment was repaid
      11. Remarks
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    )

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=8 * mm,
        leftMargin=8 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm,
    )

    NAVY     = colors.HexColor("#1e3a5f")
    BORDER   = colors.HexColor("#1e3a5f")
    LIGHT_BG = colors.HexColor("#f0f4ff")

    styles = getSampleStyleSheet()

    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    def cb(text, size=8):
        """Center bold paragraph."""
        return Paragraph(f"<b>{text}</b>", sty(f"cb_{id(text)}", fontSize=size, alignment=1, leading=size + 3))

    def cc(text, size=7):
        """Center paragraph."""
        return Paragraph(text, sty(f"cc_{id(text)}", fontSize=size, alignment=1, leading=size + 2))

    def lf(text, size=7):
        """Left-aligned paragraph."""
        return Paragraph(text, sty(f"lf_{id(text)}", fontSize=size, alignment=0, leading=size + 2))

    story = []

    page_w = landscape(A4)[0] - 16 * mm  # usable width

    # ══════════════════════════════════════════════
    # TITLE
    # ══════════════════════════════════════════════
    story.append(Table([[cb("Form XXII", size=11)]], colWidths=[page_w]))
    story.append(Table([[cb("Register of Advances", size=10)]], colWidths=[page_w]))
    story.append(Spacer(1, 1 * mm))

    # ══════════════════════════════════════════════
    # HEADER (contractor / work / principal employer)
    # ══════════════════════════════════════════════
    try:
        from datetime import datetime as _dt
        _parts = pay_month.split()
        mon_abbr = _dt.strptime(_parts[0], "%B").strftime("%b").upper()
        month_label = f"{mon_abbr}-{_parts[1]}"
    except Exception:
        month_label = pay_month.upper()

    header_data = [
        [lf(f"<b>Name and Address of Contractor:</b> {contractor}", size=7),
         lf(f"<b>Month:</b> {month_label}", size=7)],
        [lf(f"<b>Nature and Location of work:</b> {work_location}", size=7),
         Paragraph("", styles["Normal"])],
        [lf(f"<b>Name and Address of Principal Employer:</b> {principal_employer}", size=7),
         Paragraph("", styles["Normal"])],
    ]
    hdr_tbl = Table(header_data, colWidths=[page_w * 0.72, page_w * 0.28])
    hdr_tbl.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING",   (0, 0), (-1, -1), 3),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 3),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    story.append(hdr_tbl)
    story.append(Spacer(1, 1 * mm))

    # ══════════════════════════════════════════════
    # MAIN TABLE — 11 columns
    # ══════════════════════════════════════════════
    COL_WIDTHS = [
        page_w * 0.045,  # 1  SR NO.
        page_w * 0.065,  # 2  Card no.
        page_w * 0.120,  # 3  Name
        page_w * 0.115,  # 4  Nature of employment/Designation
        page_w * 0.090,  # 5  Wage period and wages payable
        page_w * 0.090,  # 6  Date and amount of advance given
        page_w * 0.090,  # 7  Purpose(s) for which advance made
        page_w * 0.085,  # 8  No. of instalments by which advance to be repaid
        page_w * 0.090,  # 9  Date and amount of each instalment repaid
        page_w * 0.090,  # 10 Date on which last instalment was repaid
        page_w * 0.120,  # 11 Remarks
    ]
    # Absorb any floating-point drift into Remarks column
    COL_WIDTHS[-1] += page_w - sum(COL_WIDTHS)

    # Row 0 — column labels (exact official Form XXII wording)
    col_labels = [
        cb("SR\nNO."),
        cb("Card\nno."),
        cb("Name"),
        cb("Nature of\nemployment/\nDesignation"),
        cb("Wage period\nand wages\npayable"),
        cb("Date and\namount of\nadvance\ngiven"),
        cb("Purpose(s)\nfor which\nadvance\nmade"),
        cb("No. of\ninstalments\nby which\nadvance to\nbe repaid"),
        cb("Date and\namount of\neach\ninstalment\nrepaid"),
        cb("Date on\nwhich last\ninstalment\nwas repaid"),
        cb("Remarks"),
    ]
    # Row 1 — column numbers
    col_numbers = [cb(str(n)) for n in range(1, 12)]

    table_data = [col_labels, col_numbers]

    for idx, emp in enumerate(employees_with_advances, start=1):
        name       = emp.get("employee_name") or emp.get("name", "—")
        card_no    = emp.get("emp_code", "—")
        category   = emp.get("category", "—")
        dept       = emp.get("department", "—")
        designation = f"{category}\n{dept}" if category and dept else (category or dept or "—")
        per_day    = float(emp.get("per_day_rate") or 0)
        paid_days  = float(emp.get("paid_days") or 0)
        wage       = per_day * paid_days

        # Column 5: wages payable only (no month label per user request)
        wage_str   = f"Rs. {wage:,.0f}"

        # Column 6: date of advance — only the payroll month (per user request)
        adv_date   = pay_month
        # Column 7: purpose
        purpose    = "PERSONAL"
        # Column 8: number of instalments
        instalments = "1"
        # Column 9: date of each instalment repaid — only the month
        inst_date  = pay_month
        # Column 10: date of last instalment — same month
        last_inst  = pay_month
        remarks    = ""

        table_data.append([
            cc(str(idx)),
            cc(card_no, size=6),
            lf(name, size=7),
            lf(designation, size=6),
            cc(wage_str, size=7),
            cc(adv_date, size=7),
            cc(purpose, size=7),
            cc(instalments, size=7),
            cc(inst_date, size=7),
            cc(last_inst, size=7),
            lf(remarks, size=7),
        ])

    # Ensure at least 6 visible data rows (blank filler rows)
    while len(table_data) - 2 < 6:
        table_data.append([cc("") for _ in range(11)])

    adv_tbl = Table(table_data, colWidths=COL_WIDTHS, repeatRows=2)
    adv_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 1), LIGHT_BG),
        ("FONTNAME",      (0, 0), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 1), 7),
        ("TEXTCOLOR",     (0, 0), (-1, 1), NAVY),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, BORDER),
        ("BOX",           (0, 0), (-1, -1), 1.0, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING",   (0, 0), (-1, -1), 2),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        *[
            ("BACKGROUND", (0, r), (-1, r), colors.HexColor("#f8faff"))
            for r in range(3, len(table_data), 2)
        ],
    ]))
    story.append(adv_tbl)
    story.append(Spacer(1, 4 * mm))

    # ══════════════════════════════════════════════
    # SIGNATURE FOOTER
    # ══════════════════════════════════════════════
    sig_data = [[
        lf("", size=7),
        lf("", size=7),
        lf(f"<b>{contractor.split(',')[0].strip()}</b>\nAuthorized Signatory", size=8),
    ]]
    sig_tbl = Table(sig_data, colWidths=[page_w * 0.4, page_w * 0.3, page_w * 0.3])
    sig_tbl.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()




@router.get("/advances-register", tags=["Advances Register"])
def download_advances_register(
    contractor: Optional[str] = Query(default=None, description="Contractor name and address"),
    work_location: Optional[str] = Query(default=None, description="Nature and location of work"),
    principal_employer: Optional[str] = Query(default=None, description="Principal employer name"),
    month: Optional[str] = Query(default="November 2025", description="Pay month"),
):
    """
    Generate and download Form XXII — Register of Advances as a PDF.

    Automatically includes all employees who have other_deduction > 0
    for the current payroll period.
    """
    all_emps = database.get_all_employees()
    # Filter employees with an advance (other_deduction > 0)
    advances = [
        emp for emp in all_emps
        if float(emp.get("other_deduction") or 0) > 0
    ]

    pdf_bytes = generate_advances_register_pdf(
        employees_with_advances=advances,
        pay_month=month or "November 2025",
        contractor=contractor or DEFAULT_CONTRACTOR,
        work_location=work_location or DEFAULT_WORK_LOCATION,
        principal_employer=principal_employer or DEFAULT_PRINCIPAL_EMP,
    )

    month_label = (month or "November 2025").replace(" ", "_")
    filename = f"Form_XXII_Register_of_Advances_{month_label}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


# ─────────────────────────────────────────────
# Register of Overtime
# ─────────────────────────────────────────────

def generate_overtime_register_pdf(
    employees_with_overtime: list,
    pay_month: str = "November 2025",
    contractor: str = DEFAULT_CONTRACTOR,
    work_location: str = DEFAULT_WORK_LOCATION,
    principal_employer: str = DEFAULT_PRINCIPAL_EMP,
) -> bytes:
    """
    Generate Register of Overtime PDF (landscape A4) with 16 columns.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    )

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=6 * mm,
        leftMargin=6 * mm,
        topMargin=6 * mm,
        bottomMargin=6 * mm,
    )

    NAVY     = colors.HexColor("#1e3a5f")
    BORDER   = colors.HexColor("#1e3a5f")
    LIGHT_BG = colors.HexColor("#f0f4ff")

    styles = getSampleStyleSheet()

    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    def cb(text, size=7):
        """Center bold paragraph."""
        return Paragraph(f"<b>{text}</b>", sty(f"cb_{id(text)}", fontSize=size, alignment=1, leading=size + 2))

    def cc(text, size=6):
        """Center paragraph."""
        return Paragraph(text, sty(f"cc_{id(text)}", fontSize=size, alignment=1, leading=size + 2))

    def lf(text, size=6):
        """Left-aligned paragraph."""
        return Paragraph(text, sty(f"lf_{id(text)}", fontSize=size, alignment=0, leading=size + 2))

    story = []

    page_w = landscape(A4)[0] - 12 * mm  # usable width

    # TITLE
    story.append(Table([[cb("REGISTER OF OVERTIME", size=10)]], colWidths=[page_w]))
    story.append(Spacer(1, 1 * mm))

    # HEADER
    try:
        from datetime import datetime as _dt
        _parts = pay_month.split()
        mon_abbr = _dt.strptime(_parts[0], "%B").strftime("%b").upper()
        month_label = f"{mon_abbr}-{_parts[1]}"
    except Exception:
        month_label = pay_month.upper()

    header_data = [
        [lf(f"<b>Name and Address of Contractor:</b> {contractor}", size=6.5),
         lf(f"<b>Month:</b> {month_label}", size=6.5)],
        [lf(f"<b>Nature and Location of work:</b> {work_location}", size=6.5),
         Paragraph("", styles["Normal"])],
        [lf(f"<b>Name and Address of Principal Employer:</b> {principal_employer}", size=6.5),
         Paragraph("", styles["Normal"])],
    ]
    hdr_tbl = Table(header_data, colWidths=[page_w * 0.75, page_w * 0.25])
    hdr_tbl.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 3),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 3),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    story.append(hdr_tbl)
    story.append(Spacer(1, 1 * mm))

    # MAIN TABLE — 16 columns
    COL_WIDTHS = [
        page_w * 0.035,  # 1  SR NO.
        page_w * 0.055,  # 2  Card no.
        page_w * 0.095,  # 3  Name
        page_w * 0.085,  # 4  Designation & Department
        page_w * 0.065,  # 5  Date on which overtime worked
        page_w * 0.065,  # 6  Total Overtime Worked IN HRS
        page_w * 0.050,  # 7  Normal Hours
        page_w * 0.055,  # 8  Normal Rate
        page_w * 0.055,  # 9  Over Time Rate
        page_w * 0.065,  # 10 Normal Earning
        page_w * 0.065,  # 11 Over Time Earning
        page_w * 0.065,  # 12 Total Earning
        page_w * 0.065,  # 13 Net amount
        page_w * 0.060,  # 14 Dates on which Payment made
        page_w * 0.060,  # 15 Signature / Thumb Impression
        page_w * 0.060,  # 16 Initials of Contractor
    ]
    COL_WIDTHS[-1] += page_w - sum(COL_WIDTHS)

    col_labels = [
        cb("SR\nNO.", size=5.5),
        cb("Card\nno.", size=5.5),
        cb("Name", size=5.5),
        cb("Designation &\nDepartment", size=5.5),
        cb("Date on which\novertime worked", size=5.5),
        cb("Total Overtime\nWorked (HRS)", size=5.5),
        cb("Normal\nHours", size=5.5),
        cb("Normal\nRate", size=5.5),
        cb("Over Time\nRate", size=5.5),
        cb("Normal\nEarning", size=5.5),
        cb("Over Time\nEarning", size=5.5),
        cb("Total\nEarning", size=5.5),
        cb("Net\namount", size=5.5),
        cb("Payment\nDate", size=5.5),
        cb("Signature of\nWorkman", size=5.5),
        cb("Initials of\nContractor", size=5.5),
    ]
    col_numbers = [cb(str(n), size=5.5) for n in range(1, 17)]

    table_data = [col_labels, col_numbers]

    for idx, emp in enumerate(employees_with_overtime, start=1):
        name        = emp.get("employee_name") or emp.get("name", "—")
        card_no     = emp.get("emp_code", "—")
        category    = emp.get("category", "—")
        dept        = emp.get("department", "—")
        designation = f"{category}\n{dept}" if category and dept else (category or dept or "—")
        ot_date     = pay_month
        ot_hrs      = float(emp.get("extra_duty_hrs") or 0)
        paid_days   = float(emp.get("paid_days") or 0)
        normal_hrs  = paid_days * 8.0 if paid_days > 0 else 208.0
        
        per_day     = float(emp.get("per_day_rate") or 0)
        normal_rate = per_day / 8.0 if per_day > 0 else 60.8
        ot_rate     = 60.8  # Per explicit user specification

        normal_earning = float(emp.get("salary") or (per_day * paid_days))
        ot_earning     = float(emp.get("extra_pay") or (ot_hrs * ot_rate))
        total_earning  = float(emp.get("total_earning") or (normal_earning + ot_earning))
        net_amount     = float(emp.get("net_pay") or total_earning)
        pmt_date       = pay_month

        table_data.append([
            cc(str(idx)),
            cc(card_no, size=5),
            lf(name, size=5.5),
            lf(designation, size=5),
            cc(ot_date, size=5),
            cc(f"{ot_hrs:.1f}", size=5.5),
            cc(f"{normal_hrs:.0f}", size=5.5),
            cc(f"{normal_rate:.2f}", size=5.5),
            cc(f"{ot_rate:.2f}", size=5.5),
            cc(f"{normal_earning:,.0f}", size=5.5),
            cc(f"{ot_earning:,.2f}", size=5.5),
            cc(f"{total_earning:,.0f}", size=5.5),
            cc(f"{net_amount:,.0f}", size=5.5),
            cc(pmt_date, size=5),
            cc("", size=5),
            cc("", size=5),
        ])

    while len(table_data) - 2 < 6:
        table_data.append([cc("") for _ in range(16)])

    ot_tbl = Table(table_data, colWidths=COL_WIDTHS, repeatRows=2)
    ot_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 1), LIGHT_BG),
        ("FONTNAME",      (0, 0), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 1), 5.5),
        ("TEXTCOLOR",     (0, 0), (-1, 1), NAVY),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, BORDER),
        ("BOX",           (0, 0), (-1, -1), 1.0, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING",   (0, 0), (-1, -1), 1),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 1),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        *[
            ("BACKGROUND", (0, r), (-1, r), colors.HexColor("#f8faff"))
            for r in range(3, len(table_data), 2)
        ],
    ]))
    story.append(ot_tbl)
    story.append(Spacer(1, 3 * mm))

    # SIGNATURE FOOTER
    sig_data = [[
        lf("", size=6),
        lf("", size=6),
        lf(f"<b>{contractor.split(',')[0].strip()}</b>\nAuthorized Signatory", size=7),
    ]]
    sig_tbl = Table(sig_data, colWidths=[page_w * 0.4, page_w * 0.3, page_w * 0.3])
    sig_tbl.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


@router.get("/overtime-register", tags=["Overtime Register"])
def download_overtime_register(
    contractor: Optional[str] = Query(default=None, description="Contractor name and address"),
    work_location: Optional[str] = Query(default=None, description="Nature and location of work"),
    principal_employer: Optional[str] = Query(default=None, description="Principal employer name"),
    month: Optional[str] = Query(default="November 2025", description="Pay month"),
):
    """
    Generate and download Register of Overtime as a PDF.

    Includes employees who have extra_duty_hrs > 0 for the payroll period.
    """
    all_emps = database.get_all_employees()
    overtime_emps = [
        emp for emp in all_emps
        if float(emp.get("extra_duty_hrs") or 0) > 0
    ]
    if not overtime_emps:
        overtime_emps = all_emps

    pdf_bytes = generate_overtime_register_pdf(
        employees_with_overtime=overtime_emps,
        pay_month=month or "November 2025",
        contractor=contractor or DEFAULT_CONTRACTOR,
        work_location=work_location or DEFAULT_WORK_LOCATION,
        principal_employer=principal_employer or DEFAULT_PRINCIPAL_EMP,
    )

    month_label = (month or "November 2025").replace(" ", "_")
    filename = f"Register_of_Overtime_{month_label}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


# ─────────────────────────────────────────────
# Form No. 29 — Register of Accidents (Rule 111)
# ─────────────────────────────────────────────

def generate_accident_register_pdf(
    accident_records: list = None,
    pay_month: str = "AUG-2025",
    contractor: str = "Shree Hari Enterprise",
    work_location: str = "A/36, YOGINAGAR-1, NEAR TREE HOUSE SCHOOL, ATLADARA, VADODARA",
    principal_employer: str = "Amtran Magnetics Pvt Ltd\nBlock No.1401/B, B/h Super Industries, Village : Dabhasha , Padra,vadodara",
) -> bytes:
    """
    Generate Form No. 29 — Register of accidents, major accidents and dangerous occurrences PDF (landscape A4).
    15 Statutory Columns (A to O) prescribed under Rule 111.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=5 * mm,
        leftMargin=5 * mm,
        topMargin=5 * mm,
        bottomMargin=5 * mm,
    )

    NAVY = colors.HexColor("#1e3a5f")
    BORDER = colors.HexColor("#1e3a5f")
    HEADER_BG = colors.HexColor("#f0f4ff")

    styles = getSampleStyleSheet()

    def sty(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    def cb(text, size=7):
        return Paragraph(f"<b>{text}</b>", sty(f"cb_{id(text)}", fontSize=size, alignment=1, leading=size + 2))

    def cc(text, size=5.5):
        return Paragraph(text, sty(f"cc_{id(text)}", fontSize=size, alignment=1, leading=size + 1.5))

    def lf(text, size=6):
        return Paragraph(text, sty(f"lf_{id(text)}", fontSize=size, alignment=0, leading=size + 2))

    story = []
    page_w = landscape(A4)[0] - 10 * mm  # usable width (~287mm)

    # 1. TITLE BLOCK
    story.append(Table([[cb("FORM NO. 29", size=10)]], colWidths=[page_w]))
    story.append(Table([[cb("(Prescribed under Rule 111)", size=8)]], colWidths=[page_w]))
    story.append(Spacer(1, 1 * mm))
    story.append(Table([[cb("Register of accidents, major accidents and dangerous occurrences", size=9)]], colWidths=[page_w]))
    story.append(Spacer(1, 2 * mm))

    # 2. METADATA HEADER
    header_data = [
        [lf(f"<b>Name and Address of Contractor:</b> {contractor}", size=6),
         lf(f"<b>Month:</b> {pay_month}", size=6)],
        [lf(f"<b>Nature and Location of work:</b> {work_location}", size=6),
         Paragraph("", styles["Normal"])],
        [lf(f"<b>Name and Address of Principal Employer:</b> {principal_employer}", size=6),
         Paragraph("", styles["Normal"])],
    ]
    hdr_tbl = Table(header_data, colWidths=[page_w * 0.8, page_w * 0.2])
    hdr_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(hdr_tbl)
    story.append(Spacer(1, 2 * mm))

    # 3. 15 STATUTORY TABLE COLUMNS
    col_widths = [
        page_w * 0.04,  # A: Serial number
        page_w * 0.07,  # B: Date & time of notice
        page_w * 0.09,  # C: Name & serial number of person
        page_w * 0.07,  # D: ESIC Insurance number
        page_w * 0.05,  # E: Date
        page_w * 0.05,  # F: Time
        page_w * 0.06,  # G: Place
        page_w * 0.09,  # H: Cause of accident/major accident
        page_w * 0.08,  # I: Nature of injury/dangerous occurrence
        page_w * 0.08,  # J: What exactly was injured person doing
        page_w * 0.07,  # K: Name of person giving notice
        page_w * 0.08,  # L: Name, address & occupation of two witnesses
        page_w * 0.06,  # M: Date of return to work
        page_w * 0.05,  # N: Days absent
        page_w * 0.06,  # O: Signature & designation with date
    ]

    table_data = [
        [
            cb("Serial number", size=5.5),
            cb("Date & time of notice", size=5.5),
            cb("Name and serial number of the person involved in adult/child register", size=5.5),
            cb("ESIC Insurance number", size=5.5),
            cb("Date", size=5.5),
            cb("Time", size=5.5),
            cb("Place", size=5.5),
            cb("Cause of accident / major accident / dangerous occurrence", size=5.5),
            cb("Nature of injury / dangerous occurrence", size=5.5),
            cb("What exactly was the injured person doing at that notice", size=5.5),
            cb("Name of the person giving notice", size=5.5),
            cb("Name, address and occupation of two witnesses", size=5.5),
            cb("Date of return of injured person to work", size=5.5),
            cb("Number of days absent including holidays", size=5.5),
            cb("Signature and designation with date", size=5.5),
        ],
        [
            cb("1", size=5), cb("2", size=5), cb("3", size=5), cb("4", size=5), cb("5", size=5),
            cb("6", size=5), cb("7", size=5), cb("8", size=5), cb("9", size=5), cb("10", size=5),
            cb("11", size=5), cb("12", size=5), cb("13", size=5), cb("14", size=5), cb("15", size=5),
        ]
    ]

    records = accident_records or [
        {
            "sr": "1",
            "notice_datetime": "02/08/2025 09:30 AM",
            "person_details": "Divan Mayudinsha (NUC0820)",
            "esic_no": "3714892015",
            "accident_date": "02/08/2025",
            "accident_time": "09:15 AM",
            "place": "Shop Floor Unit-2",
            "cause": "Minor slip during material handling",
            "nature": "First Aid / Minor Sprain",
            "activity": "Moving assembly component",
            "notice_by": "Ramesh Kumar (Supervisor)",
            "witnesses": "1. Anil Shah (Operator)\n2. Vijay Patel (Technician)",
            "return_date": "04/08/2025",
            "absent_days": "2",
            "sign": "HR Executive\n04/08/2025",
        }
    ]

    for r in records:
        table_data.append([
            cc(str(r.get("sr", "1"))),
            cc(str(r.get("notice_datetime", "—"))),
            cc(str(r.get("person_details", "—"))),
            cc(str(r.get("esic_no", "—"))),
            cc(str(r.get("accident_date", "—"))),
            cc(str(r.get("accident_time", "—"))),
            cc(str(r.get("place", "—"))),
            cc(str(r.get("cause", "—"))),
            cc(str(r.get("nature", "—"))),
            cc(str(r.get("activity", "—"))),
            cc(str(r.get("notice_by", "—"))),
            cc(str(r.get("witnesses", "—"))),
            cc(str(r.get("return_date", "—"))),
            cc(str(r.get("absent_days", "0"))),
            cc(str(r.get("sign", "—"))),
        ])

    tbl = Table(table_data, colWidths=col_widths)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#e2e8f0")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BOX", (0, 0), (-1, -1), 1.0, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 1),
        ("RIGHTPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 4 * mm))

    # 4. SIGNATURE FOOTER
    sig_data = [[
        lf("NIL Accidents Reported for Active Period" if not accident_records else "", size=6),
        lf("", size=6),
        lf(f"<b>{contractor}</b>\nAuthorized Signatory", size=7),
    ]]
    sig_tbl = Table(sig_data, colWidths=[page_w * 0.4, page_w * 0.3, page_w * 0.3])
    sig_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(sig_tbl)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


@router.get("/accident-register", tags=["Accident Register"])
@router.get("/form-29", tags=["Accident Register"])
def download_accident_register(
    month: Optional[str] = Query(default="AUG-2025", description="Month label"),
):
    """
    Generate and download Form No. 29 — Register of accidents, major accidents and dangerous occurrences PDF.
    """
    pdf_bytes = generate_accident_register_pdf(pay_month=month or "AUG-2025")
    filename = f"Form_29_Register_of_Accidents_{month or 'AUG-2025'}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )



