# Payroll AI — AI-First Payroll & HR Management Platform

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

---

## 📌 Project Overview

**Payroll AI** is an intelligent, full-stack Payroll and HR Management platform designed to streamline salary processing, attendance logging, statutory tax compliance (PF, ESI, Professional Tax), spreadsheet imports, and official document generation (PDF Payslips & Form XXII Register of Advances).

Powered by a **Hybrid AI Engine** (Tier 1 Smart Rule Engine + Tier 2 NVIDIA Nemotron LLM), Payroll AI enables HR managers to query employee data, execute record updates, generate inline payslips, and trigger organization-wide adjustments directly using conversational natural language commands.

### ✨ Key Highlights
- **Two-Partition Login Portal**: Split-screen design featuring brand showcase on the left and credentials login with a **⚡ 1-Click HR Admin Quick Access** button on the right.
- **Hybrid AI Chat Assistant**: Smart rule engine paired with NVIDIA Nemotron LLM capability for tool dispatching.
- **Whole-Company Scope Default**: Chat updates without specific employee codes apply company-wide to all active records.
- **Smart Excel/CSV Column Mapper**: Uses fuzzy string sequence matching (`difflib`) to map arbitrary spreadsheet headers to database schema fields automatically.
- **ReportLab PDF Generator**: Renders pixel-perfect, publication-ready individual payslips and official **Form XXII Register of Advances** landscape A4 PDFs.
- **Bulk Exports**: One-click ZIP generation for all employee payslip PDFs.
- **Dynamic Statutory Engine**: Instant calculations for Employee/Employer PF (12%/13%), ESI (0.75%/3.25%), Professional Tax (PT), and Overtime (OT).

---

## 🏗️ Architecture & Technology Stack

```
                               ┌────────────────────────────────────────┐
                               │       Next.js / React Frontend         │
                               │  (Port 3000 / Login & App Router)      │
                               └──────────────────┬─────────────────────┘
                                                  │ REST APIs & Streams
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │            FastAPI Backend             │
                               │          (Port 8000 / Uvicorn)         │
                               └──────┬──────────────────────┬──────────┘
                                      │                      │
                   ┌──────────────────┴─────────┐  ┌─────────┴───────────────────┐
                   │    Hybrid AI Chat Engine   │  │   Smart Column Mapper     │
                   │ (Tier 1 Rule + Tier 2 LLM) │  │  (Fuzzy Header Matching)  │
                   └──────────────────┬─────────┘  └─────────┬───────────────────┘
                                      │                      │
                                      ▼                      ▼
                               ┌────────────────────────────────────────┐
                               │         SQLite Database & PDFs         │
                               │ (payroll.db & ReportLab Engine)        │
                               └────────────────────────────────────────┘
```

### Stack Breakdown
- **Backend Framework**: Python 3.9+, [FastAPI](https://fastapi.tiangolo.com/), Uvicorn (ASGI server), Pydantic.
- **Database Layer**: SQLite 3 with raw SQL queries and custom trigger-based payroll recalculations.
- **Data & File Processing**: Pandas, OpenPyXL, ReportLab (PDF canvas & Platypus engine), ZipFile, Python-dotenv.
- **AI Integrations**: OpenAI-compatible Python SDK connected to NVIDIA Nemotron / API endpoints.
- **Frontend Framework**: Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, React Markdown.

---

## 📂 Project Directory Structure

```
Rag Payroll/
├── backend/
│   ├── main.py                     # FastAPI application entry point & router registration
│   ├── database.py                 # SQLite schema, data loaders, queries, and bulk recalculation logic
│   ├── smart_column_mapper.py      # Fuzzy matching column mapper for Excel/CSV spreadsheet uploads
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment configuration (NVIDIA API Key, base URLs)
│   ├── payroll.db                  # SQLite database file (created dynamically)
│   ├── routers/
│   │   ├── ai_chat.py              # AI Chat endpoint (Tier 1 Smart Engine + Tier 2 LLM + Tool Dispatch)
│   │   ├── employees.py           # Employee master records REST API & master excel file upload
│   │   ├── payroll.py             # Payroll metrics, department breakdowns & salary summary APIs
│   │   ├── attendance.py          # Attendance and absent employee reporting APIs
│   │   ├── leaves.py              # Leave management API stub
│   │   ├── payslip_pdf.py         # ReportLab PDF payslip, Form XXII Advances PDF & Bulk ZIP export
│   │   └── upload.py              # Excel/CSV upload preview, column mapping confirmation & direct import
│   └── uploads/                   # Upload storage for master spreadsheets and metadata
├── payroll-ai/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── login/              # Two-Partition Login Page (Brand Showcase + HR Quick Access)
│   │   │   ├── dashboard/          # Main AI Assistant workspace
│   │   │   ├── employees/          # Employee directory & table view
│   │   │   ├── payroll/            # Monthly payroll summary
│   │   │   ├── payslips/           # Payslip viewer & PDF download center
│   │   │   ├── reports/            # Compliance reports & Form XXII generator
│   │   │   └── settings/           # Company settings & register defaults
│   │   ├── components/
│   │   │   ├── ai/                 # AIChatWorkspace, AIMessageBubble, AIPanel UI components
│   │   │   ├── employees/          # Employee directory & table components
│   │   │   └── layout/             # AppShell, Header, Sidebar components
│   │   ├── lib/                    # API client utilities, formatting helpers, AI type definitions
│   │   └── types/                  # TypeScript interface definitions for Employees and Payroll
│   ├── package.json                # Frontend package configuration and scripts
│   └── tsconfig.json               # TypeScript compiler configuration
└── README.md                       # Comprehensive project documentation
```

---

## 📖 Detailed Module & Function Reference

This section provides an exhaustive guide to every file and function across the backend and frontend modules.

### 1. `backend/database.py` (Database & Calculation Engine)

Manages SQLite table schema, excel loading, data filtering, record updates, and payroll recalculations.

- **`get_db_connection()`**:
  Creates and returns a `sqlite3.Connection` instance connected to `payroll.db` with `sqlite3.Row` factory enabled for dictionary-like column access.
- **`init_db()`**:
  Executes DDL commands to create the `employees` and `payroll_records` tables if they do not exist. Establishes primary keys and foreign key constraints.
- **`clean_float(val)`**:
  Sanitizes input values (handling `None`, `""`, `"-"`) and safely converts them to `float`. Returns `0.0` on failure.
- **`clean_str(val)`**:
  Strips whitespace from string inputs and converts `None` or `"-"` to an empty string.
- **`clean_date(val)`**:
  Parses `datetime` objects or date strings into standardized `YYYY-MM-DD` format.
- **`load_data_from_excel(excel_path)`**:
  Reads an Excel file using OpenPyXL, clears existing records, parses data starting from row 5, populates `employees` and `payroll_records` tables, and commits the transaction. Returns total record count.
- **`load_data_from_dataframe(df)`**:
  Clears existing tables and populates the database using a sanitized Pandas DataFrame produced during file upload or auto-mapping.
- **`get_all_employees(department=None, category=None)`**:
  Retrieves combined employee master and payroll records, with optional case-insensitive SQL filtering by department or category.
- **`get_employee(emp_code)`**:
  Fetches the complete profile and payroll breakdown for a single employee specified by `emp_code`.
- **`get_attendance_summary()`**:
  Returns counts for active present employees (`present > 0`), absent employees (`absent > 0`), and overtime employees (`extra_duty_hrs > 0`).
- **`get_absent_employees()`**:
  Queries and returns a list of employees with recorded absence days.
- **`get_overtime_report(department=None)`**:
  Queries employees with recorded overtime extra duty hours, returning name, employee code, department, extra hours, and overtime pay.
- **`get_payroll_summary()`**:
  Aggregates organization-wide metrics: total employee count, total gross earnings, total net pay, total deductions, total EE PF, and total ESI.
- **`get_department_summary()`**:
  Groups payroll metrics by department, returning department name, employee count, and aggregate net pay.
- **`get_record_count()`**:
  Returns the total count of active employee records in the database.
- **`update_employee_record(emp_code: str, updates: dict) -> bool`**:
  Dynamically updates specific master fields (`per_day_rate`, `department`, `contractor`, etc.) or payroll fields (`present`, `other_deduction`, `extra_duty_hrs`, etc.) for a single employee, then triggers `recalculate_employee_payroll(emp_code)`.
- **`update_all_employees_records(updates: dict) -> int`**:
  Executes bulk updates for specified fields across **ALL employees** in the database and recalculates payroll for every employee organization-wide. Returns total updated count.
- **`recalculate_employee_payroll(emp_code: str)`**:
  Re-computes basic salary, overtime pay (`extra_pay = per_day_rate / 8 * extra_duty_hrs`), total earnings, statutory PF (12% EE / 13% ER capped at ₹15,000 basic), ESI (0.75% EE / 3.25% ER for earnings ≤ ₹21,000), Professional Tax (₹200 if payable > ₹12,000), total deductions, and net pay. Updates `payroll_records` table.

---

### 2. `backend/smart_column_mapper.py` (Intelligent File Column Mapper)

Auto-detects and fuzzy-matches uploaded Excel/CSV column headers against canonical database field names.

- **`_normalise(s: str) -> str`**:
  Normalizes column headers by converting to lowercase, stripping whitespace, and stripping punctuation (`_`, `.`, `/`).
- **`_best_match(header: str, all_aliases: dict) -> tuple[Optional[str], float]`**:
  Compares a normalized column header against canonical aliases using `difflib.SequenceMatcher`. Automatically ignores serial number / index headers (e.g. `Sr. No`, `S.No`, `Index`). Returns `(mapped_field_name, confidence_score)`.
- **`detect_columns(headers: list[str]) -> list[dict]`**:
  Processes a list of raw column headers, resolves header claims using greedy highest-score sorting to prevent duplicate assignments, assigns confidence levels (`HIGH` ≥ 0.88, `MEDIUM` ≥ 0.65, `LOW` ≥ 0.45, `NONE` < 0.45), and provides top alternative field suggestions.
- **`mapping_to_rename_dict(mapping: list[dict]) -> dict[str, str]`**:
  Converts confirmed mapping results into a `{ "Source Column": "canonical_field" }` dictionary for Pandas DataFrame column renaming.

---

### 3. `backend/routers/ai_chat.py` (AI Assistant & Router)

Implements the hybrid Tier 1 (Rule Engine) and Tier 2 (LLM Function Calling) AI chat assistant.

- **`_dispatch_tool(name: str, arguments: dict) -> str`**:
  Executes tool calls requested by the LLM (`get_employee`, `get_all_employees`, `get_attendance_summary`, `get_absent_employees`, `get_overtime_report`, `get_payroll_summary`, `get_department_summary`, `update_all_employees_records`, `get_statutory_rules`, `generate_payslip_pdf_link`) and returns JSON strings.
- **`_fmt(val) -> str`**:
  Formats numbers into Indian Rupee currency strings (`₹1,234.56`).
- **`_num(val) -> float`**:
  Safely converts inputs to floats.
- **`_find_employee_by_name(name_query: str)`**:
  Searches active employees by partial first name, last name, or full name match.
- **`_build_payslip_response(emp: dict) -> str`**:
  Renders a full Markdown formatted inline payslip breakdown (Employee Details, Attendance, Earnings, Deductions, Net Pay, Download Links).
- **`_rule_based_response(message: str) -> Optional[str]`**:
  Tier 1 conversational & action parser:
  - Detects single-employee commands (`update rate for NUC0820 to 550`, `update advance for NUC0854 to 2500`).
  - **Whole-Company Default Rule**: If no employee code or name is present, evaluates commands for the **whole company** (`update per day rate to 600`, `update advance to 1000`, `update present days to 25`, `update setting in chat box`).
  - Handles greetings, gratitude, farewells, identity queries, statutory rules, attendance reports, overtime summaries, advances registers, and bulk payslip downloads.
- **`get_nvidia_client() -> Optional[OpenAI]`**:
  Loads environment variables from `backend/.env` and instantiates an OpenAI client pointing to NVIDIA Nemotron endpoints if a valid API key is present.
- **`get_model_name() -> str`**:
  Returns configured LLM model name from `NVIDIA_MODEL` environment variable.
- **`_nvidia_chat(client: OpenAI, message: str) -> str`**:
  Executes Tier 2 multi-turn LLM chat loop with tool calling capability up to 8 iterations.
- **`chat_endpoint(request: ChatRequest)`**:
  POST `/api/ai/chat` endpoint handler. Tries Tier 1 rule-based engine first; if unhandled, routes to Tier 2 LLM; falls back to helpful guided defaults. Returns responses as a text/plain `StreamingResponse`.

---

### 4. `backend/routers/payslip_pdf.py` (PDF & Document Generator)

Uses ReportLab to generate publication-quality PDF payslips and official compliance registers.

- **`COMPANY`**:
  Standardized company constant (`name`: `"Payroll AI"`).
- **`generate_payslip_pdf(emp: dict, company: dict = None) -> bytes`**:
  Constructs a single-page A4 PDF payslip containing company headers, employee details, attendance metrics, earnings table, deductions table, net pay banner, and signature blocks.
- **`generate_advances_register_pdf(employees_with_advances: list, pay_month: str, contractor: str, work_location: str, principal_employer: str) -> bytes`**:
  Generates official **Form XXII — Register of Advances** in landscape A4 format following statutory labour compliance guidelines. Includes contractor headers, multi-column tables, total summary footers, and signature blocks.
- **`get_single_payslip_pdf(emp_code: str)`**:
  GET `/api/payslip/pdf/{emp_code}` endpoint returning raw PDF bytes with `inline` or `attachment` disposition.
- **`get_bulk_payslips_zip()`**:
  GET `/api/payslip/bulk-zip` endpoint that compiles PDF payslips for all active employees into an in-memory ZIP archive and streams it for bulk download.
- **`download_advances_register(...)`**:
  GET `/api/payslip/advances-register` endpoint generating and returning the official Form XXII Register of Advances PDF.

---

### 5. `payroll-ai/src/app/login/page.tsx` (Two-Partition Login Portal)

Next.js frontend login route providing a modern split-screen layout.

- **Left Partition**: Styled with dark indigo slate gradient (`linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)`) matching app header cards. Showcases **Payroll AI** branding, platform summary, feature grid, and active enterprise node status.
- **Right Partition**: Styled with slate theme (`#f8fafc`). Features email/password credentials form and a **⚡ 1-Click HR Admin Quick Access** button (`admin@payrollai.com`) for immediate single-click access.

---

### 6. `backend/routers/upload.py`, `employees.py`, `payroll.py`, `attendance.py`, `leaves.py` & `main.py`

- **`_read_file_to_df()`**: Reads uploaded CSV/Excel files into a Pandas DataFrame with auto-detected header rows.
- **`upload_direct_import()`**: POST `/api/upload/direct-import` for inline file uploads in chat.
- **`read_all_employees()`**: GET `/api/employees/` returning all employee master & payroll records.
- **`upload_master_file()`**: POST `/api/employees/upload-master` uploading master spreadsheet.
- **`get_payroll_summary()`**: GET `/api/payroll/summary` returning organization-wide payroll summary.
- **`get_department_summary()`**: GET `/api/payroll/department-summary` returning department breakdown.
- **`get_attendance_summary()`**: GET `/api/attendance/summary` returning attendance metrics.
- **`get_absent_employees()`**: GET `/api/attendance/absent` returning absent list.
- **`get_overtime_report()`**: GET `/api/attendance/overtime` returning overtime report.
- **`lifespan(app: FastAPI)`**: Startup handler initializing SQLite DB schema and auto-loading custom master spreadsheet if present in `uploads/`.

---

## 🤖 AI Assistant Capabilities & Whole-Company Default Principle

The AI Assistant follows strict rules when interpreting user instructions:

```
                          User Sends Chat Command
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    Mentions Employee Code/Name             No Employee Mentioned
    (e.g., "NUC0820", "John")            (e.g., "Update rate to 600",
                 │                        "Update setting in chat")
                 ▼                                       ▼
     Single Employee Scope                    Whole-Company Scope
  (Modify only target record)              (Apply to ALL DB records)
```

1. **Per-Employee Operations**: Commands specifying employee codes (`NUC0820`) modify or view **only that individual record**.
2. **Whole-Company Default Operations**: Commands without employee references (e.g., *"Update per day rate to 600"*, *"Update advance to 1000"*, *"Update present days to 25"*, *"Update setting in chat"*) apply to **all employees across the organization**.

---

## 🌐 API & Frontend Route Reference Table

| Category | HTTP Method / Route | Path / Endpoint | Description |
|---|---|---|---|
| **Frontend Portal** | `GET` | `/login` | Two-partition login portal with HR Admin quick access |
| | `GET` | `/dashboard` | AI Assistant workspace & interactive chat |
| | `GET` | `/employees` | Employee directory & master table viewer |
| | `GET` | `/payroll` | Monthly payroll summary & net pay breakdowns |
| | `GET` | `/payslips` | Payslip generator & bulk ZIP downloader |
| | `GET` | `/reports` | Statutory reports & Form XXII Advances PDF builder |
| | `GET` | `/settings` | Register defaults & company configuration |
| **AI Chat API** | `POST` | `/api/ai/chat` | Main streaming chat endpoint for rule-based & LLM actions |
| **Spreadsheet Upload** | `POST` | `/api/upload/preview` | Preview file headers and auto-detected column mapping |
| | `POST` | `/api/upload/confirm` | Confirm column mapping and import records into DB |
| | `POST` | `/api/upload/direct-import` | Direct import of Excel/CSV directly inside AI Chat |
| | `GET` | `/api/upload/status` | Check if payroll data is loaded and get record count |
| | `POST` | `/api/upload/reset` | Clear all payroll data from database |
| **Payslips & Reports**| `GET` | `/api/payslip/pdf/{emp_code}` | Download single employee PDF payslip |
| | `GET` | `/api/payslip/bulk-zip` | Download all employee PDF payslips as a ZIP archive |
| | `GET` | `/api/payslip/advances-register` | Download official Form XXII Register of Advances PDF |
| **Employees** | `GET` | `/api/employees/` | Retrieve all employee master & payroll records |
| | `GET` | `/api/employees/{emp_code}` | Retrieve single employee record by code |
| | `POST` | `/api/employees/upload-master` | Upload master Excel spreadsheet |
| | `GET` | `/api/employees/upload-status` | Get master file upload metadata |
| | `GET` | `/api/employees/download-current` | Download active master Excel spreadsheet |
| **Payroll Metrics** | `GET` | `/api/payroll/summary` | Get organization-wide total gross, net pay, PF, ESI |
| | `GET` | `/api/payroll/department-summary`| Get department-wise salary breakdowns |
| **Attendance** | `GET` | `/api/attendance/summary` | Get attendance summary (Present, Absent, Overtime) |
| | `GET` | `/api/attendance/absent` | Get list of absent employees |
| | `GET` | `/api/attendance/overtime` | Get overtime report with extra hours and pay |
| **System** | `GET` | `/health` | System health check endpoint |

---

## ⚡ Installation & Local Setup Guide

Follow these steps to set up and run Payroll AI on your local machine.

### Prerequisites
- **Python**: Version 3.9 or higher
- **Node.js**: Version 18.0 or higher
- **npm**: Package manager (included with Node.js)

---

### Step 1: Backend Setup (FastAPI)

1. Navigate to the project root directory:
   ```bash
   cd "Rag Payroll"
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   Create a `.env` file in the `backend/` directory (or edit `backend/.env`):
   ```env
   NVIDIA_API_KEY=your_optional_nvidia_api_key_here
   NVIDIA_MODEL=nvidia/nemotron-4-340b-instruct
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   ```

6. Start the FastAPI backend server:
   ```bash
   python backend/main.py
   ```
   The backend API server will be available at **`http://127.0.0.1:8000`**. You can view interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

### Step 2: Frontend Setup (Next.js)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd "Rag Payroll/payroll-ai"
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Access the web application:
   Open your browser and navigate to **`http://localhost:3000`** (auto-redirects to **`http://localhost:3000/login`**).

---

## 🧪 Running Verification Tests

To verify backend initialization and routing:

```bash
.\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); import database; database.init_db(); print('Database verified cleanly.')"
```

To test the frontend build:

```bash
cd payroll-ai
npm run build
```

---

## 📜 License

This project is released under the **MIT License**. Feel free to use, modify, and distribute it for personal or commercial applications.

---

<p align="center">
  <b>Payroll AI</b> — Empowering HR Management with Smart Automation & AI Co-Pilots.
</p>
