# 🧠 DataSense — Agentic EDA Assistant

> **Upload your data. Ask your questions. Get analyst-grade insights instantly.**

DataSense is a full-stack, AI-powered Exploratory Data Analysis (EDA) tool that automatically cleans datasets, answers questions using Gemini 1.5 Flash, generates interactive Plotly charts, and exports polished PDF/PowerPoint/Excel reports.

---

## 🔗 Live Demo

> Coming soon — deploying to Vercel + Railway

---

## ✨ Features

| Feature | Description |
|---|---|
| 📁 **Dataset Upload** | Drag & drop CSV or Excel (.xlsx/.xls) files up to 50MB |
| 🧹 **Auto Cleaning** | Fills nulls, removes duplicates, fixes types, flags outliers |
| 🤖 **AI Analysis** | Ask up to 10 questions in plain English |
| 📊 **Smart Charts** | Bar, line, scatter, pie, heatmap, box — chosen automatically |
| 💡 **Analyst Insights** | Gemini generates 3–4 sentence professional narratives per chart |
| 📤 **Export Reports** | Download PDF report, PowerPoint slides, or cleaned Excel |
| 🌑 **Dark UI** | Bloomberg-meets-Vercel aesthetic with animated particle background |

---

## 🏗️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- Plotly.js (react-plotly.js)
- Axios + react-dropzone + react-hot-toast

### Backend
- FastAPI (Python)
- Google Gemini 1.5 Flash API
- Pandas + NumPy + Plotly (Python)
- ReportLab (PDF), python-pptx (PPT), OpenPyXL (Excel)
- Sentry for error monitoring

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the repo

```bash
git clone https://github.com/Shivam8292/Agentic-EDA-Pipeline.git
cd "Agentic-EDA-Pipeline"
```

### 2. Backend setup

```bash
cd datasense/backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the backend
python main.py
# → Backend runs at http://localhost:8000
# → API docs at http://localhost:8000/docs
```

### 3. Frontend setup

```bash
cd datasense/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Frontend runs at http://localhost:5173
```

### 4. Open in browser

Navigate to [http://localhost:5173](http://localhost:5173)

---

## 📖 Example Questions to Try

Upload a sales or HR dataset and ask:

- *"What is the distribution of sales by region?"*
- *"Show the trend of revenue over time"*
- *"Which product category has the highest average profit?"*
- *"What is the correlation between age and salary?"*
- *"Show the top 10 customers by order value"*

---

## 📁 Project Structure

```
datasense/
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── session_store.py      # In-memory session management
│   ├── routes/
│   │   ├── upload.py         # POST /api/upload
│   │   ├── analyze.py        # POST /api/analyze, /suggest
│   │   └── export.py         # GET /api/export/{pdf,ppt,excel}
│   ├── services/
│   │   ├── cleaning_service.py   # Data cleaning pipeline
│   │   ├── llm_service.py        # Gemini 1.5 Flash integration
│   │   ├── execution_service.py  # Sandboxed code execution
│   │   └── export_service.py     # PDF/PPT/Excel generation
│   ├── models/schemas.py     # Pydantic data models
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/       # Navbar, Upload, Preview, Cards, Sidebar...
        ├── pages/            # LandingPage, DashboardPage
        ├── services/api.js   # Axios API calls
        └── index.css         # Global design system
```

---

## 🔐 Security

- API keys stored in `.env` only — never in source code
- `.env` excluded from git via `.gitignore`
- File uploads validated by magic bytes, not just extension
- LLM-generated code runs in restricted `exec()` sandbox (no `__builtins__`)
- Input sanitization removes code injection attempts from questions
- CORS restricted to known origins

---

## 📸 Screenshots

> Screenshots coming after deployment

---

## 📋 Implementation Phases

- [x] **Phase 0** — Project setup, monorepo structure, all dependencies
- [x] **Phase 1** — File upload + data preview
- [x] **Phase 2** — LLM integration + code execution
- [x] **Phase 3** — Chat Interface & Dashboard
- [x] **Phase 4** — Export system (PDF/PPT/Excel)
- [x] **Phase 5** — UI polish + full dashboard
- [x] **Phase 6** — Production readiness + deployment

---

## 📄 License

MIT License — free to use and modify.
