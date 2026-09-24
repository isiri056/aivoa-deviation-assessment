# AI-Powered Deviation Intake Module

> **Enterprise GxP Deviation Management for Pharmaceutical Active Pharmaceutical Ingredient (API) Manufacturing**  
> Built for the **Aivoa.ai** Technical Assessment.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-FF6F00?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-gpt--oss--120b-F55036)](https://groq.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-State-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)

---

## 1. Executive Summary & Purpose

The **AI-Powered Deviation Intake Module** is a specialized quality assurance system designed for pharmaceutical Active Pharmaceutical Ingredient (API) manufacturing plants. In GMP-compliant facilities adhering to **ICH Q7** (Good Manufacturing Practice for APIs) and **ICH Q9** (Quality Risk Management), logging a deviation traditionally requires complex manual form entry prone to operator fatigue and omissions.

This module fundamentally reverses that burden:
- **Zero initial manual form-filling**: The user provides unstructured input (natural-language incident logs, operator shift notes, or uploaded PDF/TXT reports) to the **AI Deviation Assistant**.
- **Autonomous structured extraction**: LangGraph coordinates Groq LLMs (`openai/gpt-oss-120b`) to extract 10 standardized GxP fields.
- **Automated GxP Quality Risk Assessment**: Automatically determines initial **Impact** (High, Medium, Low) and **Severity** (Critical, Major, Minor), accompanied by technical justification and recommended containment next steps.
- **Conversational Delta-Editing**: The user can iteratively modify fields via natural language (e.g. *"Actually, the batch number is API-260925 and affected quantity is 50 kg"*). The system modifies **only** the target fields, strictly preserving all untouched data.
- **Human-in-the-loop review**: The form remains fully interactive and editable before persisting to the database.

---

## 2. Technology Stack

| Layer | Technologies | Rationale |
|---|---|---|
| **Frontend** | React 18, Redux Toolkit, Axios, Tailwind CSS, Lucide Icons | Responsive 2-column QMS layout, atomic state updates, delta-merging, visual AI badges |
| **Backend API** | Python 3.9+, FastAPI, Pydantic v2, Uvicorn | High-performance asynchronous REST endpoints with strict type validation |
| **AI Orchestration** | LangGraph, LangChain Core, LangChain Groq | Multi-step agent graph with intent routing, structured Pydantic outputs, and risk evaluation |
| **LLM Inference** | Groq API (`openai/gpt-oss-120b`) | Fast LLM inference for structured extraction, conversational editing, and GxP risk assessment |
| **Database** | SQLAlchemy 2.0 (SQLite dev fallback / PostgreSQL ready) | Environment-configured persistence with audit timestamps |
| **Document Parser** | `pypdf`, `python-multipart` | Lightweight PDF stream parsing and TXT decoding with a 10MB upload limit |

---

## 3. System Architecture & Workflow

```
Unstructured Input (Natural Language / PDF / TXT)
                        │
                        ▼
      FastAPI Router (/api/ai/log-deviation, edit, extract-document)
                        │
                        ▼
       LangGraph Multi-Agent Workflow
  ┌─────────────────────────────────────────────────────────────┐
  │ START                                                       │
  │   │                                                         │
  │   ▼                                                         │
  │ [Detect Intent] ──► {log_deviation, edit_deviation, doc}   │
  │   │                                                         │
  │   ├──► [Extract Fields] (Pydantic DeviationFields)         │
  │   │                                                         │
  │   └──► [Edit Fields] (Selective delta update)               │
  │          │                                                  │
  │          ▼                                                  │
  │        [Assess Risk] (ICH Q9 Impact & Severity Assessment)  │
  │          │                                                  │
  │          ▼                                                  │
  │        [Format Response] (Structured JSON payload)          │
  │   │                                                         │
  │   ▼                                                         │
  │  END                                                        │
  └─────────────────────────────────────────────────────────────┘
                        │
                        ▼
   Redux Toolkit Store (Preserves untouched fields on edit)
                        │
                        ▼
   Interactive React Form (Editable Left UI + Conversational Right UI)
                        │
                        ▼
   Database Persistence (/api/deviations -> SQLAlchemy)
```

---

## 4. Deviation Data Model (10 Standard Form Fields)

The application models the following 10 pharmaceutical fields:

1. **Site / Plant** (`site_plant`)*: Manufacturing plant, facility, or cleanroom block.
2. **Date of Occurrence** (`date_of_occurrence`)*: Date when excursion occurred (YYYY-MM-DD).
3. **Title / Short Description** (`title`)*: Standardized GxP incident title.
4. **Source** (`source`)*: Detection source (Production Operator, SCADA Alert, QC Lab, In-Process Control).
5. **Related Product / Material** (`product_material`): Active Pharmaceutical Ingredient (e.g. Paracetamol API).
6. **Batch / Lot Number** (`batch_lot_number`): Batch identifier (e.g. API-260924).
7. **Affected Quantity** (`affected_quantity`): Impacted volume or mass (e.g. 500 kg).
8. **Detailed Description** (`detailed_description`)*: Comprehensive technical narrative with limits, equipment, and duration.
9. **Initial Impact** (`initial_impact`)*: High / Medium / Low (ICH Q9 classification).
10. **Initial Severity** (`initial_severity`)*: Critical / Major / Minor.
- *Additional metadata*: `severity_reason`, `recommended_action`, `created_at`, `updated_at`.

*\* Indicates required field for database persistence.*

---

## 5. The Three Mandatory AI Tools

### Tool 1: Log Deviation (`POST /api/ai/log-deviation`)
- **Input**: Free-form natural language or shift notes.
- **Workflow**: Analyzes narrative → Extracts 8 core fields → Computes ICH Q9 impact and severity → Returns structured JSON to populate React form.

### Tool 2: Edit Deviation (`POST /api/ai/edit-deviation`)
- **Input**: User instruction + current deviation state.
- **Workflow**: Identifies requested modifications → Returns **ONLY changed fields in `updates`** → Redux merges delta updates into state while preserving all untouched fields → Reassesses risk if materially affected.

### Tool 3: Document Extraction (`POST /api/ai/extract-document`)
- **Input**: Uploaded PDF or TXT file (up to 10MB).
- **Workflow**: Validates file format and size → Extracts raw text with `pypdf` → Passes text into LangGraph pipeline → Populates form and generates risk assessment.

---

## 6. Installation & Quickstart

### Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: v18 or higher (v24 tested)
- **npm**: v9 or higher

---

### Step 1: Clone & Configure Environment

```bash
cd Aivoa-Deviation-Assessment

# Configure backend environment
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Get a free API key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Database (defaults to zero-config SQLite)
DATABASE_URL=sqlite:///./deviations.db

PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

### Step 2: Setup & Run Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install --prefer-binary -r requirements.txt

# Run backend test suite (16 tests)
pytest -v

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
FastAPI documentation will be available at: **http://localhost:8000/docs**

---

### Step 3: Setup & Run Frontend

Open a second terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The application will open at: **http://localhost:5173**

---

## 7. Sample Test Prompts & Scenarios

### Scenario A: Initial Intake (Tool 1)
Paste this narrative into the AI Assistant:
```text
During the manufacturing of Paracetamol API batch API-260924,
the drying temperature exceeded the approved range of 70–75°C
and reached 82°C for approximately 18 minutes. The event was
detected by the production operator. The affected batch has
been placed on hold pending investigation.
```
**Expected Outcome**:
- All 10 fields populate on the left form.
- Initial Impact evaluates to **High**.
- Initial Severity evaluates to **Major**.
- Rationale highlights temperature exceeding 75°C for 18 minutes.
- Containment action recommends quarantine and HPLC assay.

---

### Scenario B: Conversational Batch Number Edit (Tool 2)
Send this correction in the chat:
```text
Sorry, the batch number is API-260925 and the affected quantity is 50 kg.
```
**Expected Outcome**:
- `Batch / Lot Number` changes to `API-260925`.
- `Affected Quantity` changes to `50 kg`.
- **All other 8 fields remain strictly unchanged**.

---

### Scenario C: Conversational Location Edit (Tool 2)
Send this correction in the chat:
```text
Please update the plant to Formulation Suite 2.
```
**Expected Outcome**:
- `Site / Plant` changes to `Formulation Suite 2`.
- All other fields remain preserved.

---

### Scenario D: Document Extraction (Tool 3)
1. Drag and drop `sample-data/sample_deviation.pdf` (or click to browse).
2. The AI parses the PDF, extracts text, runs LangGraph extraction, and populates the form with risk assessment.

---

### Scenario E: Database Persistence & Reset
1. Review fields and edit any field manually if desired.
2. Click **"Save Deviation"**.
3. A success banner confirms database record creation with ID `#1`.
4. Click **"Records"** in the top bar to inspect the persisted database entry.
5. Click **"Reset Form"** to clear fields back to pristine state.

---

## 8. API Reference

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `POST` | `/api/ai/log-deviation` | Natural language deviation intake | `{"text": "...", "current_deviation": {...}}` |
| `POST` | `/api/ai/edit-deviation` | Natural language delta update | `{"instruction": "...", "current_deviation": {...}}` |
| `POST` | `/api/ai/extract-document` | Multipart document extraction | `FormData` with `file: [PDF/TXT]` |
| `POST` | `/api/deviations` | Commit deviation to database | JSON conforming to `DeviationCreate` |
| `GET` | `/api/deviations` | List saved deviations | Query: `skip=0`, `limit=50` |
| `GET` | `/api/deviations/{id}` | Get single deviation | Path param: `id` |
| `GET` | `/api/health` | Health, DB, and Groq readiness | None |

---

## 9. Verification & Acceptance Tests

| # | Test Scenario | Verification Status |
|---|---|---|
| 1 | Paste deviation text → AI extracts → form populates | Verified |
| 2 | Change batch number via natural language → only batch number changes | Verified |
| 3 | Change quantity via natural language → only quantity changes | Verified |
| 4 | Upload PDF → text extraction → AI extraction → form populated | Verified |
| 5 | AI produces impact + severity + reason + recommended action | Verified |
| 6 | User edits AI-generated fields manually before saving | Verified |
| 7 | Save deviation → database record created | Verified |
| 8 | Reset form → form returns to initial state | Verified |
| 9 | Invalid / oversized file → friendly error | Verified |
| 10 | Malformed / unavailable AI response → graceful error | Verified |

---

## 10. Compliance & Disclaimer

*Note: This application is a technical assessment prototype demonstrating AI orchestration for pharmaceutical quality management workflows. It is not certified for production GxP usage without formal 21 CFR Part 11 electronic records validation, IQ/OQ/PQ qualifications, and audit trails.*
