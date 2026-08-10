"""
backend/routers/ai_chat.py

AI Chat endpoint with a warm, conversational, action-capable AI assistant persona:
  Tier 1 (Primary): Smart rule-based engine — handles greetings, gratitude, farewells,
                    tax percentage updates, employee rate/advance updates, payslips,
                    Form XXII, and payroll queries dynamically from the database.
  Tier 2 (Optional): NVIDIA Nemotron via OpenAI-compatible SDK — used when configured.
"""

import os
import re
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

import database
import vector_db
import time

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class LogoutRequest(BaseModel):
    session_id: str



# ══════════════════════════════════════════════════════════════════
# Shared tool dispatcher
# ══════════════════════════════════════════════════════════════════

def _dispatch_tool(name: str, arguments: dict) -> str:
    """Execute a named tool and return the result as a JSON string."""
    if name == "get_employee":
        emp_code = str(arguments.get("emp_code", "")).strip().upper()
        result = database.get_employee(emp_code)
        if not result:
            result = {"error": f"Employee {emp_code} not found."}

    elif name == "get_all_employees":
        result = database.get_all_employees(
            department=arguments.get("department"),
            category=arguments.get("category"),
        )

    elif name == "get_attendance_summary":
        result = database.get_attendance_summary()

    elif name == "get_absent_employees":
        result = database.get_absent_employees()

    elif name == "get_overtime_report":
        result = database.get_overtime_report(arguments.get("department"))

    elif name == "get_payroll_summary":
        result = database.get_payroll_summary()

    elif name == "get_department_summary":
        result = database.get_department_summary()

    elif name == "update_all_employees_records":
        updates = arguments.get("updates", {})
        count = database.update_all_employees_records(updates)
        summary = database.get_payroll_summary()
        result = {
            "message": f"Successfully updated {count} employee records company-wide.",
            "updated_count": count,
            "company_payroll_summary": summary,
        }

    elif name == "get_statutory_rules":
        result = {
            "provident_fund": {
                "employee_contribution_rate": "12% of total payable salary",
                "employer_contribution_rate": "13% of total payable salary",
                "employee_cap": "₹1,800 per month",
                "employer_cap": "₹1,950 per month",
            },
            "employee_state_insurance": {
                "employee_contribution_rate": "0.75% of total payable salary",
                "employer_contribution_rate": "3.25% of total payable salary",
                "cap": "No cap",
            },
            "professional_tax": {
                "threshold": "₹12,000 monthly total payable salary",
                "amount": "₹200 per month if salary is above threshold, ₹0 otherwise",
            },
            "overtime": {
                "formula": "Extra Pay = (extraHrs × perDayRate) / 8",
                "rate_divisor": 8,
            },
        }

    elif name == "generate_payslip_pdf_link":
        emp_code = str(arguments.get("emp_code", "")).strip().upper()
        emp = database.get_employee(emp_code)
        if not emp:
            result = {"error": f"Employee {emp_code} not found. Please verify the employee code."}
        else:
            emp_name = emp.get("employee_name", "Employee")
            download_url = f"http://localhost:8000/api/payslip/pdf/{emp_code}"
            bulk_url = "http://localhost:8000/api/payslip/bulk-zip"
            result = {
                "emp_code": emp_code,
                "employee_name": emp_name,
                "download_url": download_url,
                "bulk_zip_url": bulk_url,
                "message": (
                    f"PDF payslip ready for **{emp_name}** ({emp_code}).\n\n"
                    f"[⬇ Download Payslip PDF]({download_url})\n\n"
                    f"[⬇ Download All Payslips (ZIP)]({bulk_url})"
                ),
            }
    else:
        result = {"error": f"Unknown tool: {name}"}

    return json.dumps(result, default=str)


def _fmt(val) -> str:
    """Format a numeric value as Indian rupees."""
    try:
        return f"₹{float(val or 0):,.2f}"
    except (ValueError, TypeError):
        return "₹0.00"


def _num(val) -> float:
    try:
        return float(val or 0)
    except (ValueError, TypeError):
        return 0.0


# ══════════════════════════════════════════════════════════════════
# TIER 1 — Conversational Smart Engine & Action Dispatcher
# ══════════════════════════════════════════════════════════════════

_EMP_CODE_RE = re.compile(r'\b([A-Z]{2,5}\d{2,6})\b', re.IGNORECASE)

# Conversational intents
_INTENT_GREETING = re.compile(
    r'^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|welcome|yo|sup)\b',
    re.IGNORECASE,
)
_INTENT_THANKS = re.compile(
    r'\b(thank\s*you|thanks|thx|great\s*job|awesome|perfect|good\s*job|nice|superb|brilliant|wonderful)\b',
    re.IGNORECASE,
)
_INTENT_BYE = re.compile(
    r'\b(bye|goodbye|see\s*you|cya|have\s*a\s*good\s*day|take\s*care|good\s*night)\b',
    re.IGNORECASE,
)
_INTENT_IDENTITY = re.compile(
    r'\b(who\s*are\s*you|what\s*is\s*your\s*name|how\s*are\s*you|what\s*can\s*you\s*do)\b',
    re.IGNORECASE,
)

# System & Tax intents
_INTENT_TAX_UPDATE = re.compile(
    r'\b(can\s+i\s+)?(update|change|edit|modify|set)\s+.*?(tax|percentage|pf|esi|pt|statutory)\b',
    re.IGNORECASE,
)
_INTENT_TAX_QUERY = re.compile(
    r'\b(tax\s+percentage|tax\s+details|tax\s+rate|statutory\s+tax|tax\s+info)\b',
    re.IGNORECASE,
)
_INTENT_GENERAL_SETTINGS = re.compile(
    r'\b(update|change|edit|modify|set)\s+.*?(setting|settings|config|configuration|company|parameters?|chat|box)\b',
    re.IGNORECASE,
)

# Action mutations - Specific Employee
_UPDATE_RATE_RE = re.compile(
    r'\b(update|set|change)\s+(?:per\s*day\s*rate|rate|salary)\s+(?:for\s+)?([A-Z0-9]{2,10})\s+(?:to\s+)?([0-9.]+)',
    re.IGNORECASE,
)
_UPDATE_ADVANCE_RE = re.compile(
    r'\b(update|set|change)\s+(?:advance|deduction)\s+(?:for\s+)?([A-Z0-9]{2,10})\s+(?:to\s+)?([0-9.]+)',
    re.IGNORECASE,
)
_UPDATE_PRESENT_RE = re.compile(
    r'\b(update|set|change)\s+(?:present|days)\s+(?:for\s+)?([A-Z0-9]{2,10})\s+(?:to\s+)?([0-9.]+)',
    re.IGNORECASE,
)

# Action mutations - Whole Company / Bulk (when no employee code specified)
_BULK_RATE_WITH_VAL_RE = re.compile(
    r'\b(update|set|change)\s+.*?(per\s*day\s*rate|rate|salary)\b.*?(?:to\s+)?([0-9]+(?:\.[0-9]+)?)\b',
    re.IGNORECASE,
)
_BULK_RATE_QUERY_RE = re.compile(
    r'\b(update|set|change)\s+.*?(per\s*day\s*rate|rate|salary)\b',
    re.IGNORECASE,
)

_BULK_ADVANCE_WITH_VAL_RE = re.compile(
    r'\b(update|set|change)\s+.*?(advance|deduction)\b.*?(?:to\s+)?([0-9]+(?:\.[0-9]+)?)\b',
    re.IGNORECASE,
)
_BULK_ADVANCE_QUERY_RE = re.compile(
    r'\b(update|set|change)\s+.*?(advance|deduction)\b',
    re.IGNORECASE,
)

_BULK_PRESENT_WITH_VAL_RE = re.compile(
    r'\b(update|set|change)\s+.*?(present|days|attendance)\b.*?(?:to\s+)?([0-9]+(?:\.[0-9]+)?)\b',
    re.IGNORECASE,
)
_BULK_PRESENT_QUERY_RE = re.compile(
    r'\b(update|set|change)\s+.*?(present|days|attendance)\b',
    re.IGNORECASE,
)

_INTENT_GENERIC_UPDATE = re.compile(
    r'\b(update|change|edit|modify|set)\b',
    re.IGNORECASE,
)

_INTENT_PDF = re.compile(
    r'\b(pdf|download|generate\s+payslip|get\s+payslip|payslip\s+pdf|download\s+payslip|payslip\s+download|generate\s+pdf)\b',
    re.IGNORECASE,
)
_INTENT_PAYSLIP = re.compile(r'\b(payslip|pay\s+slip|salary\s+slip|pay\s+stub)\b', re.IGNORECASE)
_INTENT_EMPLOYEE = re.compile(r'\b(employee|emp|staff|worker)\b', re.IGNORECASE)
_INTENT_ATTENDANCE = re.compile(r'\b(attendance|present|absent|leave|absentee)\b', re.IGNORECASE)
_INTENT_OVERTIME = re.compile(r'\b(overtime|extra\s+duty|extra\s+hours|ot\b)\b', re.IGNORECASE)
_INTENT_PAYROLL = re.compile(r'\b(payroll|salary|wages|net\s+pay|gross|deduction|pf|esi|provident)\b', re.IGNORECASE)
_INTENT_DEPT = re.compile(r'\b(department|dept|summary|breakdown)\b', re.IGNORECASE)
_INTENT_RULES = re.compile(
    r'\b(rules?|regulation|statutory|pf\s+rate|esi\s+rate|professional\s+tax|overtime\s+formula|how\s+(is|are)\s+(pf|esi|pt|salary)\s+calculated)\b',
    re.IGNORECASE,
)
_INTENT_BULK = re.compile(
    r'\b(all\s+payslips?|bulk|zip|all\s+employees?\s+pdf|download\s+all)\b',
    re.IGNORECASE,
)
_INTENT_COUNT = re.compile(
    r'\b(how\s+many|count|total\s+employees?|number\s+of\s+employees?)\b',
    re.IGNORECASE,
)
_INTENT_ADVANCES = re.compile(
    r'\b(register\s+of\s+advances?|advance\s+register|form\s+xxii|form\s+22|advance\s+pdf|advances?\s+report|who\s+(took|taken|has\s+taken)\s+advance|advance\s+deduction)\b',
    re.IGNORECASE,
)
_INTENT_OVERTIME_REGISTER = re.compile(
    r'\b(register\s+of\s+overtime|overtime\s+register|overtime\s+report|overtime\s+pdf|overtime\s+earnings?|extra\s+duty\s+register|extra\s+duty\s+report)\b',
    re.IGNORECASE,
)
_INTENT_ACCIDENT = re.compile(
    r'\b(register\s+of\s+accidents?|accident\s+register|form\s+29|form\s+no\.\s*29|form\s+xxix|dangerous\s+occurrences?)\b',
    re.IGNORECASE,
)


_PAYSLIP_FOR_NAME = re.compile(
    r'payslip\s+(?:for\s+)?(?:employee\s+)?([A-Za-z][A-Za-z\s]{2,40})',
    re.IGNORECASE,
)


def _find_employee_by_name(name_query: str):
    name_q = name_query.strip().lower()
    all_emps = database.get_all_employees()
    for emp in all_emps:
        emp_name = (emp.get("employee_name") or "").lower()
        if name_q in emp_name or emp_name.startswith(name_q.split()[0]):
            return emp
    words = name_q.split()
    for emp in all_emps:
        emp_name = (emp.get("employee_name") or "").lower()
        if any(w in emp_name for w in words if len(w) > 2):
            return emp
    return None


def _build_payslip_response(emp: dict) -> str:
    emp_name = emp.get("employee_name", "—")
    emp_code = emp.get("emp_code", "—")
    dept = emp.get("department", "—")
    category = emp.get("category", "—")
    floor_ = emp.get("floor", "—")
    unit_ = emp.get("unit", "—")
    bank = emp.get("bank_name", "—")
    account = emp.get("account_no", "—")
    ifsc = emp.get("ifsc", "—")
    uan = emp.get("uan", "—")
    esic = emp.get("esic", "—")

    present = _num(emp.get("present"))
    absent = _num(emp.get("absent"))
    extra_hrs = _num(emp.get("extra_duty_hrs"))
    paid_days = _num(emp.get("paid_days"))

    salary = _num(emp.get("salary"))
    hrs_ded = _num(emp.get("hours_ded_amt"))
    extra_pay = _num(emp.get("extra_pay"))
    diff_amt = _num(emp.get("difference_amount"))
    bin_card = _num(emp.get("bin_card_amount"))
    total_earning = _num(emp.get("total_earning"))

    ee_pf = _num(emp.get("ee_pf"))
    esi_ee = _num(emp.get("esi_ee"))
    pt = _num(emp.get("pt"))
    other_ded = _num(emp.get("other_deduction"))
    mediclaim = _num(emp.get("mediclaim_deduction"))
    shoes_unif = _num(emp.get("shoes_uniform"))
    lwf = _num(emp.get("lwf"))
    total_ded = ee_pf + esi_ee + pt + other_ded + mediclaim + shoes_unif + lwf

    total_payable = _num(emp.get("total_payable_salary"))
    net_pay = _num(emp.get("net_pay"))
    er_pf = _num(emp.get("er_pf"))
    esi_er = _num(emp.get("esi_er"))

    download_url = f"http://localhost:8000/api/payslip/pdf/{emp_code}"
    bulk_url = "http://localhost:8000/api/payslip/bulk-zip"

    return (
        f"📄 **Payslip PDF ready for {emp_name}** ({emp_code})\n\n"
        f"- **Net Pay:** {_fmt(net_pay)}\n"
        f"- [⬇ Download Payslip PDF]({download_url})\n"
        f"- [⬇ Download All Payslips (ZIP)]({bulk_url})"
    )



def _rule_based_response(message: str) -> Optional[str]:
    msg = message.strip()
    db_count = database.get_record_count()
    code_matches = _EMP_CODE_RE.findall(msg)

    # ── Action: Specific Employee Updates (when emp code is present) ──
    rate_match = _UPDATE_RATE_RE.search(msg)
    if rate_match and code_matches:
        emp_code = rate_match.group(2).upper()
        new_rate = float(rate_match.group(3))
        emp = database.get_employee(emp_code)
        if not emp:
            return f"❌ Employee code **{emp_code}** was not found in the system."
        database.update_employee_record(emp_code, {"per_day_rate": new_rate})
        updated = database.get_employee(emp_code)
        return (
            f"✅ **Per Day Rate Updated!**\n\n"
            f"Updated per-day rate for **{updated['employee_name']}** ({emp_code}) to **₹{new_rate:,.2f}**.\n\n"
            f"- **New Basic Salary:** {_fmt(updated['salary'])}\n"
            f"- **New Net Pay:** {_fmt(updated['net_pay'])}\n\n"
            f"All payroll summaries and payslips have been recalculated automatically."
        )

    adv_match = _UPDATE_ADVANCE_RE.search(msg)
    if adv_match and code_matches:
        emp_code = adv_match.group(2).upper()
        new_adv = float(adv_match.group(3))
        emp = database.get_employee(emp_code)
        if not emp:
            return f"❌ Employee code **{emp_code}** was not found in the system."
        database.update_employee_record(emp_code, {"other_deduction": new_adv})
        updated = database.get_employee(emp_code)
        return (
            f"✅ **Advance Deduction Updated!**\n\n"
            f"Updated advance deduction for **{updated['employee_name']}** ({emp_code}) to **₹{new_adv:,.2f}**.\n\n"
            f"- **New Advance Deduction:** {_fmt(new_adv)}\n"
            f"- **New Net Pay:** {_fmt(updated['net_pay'])}\n\n"
            f"The **Form XXII Register of Advances** has been updated automatically."
        )

    pres_match = _UPDATE_PRESENT_RE.search(msg)
    if pres_match and code_matches:
        emp_code = pres_match.group(2).upper()
        new_pres = float(pres_match.group(3))
        emp = database.get_employee(emp_code)
        if not emp:
            return f"❌ Employee code **{emp_code}** was not found in the system."
        database.update_employee_record(emp_code, {"present": new_pres})
        updated = database.get_employee(emp_code)
        return (
            f"✅ **Attendance Updated!**\n\n"
            f"Updated present days for **{updated['employee_name']}** ({emp_code}) to **{new_pres:.0f} days**.\n\n"
            f"- **New Paid Days:** {updated['paid_days']:.0f} days\n"
            f"- **New Basic Salary:** {_fmt(updated['salary'])}\n"
            f"- **New Net Pay:** {_fmt(updated['net_pay'])}\n\n"
            f"All payroll calculations have been updated dynamically."
        )

    # ── Action: Whole-Company Bulk Actions (When NO specific employee code is mentioned) ──
    if not code_matches and not _PAYSLIP_FOR_NAME.search(msg):
        # 1. Bulk Per Day Rate Update with Value
        bulk_rate_val = _BULK_RATE_WITH_VAL_RE.search(msg)
        if bulk_rate_val:
            new_rate = float(bulk_rate_val.group(3))
            count = database.update_all_employees_records({"per_day_rate": new_rate})
            summary = database.get_payroll_summary()
            return (
                f"✅ **Company-Wide Per Day Rate Updated!**\n\n"
                f"Updated per-day rate for **ALL {count} employees across the whole company** to **₹{new_rate:,.2f}**.\n\n"
                f"- **New Company Total Gross Earnings:** {_fmt(summary.get('totalGross'))}\n"
                f"- **New Company Total Net Payable:** {_fmt(summary.get('totalNet'))}\n\n"
                f"All employee payslips and company payroll summaries have been recalculated automatically for the entire organization."
            )

        # 2. Bulk Rate Query without Value
        if _BULK_RATE_QUERY_RE.search(msg):
            return (
                f"What per-day rate would you like to set for **all {db_count} employees across the whole company**?\n\n"
                f"Example command: *\"Update rate to 600 for all employees\"*"
            )

        # 3. Bulk Advance Deduction Update with Value
        bulk_adv_val = _BULK_ADVANCE_WITH_VAL_RE.search(msg)
        if bulk_adv_val:
            new_adv = float(bulk_adv_val.group(3))
            count = database.update_all_employees_records({"other_deduction": new_adv})
            summary = database.get_payroll_summary()
            return (
                f"✅ **Company-Wide Advance Deduction Updated!**\n\n"
                f"Updated advance deduction for **ALL {count} employees across the whole company** to **₹{new_adv:,.2f}**.\n\n"
                f"- **New Company Total Deductions:** {_fmt(summary.get('totalDeductions'))}\n"
                f"- **New Company Total Net Payable:** {_fmt(summary.get('totalNet'))}\n\n"
                f"The **Form XXII Register of Advances** and all employee payslips have been updated company-wide."
            )

        # 4. Bulk Advance Query without Value
        if _BULK_ADVANCE_QUERY_RE.search(msg):
            return (
                f"What advance deduction amount would you like to set for **all {db_count} employees across the whole company**?\n\n"
                f"Example command: *\"Update advance to 1000 for all employees\"*"
            )

        # 5. Bulk Present Days Update with Value
        bulk_pres_val = _BULK_PRESENT_WITH_VAL_RE.search(msg)
        if bulk_pres_val:
            new_pres = float(bulk_pres_val.group(3))
            count = database.update_all_employees_records({"present": new_pres})
            summary = database.get_payroll_summary()
            return (
                f"✅ **Company-Wide Attendance Updated!**\n\n"
                f"Updated present days for **ALL {count} employees across the whole company** to **{new_pres:.0f} days**.\n\n"
                f"- **New Company Total Gross:** {_fmt(summary.get('totalGross'))}\n"
                f"- **New Company Total Net Payable:** {_fmt(summary.get('totalNet'))}\n\n"
                f"All payroll calculations for the entire company have been recalculated dynamically."
            )

        # 6. Bulk Present Days Query without Value
        if _BULK_PRESENT_QUERY_RE.search(msg):
            return (
                f"What present days / working days count would you like to update for **all {db_count} employees across the whole company**?\n\n"
                f"Example command: *\"Update present days to 26 for all employees\"*"
            )

        # 7. Tax & Settings Update Inquiries
        if _INTENT_GENERAL_SETTINGS.search(msg) or _INTENT_TAX_UPDATE.search(msg) or _INTENT_TAX_QUERY.search(msg):
            return (
                f"Since no specific employee was mentioned, any setting change or update will apply to the **whole company (all {db_count} employees)**. 😊\n\n"
                f"What setting or parameter would you like to change for **all employees across the company**?\n\n"
                f"### ⚙️ Company-Wide Settings & Actions:\n"
                f"1. 💰 **Company-Wide Per-Day Rate:** Set a daily rate for all employees (e.g., *\"Update rate to 600 for all\"*)\n"
                f"2. 📉 **Company-Wide Advance Deduction:** Set advance deductions for all employees (e.g., *\"Update advance to 1000 for all\"*)\n"
                f"3. 🗓️ **Company-Wide Attendance:** Set working days for all employees (e.g., *\"Set present days to 26 for all\"*)\n"
                f"4. 📋 **Statutory Tax Rules:** PF rate (12%), ESI rate (0.75%), or PT threshold\n"
                f"5. 🏢 **Company & Contractor Info:** Customize organization details on the [**Settings Page**](http://localhost:3000/settings)\n\n"
                f"Please tell me what value or setting you'd like to apply company-wide!"
            )

        # 8. Generic Update Intent without Employee
        if _INTENT_GENERIC_UPDATE.search(msg):
            return (
                f"Since no specific employee was mentioned, this action will apply to the **whole company (all {db_count} employees)**. 😊\n\n"
                f"What setting or parameter would you like to update for all employees across the organization?\n\n"
                f"- 💰 **Per-Day Rate for All:** *\"Update rate to 600 for all\"*\n"
                f"- 📉 **Advance Deduction for All:** *\"Update advance to 1000 for all\"*\n"
                f"- 🗓️ **Present Days for All:** *\"Set present days to 26 for all\"*\n"
                f"- ⚙️ **Company Tax & Settings:** Adjust company-wide statutory parameters."
            )

    # ── Conversational Intents ──────────────────────────────────────
    if _INTENT_GREETING.search(msg) and len(msg.split()) < 8:
        if db_count > 0:
            return (
                f"👋 **Hello! Welcome to PayrollAI Assistant.** 😊\n\n"
                f"I'm here to help you manage your team's payroll and records. Currently, there are "
                f"**{db_count} employee records** active in the system.\n\n"
                f"Here are a few quick actions you can ask me to do:\n"
                f"- 📄 *\"Show payslip for NUC0820\"*\n"
                f"- ✏️ *\"Update rate for NUC0820 to 550\"*\n"
                f"- ✏️ *\"Update advance for NUC0854 to 2500\"*\n"
                f"- ⬇️ *\"Download PDF for NUC0820\"*\n"
                f"- 📊 *\"Show attendance summary\"*\n"
                f"- 💼 *\"Show payroll summary\"*\n"
                f"- 📋 *\"Form XXII Register of Advances\"*\n\n"
                f"How can I assist you today?"
            )
        else:
            return (
                f"👋 **Hello! Welcome to PayrollAI Assistant.** 😊\n\n"
                f"Currently, no employee payroll data is loaded into the system.\n\n"
                f"Please click the **Upload File** button at the top of the screen to upload your Excel or CSV file. "
                f"Once uploaded, I'll be happy to assist you with salary calculations, updates, payslips, and compliance reports!"
            )

    if _INTENT_THANKS.search(msg) and len(msg.split()) < 8:
        return (
            "You're very welcome! 😊 I'm glad I could help.\n\n"
            "If you need anything else — like updating employee rates, generating payslips, checking attendance, or downloading reports — just let me know. Have a wonderful day! 🌟"
        )

    if _INTENT_BYE.search(msg) and len(msg.split()) < 8:
        return (
            "Goodbye! 👋 Have a great day ahead!\n\n"
            "Feel free to chat with me anytime you need help with payroll processing or employee records. Take care! ✨"
        )

    if _INTENT_IDENTITY.search(msg) and len(msg.split()) < 10:
        return (
            "🤖 **I'm your PayrollAI Assistant!**\n\n"
            "I'm an AI-powered assistant designed to execute actions and manage payroll workflows. I can help you:\n\n"
            "- ✏️ **Execute Record Updates:** Update daily rates, advance deductions, attendance days\n"
            "- 📄 **Payslip Generation:** Inline breakdowns and downloadable PDFs\n"
            "- 📊 **Attendance & Overtime:** Instant summary reports\n"
            "- 💼 **Payroll Calculations:** Gross earnings, PF, ESI, Professional Tax, Net Pay\n"
            "- 📋 **Compliance Reports:** Official Form XXII Register of Advances and bulk ZIP exports\n\n"
            "How can I assist you right now?"
        )

    # If DB is empty and user asks data questions
    if db_count == 0:
        return (
            "ℹ️ **No Payroll Data Loaded**\n\n"
            "No employee records were found in the database. Please use the **Upload File** button in the header bar "
            "to upload your Excel or CSV payroll spreadsheet. Once uploaded, ask me again and I will give you full details!"
        )

    # ── Register of Advances (Form XXII) ────────────────────────────
    if _INTENT_ADVANCES.search(msg):
        all_emps = database.get_all_employees()
        advances = [
            emp for emp in all_emps
            if float(emp.get("other_deduction") or 0) > 0
        ]
        count = len(advances)
        total_adv = sum(float(emp.get("other_deduction") or 0) for emp in advances)
        adv_url = "http://localhost:8000/api/payslip/advances-register"

        return (
            f"📋 **Form XXII — Register of Advances PDF ready**\n\n"
            f"- **Total Advances:** {_fmt(total_adv)} ({count} employee(s))\n"
            f"- [⬇ Download Form XXII Register of Advances PDF]({adv_url})"
        )

    # ── Register of Overtime ─────────────────────────────────────────
    if _INTENT_OVERTIME_REGISTER.search(msg):
        all_emps = database.get_all_employees()
        overtime_emps = [
            emp for emp in all_emps
            if float(emp.get("extra_duty_hrs") or 0) > 0
        ]
        count = len(overtime_emps)
        total_ot_hrs = sum(float(emp.get("extra_duty_hrs") or 0) for emp in overtime_emps)
        total_ot_pay = sum(float(emp.get("extra_pay") or (float(emp.get("extra_duty_hrs") or 0) * 60.8)) for emp in overtime_emps)
        ot_url = "http://localhost:8000/api/payslip/overtime-register"

        return (
            f"📋 **Register of Overtime PDF ready**\n\n"
            f"- **Total Overtime:** {total_ot_hrs:.1f} hrs ({_fmt(total_ot_pay)}, {count} employee(s))\n"
            f"- [⬇ Download Register of Overtime PDF]({ot_url})"
        )

    # ── Form No. 29 Register of Accidents ───────────────────────────
    if _INTENT_ACCIDENT.search(msg):
        acc_url = "http://localhost:8000/api/payslip/accident-register"
        return (
            f"📋 **Form No. 29 — Register of Accidents PDF ready**\n\n"
            f"- Statutory format prescribed under Rule 111 (Columns A to O)\n"
            f"- [⬇ Download Form No. 29 Register of Accidents PDF]({acc_url})"
        )

    # ── Bulk payslip download ────────────────────────────────────────

    if _INTENT_BULK.search(msg):
        return (
            f"📦 **Bulk Payslips Archive (ZIP) ready**\n\n"
            f"- Includes payslips for all **{db_count} employees**\n"
            f"- [⬇ Download All Payslips (ZIP)](http://localhost:8000/api/payslip/bulk-zip)"
        )

    # ── PDF / payslip for a specific employee (by code) ──────────────
    has_pdf_intent = bool(_INTENT_PDF.search(msg))
    has_payslip_intent = bool(_INTENT_PAYSLIP.search(msg))

    code_matches = _EMP_CODE_RE.findall(msg)
    if code_matches and (has_pdf_intent or has_payslip_intent):
        emp_code = code_matches[0].upper()
        emp = database.get_employee(emp_code)
        if not emp:
            return (
                f"❌ Employee code **{emp_code}** was not found in the system.\n\n"
                "Please verify the employee code and try again."
            )
        return _build_payslip_response(emp)

    # ── Payslip for a specific employee (by name) ────────────────────
    if has_payslip_intent or has_pdf_intent:
        name_match = _PAYSLIP_FOR_NAME.search(msg)
        if name_match:
            name_query = name_match.group(1).strip()
            emp = _find_employee_by_name(name_query)
            if emp:
                if has_pdf_intent:
                    emp_code = emp.get("emp_code", "")
                    emp_name = emp.get("employee_name", "Employee")
                    download_url = f"http://localhost:8000/api/payslip/pdf/{emp_code}"
                    return (
                        f"Here is the PDF payslip link for **{emp_name}**:\n\n"
                        f"## 📄 PDF Payslip Ready\n\n"
                        f"**{emp_name}** ({emp_code})\n\n"
                        f"[⬇ Download Payslip PDF]({download_url})\n\n"
                        f"[⬇ Download ALL Payslips (ZIP)](http://localhost:8000/api/payslip/bulk-zip)"
                    )
                return _build_payslip_response(emp)
            else:
                return (
                    f"❌ I couldn't find an employee matching **\"{name_query}\"**.\n\n"
                    "Could you try using their exact **employee code** (e.g. `NUC0820`)?"
                )
        if code_matches:
            emp_code = code_matches[0].upper()
            emp = database.get_employee(emp_code)
            if emp:
                return _build_payslip_response(emp)
        return (
            "Please provide the **employee code** (e.g. `NUC0820`) to get their payslip.\n\n"
            "For example: *\"Show payslip for NUC0820\"* or *\"Download PDF for NUC0820\"*"
        )

    # ── Employee lookup by code ──────────────────────────────────────
    if code_matches and _INTENT_EMPLOYEE.search(msg):
        emp_code = code_matches[0].upper()
        emp = database.get_employee(emp_code)
        if not emp:
            return f"❌ Employee **{emp_code}** was not found."
        return _build_payslip_response(emp)

    # ── Attendance summary ───────────────────────────────────────────
    if _INTENT_ATTENDANCE.search(msg) and not _INTENT_OVERTIME.search(msg):
        summary = database.get_attendance_summary()
        absent_list = database.get_absent_employees()
        response = (
            "Here is the attendance summary for your team:\n\n"
            "## 📊 Attendance Summary\n\n"
            f"| Status | Count |\n|---|---|\n"
            f"| ✅ Present | {summary.get('present', 0)} |\n"
            f"| ❌ Absent | {summary.get('absent', 0)} |\n"
            f"| ⏰ Overtime | {summary.get('overtime_count', 0)} |\n\n"
        )
        if absent_list:
            response += "### Employees with Absences\n\n"
            response += "| Name | Emp Code | Department | Absent Days |\n|---|---|---|---|\n"
            for e in absent_list[:20]:
                response += f"| {e.get('name','')} | {e.get('empCode','')} | {e.get('department','')} | {e.get('absent',0)} |\n"
            if len(absent_list) > 20:
                response += f"\n*...and {len(absent_list)-20} more employees.*"
        return response

    # ── Overtime report ──────────────────────────────────────────────
    if _INTENT_OVERTIME.search(msg):
        ot_list = database.get_overtime_report()
        if not ot_list:
            return "No overtime records were logged for the active period."
        response = "Here is the overtime report for your team:\n\n## ⏰ Overtime Report\n\n"
        response += "| Name | Emp Code | Department | Extra Hrs | Extra Pay |\n|---|---|---|---|---|\n"
        for e in ot_list[:25]:
            response += (
                f"| {e.get('name','')} | {e.get('empCode','')} | {e.get('department','')} "
                f"| {e.get('extraDutyHrs',0):.1f} | {_fmt(e.get('extraPay',0))} |\n"
            )
        if len(ot_list) > 25:
            response += f"\n*...and {len(ot_list)-25} more employees.*"
        return response

    # ── Employee count ───────────────────────────────────────────────
    if _INTENT_COUNT.search(msg):
        summary = database.get_payroll_summary()
        return (
            f"There are currently **{summary.get('count', 0)} employees** loaded in the system.\n\n"
            f"- **Total Gross Earnings:** {_fmt(summary.get('totalGross', 0))}\n"
            f"- **Total Net Payable:** {_fmt(summary.get('totalNet', 0))}\n"
            f"- **Total Deductions:** {_fmt(summary.get('totalDeductions', 0))}"
        )

    # ── Payroll summary ──────────────────────────────────────────────
    if _INTENT_PAYROLL.search(msg) and _INTENT_DEPT.search(msg):
        dept_summary = database.get_department_summary()
        response = "Here is the department-wise payroll breakdown:\n\n## 🏢 Department Salary Summary\n\n"
        response += "| Department | Employees | Net Pay |\n|---|---|---|\n"
        for dept, data in dept_summary.items():
            response += f"| {dept} | {data.get('count', 0)} | {_fmt(data.get('totalNet', 0))} |\n"
        return response

    if _INTENT_PAYROLL.search(msg):
        summary = database.get_payroll_summary()
        return (
            "Here is the overall payroll summary:\n\n"
            "## 💼 Payroll Summary\n\n"
            f"| Metric | Value |\n|---|---|\n"
            f"| Total Employees | {summary.get('count', 0)} |\n"
            f"| Gross Earnings | {_fmt(summary.get('totalGross', 0))} |\n"
            f"| Total Deductions | {_fmt(summary.get('totalDeductions', 0))} |\n"
            f"| Net Payable | {_fmt(summary.get('totalNet', 0))} |\n"
            f"| Total PF | {_fmt(summary.get('totalPF', 0))} |\n"
            f"| Total ESI | {_fmt(summary.get('totalESI', 0))} |\n"
        )

    # ── Department summary standalone ────────────────────────────────
    if _INTENT_DEPT.search(msg):
        dept_summary = database.get_department_summary()
        response = "Here is the department summary:\n\n## 🏢 Department Summary\n\n"
        response += "| Department | Employees | Net Pay |\n|---|---|---|\n"
        for dept, data in dept_summary.items():
            response += f"| {dept} | {data.get('count', 0)} | {_fmt(data.get('totalNet', 0))} |\n"
        return response

    # ── Statutory rules ──────────────────────────────────────────────
    if _INTENT_RULES.search(msg):
        return """Here are the statutory rules applied by the engine:

## 📋 Statutory Payroll Rules

### 🔵 Provident Fund (PF)
| Component | Rate | Cap |
|---|---|---|
| Employee (EE) Contribution | 12% of basic/payable salary | ₹1,800/month |
| Employer (ER) Contribution | 13% of basic/payable salary | ₹1,950/month |

### 🟣 Employee State Insurance (ESI)
| Component | Rate | Cap |
|---|---|---|
| Employee (EE) Contribution | 0.75% of payable salary | Applicable if salary ≤ ₹21,000 |
| Employer (ER) Contribution | 3.25% of payable salary | Applicable if salary ≤ ₹21,000 |

### 🟠 Professional Tax (PT)
- **Threshold:** Monthly payable salary > ₹12,000
- **Amount:** ₹200/month (₹0 if below threshold)

### 🟢 Overtime (OT)
```
Extra Pay = (Extra Duty Hours × Per-Day Rate) ÷ 8
```
"""

    # ── List all employees ───────────────────────────────────────────
    all_emp_re = re.compile(r'\b(list|show|all)\s+(all\s+)?employees?\b', re.IGNORECASE)
    if all_emp_re.search(msg):
        employees = database.get_all_employees()
        response = f"Here is the list of active employees ({len(employees)} total):\n\n## 👥 Employees List\n\n"
        response += "| Emp Code | Name | Department | Category | Net Pay |\n|---|---|---|---|---|\n"
        for e in employees[:30]:
            response += (
                f"| {e.get('emp_code','')} | {e.get('employee_name','')} "
                f"| {e.get('department','')} | {e.get('category','')} "
                f"| {_fmt(e.get('net_pay',0))} |\n"
            )
        if len(employees) > 30:
            response += f"\n*Showing top 30 of {len(employees)} employees.*"
        return response

    return None


# ══════════════════════════════════════════════════════════════════
# TIER 2 — NVIDIA Nemotron System Prompt
# ══════════════════════════════════════════════════════════════════

SYSTEM_INSTRUCTION = """You are a warm, friendly, polite, and highly professional AI Payroll Assistant.
You assist HR managers and payroll administrators with employee records, salary calculations, attendance, overtime, and compliance reports.

CRITICAL BEHAVIOR GUIDELINES:
1. WHOLE-COMPANY DEFAULT RULE: If the user sends a message requesting an update, change, setting adjustment, or calculation WITHOUT mentioning a specific employee code (e.g., NUC0820) or employee name, you MUST treat the action as applying to the WHOLE COMPANY (all employees). Ask what value or setting the user wants to change for ALL employees across the whole company, or use the `update_all_employees_records` tool to execute company-wide updates.
2. Always maintain a warm, welcoming, and polite AI tone (use greetings when appropriate, respond kindly to thanks and goodbyes).
3. Use the provided tools to query real database values — never guess numbers.
4. Present data clearly using clean Markdown tables, bullet points, and downloadable links.
5. For payslips, query get_employee(emp_code) and show a full formatted breakdown.
6. For PDF downloads, provide the generated download URL.
"""


def _is_real_api_key(key: Optional[str]) -> bool:
    if not key:
        return False
    placeholder_patterns = [
        "your_nvidia", "your-nvidia", "placeholder", "xxxx", "changeme",
        "your_api_key", "api_key_here",
    ]
    key_lower = key.lower()
    return not any(p in key_lower for p in placeholder_patterns)


def get_nvidia_client() -> Optional[OpenAI]:
    api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("API_KEY")
    if not _is_real_api_key(api_key):
        return None
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    return OpenAI(api_key=api_key, base_url=base_url)


def get_model_name() -> str:
    return os.getenv("NVIDIA_MODEL", "nvidia/nemotron-4-340b-instruct")


def _nvidia_chat(client: OpenAI, message: str) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION},
        {"role": "user", "content": message},
    ]
    model = get_model_name()
    choice = None

    for _ in range(8):
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "get_employee",
                        "description": "Get detailed profile, attendance, and payroll records for a specific employee.",
                        "parameters": {
                            "type": "object",
                            "properties": {"emp_code": {"type": "string"}},
                            "required": ["emp_code"],
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "update_all_employees_records",
                        "description": "Update per-day rate, advance deduction, present days, or other payroll fields for ALL employees across the whole company.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "updates": {
                                    "type": "object",
                                    "description": "Dictionary of fields to update company-wide (e.g., {'per_day_rate': 600}, {'other_deduction': 1000}, {'present': 26})."
                                }
                            },
                            "required": ["updates"],
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "get_payroll_summary",
                        "description": "Get overall payroll summary metrics.",
                        "parameters": {"type": "object", "properties": {}, "required": []},
                    },
                },
            ],
            tool_choice="auto",
            temperature=0.2,
            max_tokens=2048,
        )
        choice = response.choices[0]
        messages.append(choice.message)

        if not choice.message.tool_calls:
            break

        for tc in choice.message.tool_calls:
            fn_args = json.loads(tc.function.arguments or "{}")
            tool_result = _dispatch_tool(tc.function.name, fn_args)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": tool_result,
            })

    return (choice.message.content or "") if choice else ""


# ══════════════════════════════════════════════════════════════════
# Chat Endpoint
# ══════════════════════════════════════════════════════════════════

@router.post("/chat")
def chat_endpoint(request: ChatRequest):
    message = request.message.strip()
    session_id = request.session_id or "default"

    # Save user message to Vector DB
    user_msg_id = f"msg-usr-{int(time.time()*1000)}"
    vector_db.add_chat_message(session_id, user_msg_id, "user", message)

    # Perform vector similarity search for semantic context retrieval
    relevant_history = vector_db.search_relevant_history(session_id, message, top_k=3)

    # Determine response content
    rule_response = _rule_based_response(message)
    
    def _generator():
        final_response_text = ""
        if rule_response is not None:
            final_response_text = rule_response
            yield rule_response
        else:
            client = get_nvidia_client()
            nvidia_resp = None
            if client:
                try:
                    nvidia_resp = _nvidia_chat(client, message)
                except Exception:
                    pass
            
            if nvidia_resp:
                final_response_text = nvidia_resp
                yield nvidia_resp
            else:
                db_count = database.get_record_count()
                if db_count > 0:
                    fallback_text = (
                        "I'm here to help! 😊 Here are the actions and queries I can perform for you:\n\n"
                        "- ⚙️ **Company Settings:** *\"Update setting in chat\"* (applies company-wide for all employees)\n"
                        "- 💰 **Update Rate for All:** *\"Update rate to 600 for all\"*\n"
                        "- 📉 **Update Advance for All:** *\"Update advance to 1000 for all\"*\n"
                        "- ✏️ **Update Specific Employee Rate:** *\"Update rate for NUC0820 to 550\"*\n"
                        "- 📄 **Payslip:** *\"Show payslip for NUC0820\"*\n"
                        "- ⬇️ **PDF Download:** *\"Download PDF for NUC0820\"*\n"
                        "- 📊 **Attendance Summary:** *\"Show attendance summary\"*\n"
                        "- ⏰ **Overtime Report:** *\"Show overtime report\"*\n"
                        "- 💼 **Payroll Summary:** *\"Show payroll summary\"*\n"
                        "- 📋 **Form XXII:** *\"Register of advances\"*\n"
                        "- 📦 **All Payslips:** *\"Download all payslips\"*\n\n"
                        "Tell me what you'd like to do or check!"
                    )
                else:
                    fallback_text = (
                        "Hello! 😊 Currently no employee data is loaded into the system.\n\n"
                        "Please click **Upload File** in the top header bar to upload your Excel or CSV file. "
                        "Once uploaded, I can help you retrieve payslips, attendance, overtime, update employee records, and generate salary reports!"
                    )
                final_response_text = fallback_text
                yield fallback_text

        # Save assistant message into Vector DB for current session
        assistant_msg_id = f"msg-ast-{int(time.time()*1000)}"
        vector_db.add_chat_message(session_id, assistant_msg_id, "assistant", final_response_text)

    return StreamingResponse(_generator(), media_type="text/plain")


@router.get("/chat/history")
def get_chat_history(session_id: str):
    """Retrieve chat history and vector metadata for the given session_id."""
    messages = vector_db.get_session_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@router.post("/chat/clear")
@router.post("/chat/logout")
def clear_chat_history(request: LogoutRequest):
    """Purge all chat records and vector embeddings for session_id upon logout."""
    deleted_count = vector_db.delete_session_history(request.session_id)
    return {
        "status": "success",
        "message": f"Cleared chat history and vector embeddings for session '{request.session_id}'",
        "session_id": request.session_id,
        "deleted_count": deleted_count
    }

