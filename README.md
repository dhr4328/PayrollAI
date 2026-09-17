# Payroll AI
### ⚡ AI-Powered RAG Payroll & HR Management Platform

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Why I Built It](#-why-i-built-it)
- [System Architecture](#️-system-architecture)
- [AI & RAG Architecture](#-ai--rag-architecture)
- [Key Features](#-key-features)
- [Statutory Compliance & Payroll Calculation Engine](#-statutory-compliance--payroll-calculation-engine)
- [Project Directory Structure](#-project-directory-structure)
- [Tech Stack](#️-tech-stack)
- [Installation & Quickstart](#-installation--quickstart)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Testing & Verification](#-testing--verification)
- [Example AI Chat Commands](#-example-ai-chat-commands)
- [Future Roadmap](#-future-roadmap)
- [Author & Acknowledgements](#-author--acknowledgements)

---

## 📌 Overview

**Payroll AI** is an enterprise-grade, AI-first Payroll & HR Management Platform engineered to eliminate manual salary calculations, attendance headaches, statutory tax errors, and repetitive paperwork.

By pairing a **FastAPI** backend with a modern **Next.js 16 (React 19)** frontend, **Payroll AI** introduces a **Dual-Tier Hybrid AI Engine** with **RAG (Retrieval-Augmented Generation) contextual vector memory**. HR managers and business owners can execute company-wide wage updates, query attendance metrics, inspect payslips, and generate legal compliance documents (like **Form XXII Register of Advances**) using natural language.

---

## 💡 Why I Built It

Traditional payroll in small-to-midsize enterprises (SMEs) and contractor-heavy factories is broken:

1. **Messy Spreadsheets**: Every contractor and department submits attendance in different formats with arbitrary column headers (`Emp_ID`, `Staff Code`, `Per Day Rate`, `Daily Wages`). HR spends hours reformatting files.
2. **Statutory Non-Compliance Risk**: Miscalculating Provident Fund (PF capped at ₹15,000 basic), Employee State Insurance (ESI ≤ ₹21,000 gross limit), or state-specific Professional Tax (PT) incurs severe statutory fines.
3. **Rigid & Clunky Interfaces**: Standard HR ERPs require clicking through 10+ nested forms to perform a basic batch wage update.
4. **Manual Document Preparation**: Generating monthly payslips and mandatory statutory registers (such as Form XXII Advances Register) involves tedious mail merges and spreadsheet copy-pasting.

**Payroll AI solves this** by acting as an intelligent HR Co-pilot that understands fuzzy spreadsheets, enforces statutory laws in mathematical code, maintains session-scoped RAG memory, and outputs publication-grade PDFs on demand.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       Next.js 16 / React 19 UI         │
                               │  (Port 3000 / App Router & Tailwind)   │
                               └──────────────────┬─────────────────────┘
                                                  │ REST APIs / Streams
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │            FastAPI Backend             │
                               │          (Port 8000 / Uvicorn)         │
                               └──────┬──────────────────────┬──────────┘
                                      │                      │
                   ┌──────────────────┴─────────┐  ┌─────────┴───────────────────┐
                   │    Hybrid AI & RAG Engine  │  │   Smart Column Mapper     │
                   │ (Tier 1 Rule + Tier 2 LLM  │  │  (Fuzzy Header Matching)  │
                   │  + Vector Store Memory)    │  │                           │
                   └──────────────────┬─────────┘  └─────────┬───────────────────┘
                                      │                      │
                                      ▼                      ▼
                               ┌────────────────────────────────────────┐
                               │         SQLite DB & ReportLab PDF      │
                               │ (payroll.db & Form XXII PDF Engine)    │
                               └────────────────────────────────────────┘
```

---

## 🧠 AI & RAG Architecture

The platform uses a specialized multi-tiered pipeline balancing sub-millisecond execution with conversational intelligence:

```
                            User Sends Chat Command
                                       │
                      ┌────────────────┴────────────────┐
                      │ 1. Vector DB Context Retrieval   │
                      │    (SentenceTransformers / RAG) │
                      └────────────────┬────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                 Pattern Matched?             Unstructured Query?
                         │                           │
                         ▼                           ▼
             ┌───────────────────────┐   ┌───────────────────────┐
             │ Tier 1: Rule Engine   │   │ Tier 2: Nemotron LLM  │
             │ (Instant Execution)   │   │ (Tool Function Calls) │
             └───────────┬───────────┘   └───────────┬───────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       ▼
                       SQL Recalculation & Execution
                                       ▼
                        Save Turn to Vector DB Store
```

### 1. RAG Vector Store & Contextual Memory (`backend/vector_db.py`)
- **Embeddings**: Uses `sentence-transformers/all-MiniLM-L6-v2` to produce 384-dimensional dense vector embeddings (with a built-in lightweight hash-based fallback vectorizer for offline/low-resource environments).
- **Similarity Search**: Performs real-time cosine similarity search over previous chat turns within the active session.
- **Session Isolation & Privacy**: Every user session is isolated (`session_id`). When an HR admin logs out, `/api/ai/chat/logout` purges all session messages and vector embeddings from `chat_vector_store`.

### 2. Tier 1: Deterministic Smart Rule Engine
- Runs in **< 5ms** with zero API token cost.
- Matches regex intents for high-frequency HR actions: wage updates, attendance queries, overtime reports, individual payslip previews, and PDF downloads.
- Directly handles single-employee modifications (`"update rate for NUC0820 to 550"`) and organization-wide modifications (`"update per day rate to 600"`).

### 3. Tier 2: NVIDIA Nemotron LLM with Tool Calling
- Triggered for natural language reasoning and unstructured queries.
- Equipped with function-calling tools:
  - `get_employee(emp_code)`
  - `get_payroll_summary()`
  - `update_all_employees_records(field, value)`
  - `get_overtime_report()`
  - `get_attendance_summary()`
- Runs multi-turn tool calling loops (up to 8 iterations) to gather SQL data and assemble answers.

### 4. Whole-Company Default Principle
When an update command is given without a specific employee code (e.g., *"Update per day rate to 600"* or *"Update advance to 1000"*), the system interprets it as a **company-wide policy update**, modifies all active records in `payroll.db`, and automatically re-runs full statutory calculations for every employee.

---

## ✨ Key Features

- **🔐 Split-Screen Auth Portal**: Clean two-partition interface with brand highlights and a **1-Click HR Admin Quick Access** demo bypass.
- **🤖 Conversational HR Copilot**: Chat interface supporting real-time streaming, quick-action chips, and persistent RAG memory.
- **🗺️ Smart Column Mapper**: Uses Python `difflib.SequenceMatcher` to fuzzy-match unpredictable Excel headers (e.g., `Staff ID`, `Daily Rate`, `OT Hours`) to canonical database schema fields with confidence scoring.
- **📊 Statutory Tax Engine**: Automatically computes PF, ESI, Professional Tax, Overtime, and Net Pay compliant with Indian labour regulations.
- **📑 ReportLab PDF Generator**: Produces publication-grade, individual monthly payslips with earnings, deductions, net pay in words, and company headers.
- **📋 Statutory Form XXII Register**: Instant generation of official **Form XXII - Register of Advances** (A4 Landscape) compliant with Contract Labour (Regulation and Abolition) Central Rules.
- **📦 1-Click Bulk ZIP Export**: Compiles all employee payslips into a single organized ZIP archive.
- **📈 Interactive Analytics Dashboards**: Visual breakdown of payroll expenditure, department allocations, attendance ratios, and overtime distribution via Recharts.

---

## 📊 Statutory Compliance & Payroll Calculation Engine

The engine mathematically recalculates employee payroll in `backend/database.py` using official statutory guidelines:

| Statutory Head | Statutory Rule & Calculation Formula | Limit / Threshold |
|---|---|---|
| **Provident Fund (Employee)** | `ee_pf = round(min(salary, 15000) * 0.12, 2)` | 12% capped at ₹15,000 basic |
| **Provident Fund (Employer)** | `er_pf = round(min(salary, 15000) * 0.13, 2)` | 13% capped at ₹15,000 basic |
| **ESI (Employee)** | `esi_ee = round(total_earning * 0.0075, 2)` if `total_earning <= 21000` else `0.0` | 0.75% for gross ≤ ₹21,000 |
| **ESI (Employer)** | `esi_er = round(total_earning * 0.0325, 2)` if `total_earning <= 21000` else `0.0` | 3.25% for gross ≤ ₹21,000 |
| **Professional Tax (PT)** | `pt = 200.0` if `total_earning > 12000` else `0.0` | Standard state slab deduction |
| **Overtime Pay** | `extra_pay = round((per_day_rate / 8.0) * extra_duty_hrs, 2)` | Standard 8-hour workday basis |
| **Gross Salary** | `salary = round(per_day_rate * paid_days, 2)` | Daily rate × verified days |
| **Total Earnings** | `total_earning = salary + extra_pay + difference_amount` | Base salary + overtime + allowances |
| **Net Pay** | `net_pay = total_payable_salary - (ee_pf + esi_ee + pt + advances + other_deductions)` | Take-home compensation |

---

## 📁 Project Directory Structure

```plaintext
Rag Payroll/
├── backend/                             # FastAPI Python Backend
│   ├── main.py                          # Application entrypoint & CORS configuration
│   ├── database.py                      # SQLite schemas, CRUD operations, & payroll recalculation logic
│   ├── vector_db.py                     # SentenceTransformers RAG vector store & cosine similarity search
│   ├── smart_column_mapper.py           # Fuzzy header matcher using difflib for Excel/CSV uploads
│   ├── payroll.db                       # SQLite database file
│   ├── requirements.txt                 # Backend Python package requirements
│   ├── routers/
│   │   ├── ai_chat.py                   # Hybrid AI engine (Tier 1 Rules + Tier 2 Nemotron + RAG endpoints)
│   │   ├── employees.py                 # Employee directory CRUD and Excel download
│   │   ├── payroll.py                   # Payroll summaries & department metrics
│   │   ├── attendance.py                # Attendance summaries, absent records, overtime reports
│   │   ├── leaves.py                    # Leave balance queries
│   │   ├── payslip_pdf.py               # ReportLab PDF generation for individual payslips & Form XXII
│   │   └── upload.py                    # File preview, fuzzy column confirmation, & direct imports
│   ├── tests/
│   │   └── test_vector_db.py            # Unit tests for vector DB workflows & session purge
│   └── uploads/                         # Temporary store for uploaded master spreadsheets
│
├── payroll-ai/                          # Next.js 16 + React 19 Frontend
│   ├── package.json                     # Frontend dependencies & scripts
│   ├── tsconfig.json                    # TypeScript compiler options
│   └── src/
│       ├── app/
│       │   ├── layout.tsx               # Root layout & font definitions
│       │   ├── page.tsx                 # Auto-redirect to /login
│       │   ├── login/                   # Split-screen login portal with 1-click admin access
│       │   ├── dashboard/               # AI Chat copilot workspace with live streaming & action cards
│       │   ├── employees/               # Master employee directory & filterable data tables
│       │   ├── payroll/                 # Org-wide payroll overview & tax deduction breakdowns
│       │   ├── payslips/                # Payslip studio with PDF preview & bulk ZIP download
│       │   ├── compliance/              # Statutory Form XXII Register of Advances viewer & export
│       │   ├── reports/                 # Attendance, absent lists, and overtime analytics
│       │   └── settings/                # System settings & configuration
│       ├── components/                  # Reusable UI components (Modals, Navbars, Header, Cards)
│       └── lib/                         # Shared utilities, API client, & formatters
│
├── 7. NR_ADVANCE_REGISTER.xlsx          # Sample register of advances spreadsheet
├── demo.xlsx                            # Sample master employee & payroll Excel dataset
├── requirements.txt                     # Root dependencies definition
├── vercel.json                          # Vercel deployment configuration
└── README.md                            # Comprehensive project documentation
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Markdown**: `react-markdown` & `remark-gfm`

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Database**: [SQLite 3](https://www.sqlite.org/) with automated recalculation triggers
- **Spreadsheet Processing**: Pandas, NumPy, OpenPyXL

### **AI & RAG**
- **RAG Vector Database**: SQLite store + `sentence-transformers` (`all-MiniLM-L6-v2`) with cosine similarity
- **LLM Provider**: NVIDIA Nemotron-4 340B Instruct (via `openai` SDK)
- **Fuzzy Header Matching**: Python `difflib.SequenceMatcher`

### **PDF & Publishing**
- **PDF Engine**: [ReportLab](https://www.reportlab.com/) (Platypus Flowables, Tables, Paragraphs)
- **Archive Engine**: Python `zipfile` for high-speed bulk payslip compilation

---

## ⚡ Installation & Quickstart

### Prerequisites
- **Python**: `3.9` or higher
- **Node.js**: `18.0` or higher
- **npm**: Included with Node.js

---

### Step 1: Clone Repository
```bash
git clone https://github.com/dhr4328/PayrollAI.git
cd "Rag Payroll"
```

---

### Step 2: Backend Setup (FastAPI)

1. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Configure environment variables in `backend/.env` (optional, defaults provided):
   ```env
   NVIDIA_API_KEY=your_key_here
   NVIDIA_MODEL=nvidia/nemotron-4-340b-instruct
   HOST=127.0.0.1
   PORT=8000
   ```

4. Start the FastAPI backend:
   ```bash
   python backend/main.py
   ```
   Backend will run at **`http://127.0.0.1:8000`** (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).

---

### Step 3: Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd payroll-ai
   ```

2. Install Node.js packages:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open **`http://localhost:3000`** in your browser.
   - Click **⚡ Quick Demo Access (HR Admin)** on the login screen to enter immediately.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
# Optional: NVIDIA Nemotron API Credentials (Tier 1 Rule Engine operates 100% offline without this)
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_MODEL=nvidia/nemotron-4-340b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Server Settings
HOST=127.0.0.1
PORT=8000
```

### Frontend (`payroll-ai/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 📡 API Reference

### 1. AI Assistant & RAG Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Streaming chat endpoint with RAG context & tool execution |
| `GET` | `/api/ai/chat/history` | Retrieve session message history and vector metadata |
| `POST` | `/api/ai/chat/logout` | Purge session chat records and vector embeddings upon logout |

### 2. Employee Directory
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees/` | List all employee master records and status |
| `GET` | `/api/employees/{emp_code}` | Retrieve single employee master profile |
| `POST` | `/api/employees/upload-master` | Upload master Excel employee spreadsheet |
| `GET` | `/api/employees/download-current` | Export active employee database to Excel |

### 3. Payroll & Statutory Metrics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payroll/summary` | Organization-wide gross pay, net pay, PF, and ESI metrics |
| `GET` | `/api/payroll/department-summary` | Department-wise wage and deduction distributions |

### 4. Attendance & Overtime
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/attendance/summary` | Attendance totals (Present, Absent, Overtime counts) |
| `GET` | `/api/attendance/absent` | List of absent personnel |
| `GET` | `/api/attendance/overtime` | Overtime report with extra duty hours and calculated pay |

### 5. Payslips & Document Generation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payslip/pdf/{emp_code}` | Generate and download single employee PDF payslip |
| `GET` | `/api/payslip/bulk-zip` | Download complete ZIP bundle of all employee PDF payslips |
| `GET` | `/api/payslip/advances-register` | Download official Form XXII Register of Advances PDF |

### 6. Spreadsheet Upload & Column Mapper
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload/preview` | Preview uploaded spreadsheet and auto-detected fuzzy column mapping |
| `POST` | `/api/upload/confirm` | Confirm column mapping and import data into SQLite |
| `POST` | `/api/upload/direct-import` | Direct inline file import via AI Chat |
| `GET` | `/api/upload/status` | Check active database load status and record count |
| `POST` | `/api/upload/reset` | Clear all payroll data from database |

---

## 🧪 Testing & Verification

Run the automated vector database and RAG session test:

```bash
# From workspace root with activated venv:
python backend/tests/test_vector_db.py
```

This verifies:
1. SQLite vector database initialization (`chat_vector_store`).
2. Embedding generation & multi-turn message storage.
3. Cosine similarity semantic search over chat history.
4. Session-scoped message isolation.
5. Clean vector memory purge upon user logout.

---

## 💬 Example AI Chat Commands

Here are sample commands you can type directly into the AI Copilot:

| Category | Sample Command |
|---|---|
| **Bulk Updates** | `Update per day rate to 600` *(applies to all employees)* |
| **Advances** | `Update advance to 1000 for all` |
| **Single Employee** | `Update rate for NUC0820 to 550` |
| **Payslips** | `Show payslip for NUC0820` |
| **PDF Downloads** | `Download PDF for NUC0820` |
| **Statutory Forms** | `Generate Form XXII register of advances` |
| **Bulk Payslips** | `Download all payslips` *(generates ZIP)* |
| **Attendance** | `Show attendance summary` or `Who is absent today?` |
| **Overtime** | `Show overtime report for Assembly department` |
| **Payroll Totals** | `Show payroll summary` |

---

## 🚀 Future Roadmap

- [ ] **Multi-Tenant Workspaces**: RBAC and separate workspaces for multiple client companies.
- [ ] **Automated WhatsApp / Email Delivery**: Send monthly PDF payslips straight to employee WhatsApp numbers.
- [ ] **Biometric Hardware Sync**: Native integration with ZKTeco & Hikvision fingerprint/facial terminals.
- [ ] **Direct Salary Disbursal**: One-click corporate payouts via RazorpayX or bank APIs.
- [ ] **Multi-Country Statutory Modules**: Expand support to US (W-2, 401k), UK (PAYE), and UAE (WPS).

---

## 👨‍💻 Author & Acknowledgements

- **Repository**: [https://github.com/dhr4328/PayrollAI](https://github.com/dhr4328/PayrollAI)
- **Built with**: FastAPI, Next.js 16, React 19, SQLite, ReportLab, and NVIDIA Nemotron.
- **License**: MIT License.
