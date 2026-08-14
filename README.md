# Payroll AI
### ⚡ AI-Powered Payroll & HR Management Platform

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🎬 [Demo Screenshot / GIF]

![Payroll AI Dashboard Demo](https://raw.githubusercontent.com/dhr4328/PayrollAI/main/assets/demo-preview.gif)

> **Live Workspace Preview**: Experience real-time conversational payroll management, automatic statutory tax calculations, fuzzy-mapped spreadsheet imports, and instant PDF payslip downloads.

---

## 📌 Overview

**Payroll AI** is an enterprise-grade, AI-first Payroll & HR Management Platform engineered to simplify and automate end-to-end salary processing, attendance logging, statutory tax compliance (PF, ESI, Professional Tax), spreadsheet imports, and legal document generation.

By combining a high-performance **FastAPI** backend with a modern **Next.js 16 (React 19)** web interface and a **Dual-Tier Hybrid AI Engine** (Tier 1 Smart Rule Engine + Tier 2 NVIDIA Nemotron LLM Function Calling), Payroll AI enables HR professionals and business owners to manage enterprise payroll using simple, natural language commands.

Whether updating per-day wages across an entire organization, querying individual employee payslips, calculating statutory deductions, or generating official government compliance reports like **Form XXII Register of Advances**, Payroll AI delivers speed, accuracy, and ease of use.

---

## 💡 Why I Built It

Traditional payroll management software in SMEs and modern enterprises remains fragmented, manual, and prone to costly human errors:

1. **Excel Dependency & Mismatched Columns**: HR managers constantly battle raw spreadsheets with non-standard column headers (`Emp_ID`, `Staff Code`, `Per Day Rate`, `Daily Wages`), leading to hours of tedious reformatting.
2. **Complex Statutory Compliance Rules**: Manual computation of Provident Fund (PF capped at ₹15,000), Employee State Insurance (ESI brackets up to ₹21,000 gross), and state-specific Professional Tax (PT) often leads to filing errors and compliance penalties.
3. **Rigid Software Interfaces**: Most legacy HR tools require navigating through 10+ nested form pages just to execute bulk wage updates or verify attendance logs.
4. **Time-Consuming Document Generation**: Creating individual monthly payslips and official register documents (such as Form XXII) requires manual mail merges or external PDF software.

**Payroll AI** was created to bridge this gap by bringing **conversational AI co-pilots** to human resources. HR teams can interact with their database in plain English (*"Update per day rate to 600"*, *"Show overtime report for Assembly department"*, *"Generate Form XXII Advances Register"*), while maintaining strict mathematical precision, regulatory compliance, and instant PDF outputs.

---

## ✨ Key Features

- **🔐 Split-Screen Login Portal**: Features a two-partition design with company brand showcase on the left and a credentials form with a **⚡ 1-Click HR Admin Quick Access** button on the right.
- **🤖 Dual-Tier Hybrid AI Assistant**:
  - **Tier 1 (Smart Rule Engine)**: Sub-millisecond deterministic intent recognition for formula evaluation, instant wage updates, attendance reports, and statutory queries.
  - **Tier 2 (NVIDIA Nemotron LLM)**: Multi-turn function-calling LLM capable of complex query reasoning and dynamic database tool dispatching.
- **🌐 Whole-Company Default Principle**: Intelligent command scoping where updates without a specific employee ID automatically apply company-wide and trigger org-wide payroll recalculations.
- **🗺️ Smart Column Mapper**: Integrated fuzzy string matching (`difflib`) that automatically maps arbitrary uploaded spreadsheet headers to canonical database fields with confidence scoring.
- **📊 Dynamic Statutory Tax Engine**: Real-time calculations for:
  - **Provident Fund (PF)**: Employee (12%) & Employer (13%) capped at ₹15,000 basic wage.
  - **Employee State Insurance (ESI)**: Employee (0.75%) & Employer (3.25%) for gross earnings ≤ ₹21,000.
  - **Professional Tax (PT)**: Automatic slab deduction (₹200 for gross > ₹12,000).
  - **Overtime Pay**: Precise hourly overtime calculation based on per-day wage rates.
- **📄 ReportLab PDF Engine**: Renders pixel-perfect, publication-ready individual PDF payslips and official **Form XXII Register of Advances** (Landscape A4 format).
- **📦 Bulk ZIP Export**: One-click archive generation compiling all employee payslip PDFs into a single downloadable ZIP file.
- **📈 Interactive Analytics Dashboards**: Visual breakdown of total payroll expenditure, gross vs. net pay distribution, department summaries, attendance counts, and absent lists using Recharts.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       Next.js 16 / React 19 UI         │
                               │  (Port 3000 / App Router & Tailwind)   │
                               └──────────────────┬─────────────────────┘
                                                  │ REST APIs & Streams
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │            FastAPI Backend             │
                               │          (Port 8000 / Uvicorn)         │
                               └──────┬──────────────────────┬──────────┘
                                      │                      │
                   ┌──────────────────┴─────────┐  ┌─────────┴───────────────────┐
                   │    Hybrid AI Engine        │  │   Smart Column Mapper     │
                   │ (Tier 1 Rule + Tier 2 LLM) │  │  (Fuzzy Header Matching)  │
                   └──────────────────┬─────────┘  └─────────┬───────────────────┘
                                      │                      │
                                      ▼                      ▼
                               ┌────────────────────────────────────────┐
                               │         SQLite DB & ReportLab PDF      │
                               │ (payroll.db & Form XXII PDF Engine)    │
                               └────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `clsx`, `tailwind-merge`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts & Data**: [Recharts](https://recharts.org/)
- **Markdown Rendering**: `react-markdown`, `remark-gfm`

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Database**: [SQLite 3](https://www.sqlite.org/) with custom trigger-based payroll recalculations
- **Spreadsheet & Data**: Pandas, NumPy, OpenPyXL

### **AI & NLP**
- **LLM Provider**: NVIDIA Nemotron-4 340B Instruct (via `openai` Python SDK)
- **Fuzzy Matching**: Python `difflib.SequenceMatcher`

### **PDF & Document Engine**
- **PDF Canvas**: [ReportLab](https://www.reportlab.com/) (Platypus Flowables, Paragraphs, Tables)
- **Compression**: Python `zipfile` module for bulk exports

---

## 🧠 AI Architecture

The platform employs a two-tier hybrid execution pipeline designed for zero latency on standard commands and maximum intelligence for complex requests:

```
                            User Sends Chat Command
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
```

### **1. Tier 1: Smart Rule Engine**
- Executes in under **5ms** without API token costs.
- Recognizes direct regex patterns for intent detection (e.g., wage updates, attendance queries, statutory rules, PDF triggers).
- Directly handles single-employee modifications (`update rate for NUC0820 to 550`) and organization-wide modifications (`update per day rate to 600`).

### **2. Tier 2: NVIDIA Nemotron LLM (Tool Calling)**
- Triggered when Tier 1 confidence is low or complex conversational reasoning is required.
- Equipped with function-calling tools (`get_employee`, `get_payroll_summary`, `update_all_employees_records`, `get_overtime_report`, etc.).
- Multi-turn tool execution loop runs up to 8 iterations to fetch data, execute updates, and assemble answers.

### **3. Whole-Company Default Principle**
When a user issues an update command without specifying an employee ID (e.g., *"Update per day rate to 600"* or *"Update advance to 1000"*), the AI assistant interprets this as an **organization-wide adjustment**. It updates all active records in `payroll.db` and automatically triggers `recalculate_employee_payroll()` for every employee.

---

## 🖼️ Screenshots

| View | Description |
|---|---|
| **🔐 Two-Partition Login** | Split screen with brand showcase on left & 1-click HR Admin quick access on right |
| **💬 AI Assistant Workspace** | Conversational chat panel with live stream responses & action cards |
| **👥 Employee Directory** | Filterable table showing master records, departments, and category breakdowns |
| **📊 Payroll Metrics** | Org-wide salary totals, net pay distributions, and department breakdowns |
| **📑 Payslip Generator** | Individual payslip viewer with inline PDF preview and download buttons |
| **📋 Form XXII Register** | Statutory Register of Advances report generator with A4 landscape exports |

---

## ⚡ Installation

### Prerequisites
- **Python**: Version `3.9` or higher
- **Node.js**: Version `18.0` or higher
- **npm**: Package manager (included with Node.js)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/dhr4328/PayrollAI.git
cd PayrollAI
```

---

### Step 2: Backend Setup (FastAPI)

1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (see [Environment Variables](#-environment-variables)).

5. Start the FastAPI backend server:
   ```bash
   python backend/main.py
   ```
   The backend API will run at **`http://127.0.0.1:8000`** (Swagger docs available at `http://127.0.0.1:8000/docs`).

---

### Step 3: Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd payroll-ai
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to **`http://localhost:3000`** (auto-redirects to `/login`).

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# NVIDIA Nemotron API Credentials (Optional - Tier 1 Rule Engine works offline)
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_MODEL=nvidia/nemotron-4-340b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Backend Server Configuration
HOST=127.0.0.1
PORT=8000
```

For the frontend (`payroll-ai/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 📡 API Documentation

### **1. AI Chat API**
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Main streaming chat endpoint for rule-based & LLM actions |

### **2. Employee Management API**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees/` | List all employee master & payroll records |
| `GET` | `/api/employees/{emp_code}` | Retrieve single employee profile details |
| `POST` | `/api/employees/upload-master` | Upload master Excel spreadsheet |
| `GET` | `/api/employees/download-current` | Export current active employee master Excel |

### **3. Payroll & Metrics API**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payroll/summary` | Organization-wide gross pay, net pay, PF, ESI summary |
| `GET` | `/api/payroll/department-summary` | Department-wise salary breakdown metrics |

### **4. Attendance & Overtime API**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/attendance/summary` | Attendance metrics (Present, Absent, Overtime counts) |
| `GET` | `/api/attendance/absent` | List of absent employees |
| `GET` | `/api/attendance/overtime` | Overtime report with extra duty hours & pay |

### **5. Payslips & PDF Generation API**
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payslip/pdf/{emp_code}` | Download single employee PDF payslip |
| `GET` | `/api/payslip/bulk-zip` | Download ZIP archive of all employee PDF payslips |
| `GET` | `/api/payslip/advances-register` | Download official Form XXII Register of Advances PDF |

### **6. Spreadsheet Upload & Column Mapper API**
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload/preview` | Preview file headers & auto-detected fuzzy column mapping |
| `POST` | `/api/upload/confirm` | Confirm column mapping & import data into SQLite |
| `POST` | `/api/upload/direct-import` | Direct inline spreadsheet import within AI Chat |
| `GET` | `/api/upload/status` | Check dataset load status and active record count |
| `POST` | `/api/upload/reset` | Clear all payroll data from database |

---

## 🚀 Future Improvements

- [ ] **Multi-Tenant Support**: Support multiple organization workspaces with role-based access control (RBAC).
- [ ] **Automated Email & WhatsApp Delivery**: Send monthly PDF payslips directly to employees via `fastapi-mail` and WhatsApp Business API.
- [ ] **Biometric Hardware Sync**: Native integration with ZKTeco and Hikvision attendance terminals for real-time check-in logs.
- [ ] **Direct Bank Payout Integration**: One-click salary disbursal via RazorpayX and corporate banking APIs.
- [ ] **Multi-Country Statutory Engines**: Adaptable tax compliance modules for US (W-2 / 401k), UK (PAYE), and UAE (WPS).

---

## 👨‍💻 Author

**Payroll AI Team**  
*Built with ❤️ for HR teams, finance managers, and modern enterprises.*

- **GitHub**: [@dhr4328](https://github.com/dhr4328)
- **Repository**: [https://github.com/dhr4328/PayrollAI](https://github.com/dhr4328/PayrollAI)
- **Project**: Payroll AI — AI-Powered Payroll & HR Management Platform

---

<p align="center">
  <b>Payroll AI</b> — Empowering HR Management with Smart Automation & AI Co-Pilots.
</p>
