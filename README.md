<div align="center">

# 🧠 DataSense
**Agentic Exploratory Data Analysis (EDA) Pipeline**

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4.svg?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Plotly](https://img.shields.io/badge/Plotly-Interactive-3F4F75.svg?style=for-the-badge&logo=plotly)](https://plotly.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Upload your data. Ask your questions. Get analyst-grade insights instantly.**

DataSense is a full-stack, AI-powered Exploratory Data Analysis (EDA) tool that automatically cleans datasets, answers questions using **Google Gemini 2.0 Flash**, generates interactive **Plotly** charts, and exports polished **PDF/PowerPoint/Excel** reports.

[Live Demo](#) • [Features](#-features) • [Installation](#-local-setup) • [Architecture](#-architecture)

</div>

---

## 🚀 Architecture & Flowchart

DataSense operates using an **Agentic AI Pipeline**. The user asks a question, and the LLM acts as an agent, writing Python code to analyze the data. The code is executed in a secure backend sandbox, and the results are rendered beautifully on the frontend.

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#111118,stroke:#6366F1,stroke-width:2px,color:#F0F0F5
    classDef backend fill:#1A1A24,stroke:#10B981,stroke-width:2px,color:#F0F0F5
    classDef llm fill:#0A0A0F,stroke:#F59E0B,stroke-width:2px,color:#F0F0F5
    classDef storage fill:#1A1A24,stroke:#3B82F6,stroke-width:2px,color:#F0F0F5

    %% Nodes
    User([👨‍💻 User]) --> |Uploads CSV/Excel| UI
    User --> |Asks Question| UI
    
    subgraph Frontend [React / Tailwind Frontend]
        UI(Dashboard UI):::frontend
    end

    subgraph Backend [FastAPI Backend]
        API(API Router):::backend
        Cleaner(Cleaning Service<br/>Fills Nulls, Fixes Types):::backend
        Sandbox(Execution Sandbox<br/>Runs Python/Pandas):::backend
        Export(Export Service<br/>PDF, PPT, Excel):::backend
    end

    subgraph AI [Google Gemini]
        LLM{Gemini 2.0 Flash<br/>Writes Code & Insights}:::llm
    end
    
    Session[(In-Memory Session Store)]:::storage

    %% Flow
    UI -->|POST /api/upload| API
    API --> Cleaner
    Cleaner --> Session

    UI -->|POST /api/analyze| API
    API -->|Sends Schema + Question| LLM
    LLM -->|Returns Pandas/Plotly Code| Sandbox
    Sandbox -->|Executes Code on Data| Session
    Sandbox -->|Returns Chart JSON| API
    API -->|Renders Chart & Insight| UI
    
    UI -->|GET /api/export| Export
    Export -->|Downloads Report| User
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 📁 **Smart Upload** | Drag & drop CSV or Excel files. Instantly previews the first 50 rows. |
| 🧹 **Auto Cleaning** | Automatically fills nulls, removes duplicates, fixes data types, and flags outliers. |
| 🤖 **Agentic Analysis** | Ask up to 10 questions in plain English. The AI writes the code to answer them! |
| 📊 **Interactive Charts** | Bar, line, scatter, pie, heatmap, box — generated using `react-plotly.js`. |
| 💡 **Analyst Insights** | Gemini generates a 3–4 sentence professional narrative explaining the trends in each chart. |
| 📤 **Export Reports** | Download a **PDF Report**, **PowerPoint Slides**, or the **Cleaned Excel File**. |
| 🌑 **Premium UI** | Bloomberg-meets-Vercel dark aesthetic with an animated HTML5 Canvas particle background. |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS v4** (Custom Dark Theme Tokens)
- **Plotly.js** (`react-plotly.js`) for interactive charting
- **Axios** + `react-dropzone` + `react-hot-toast`

### Backend
- **FastAPI** (Python)
- **Google Gemini 2.0 Flash API** (`google-genai` SDK)
- **Pandas** + **NumPy** for data manipulation
- **ReportLab** (PDF), **python-pptx** (PPT), **OpenPyXL** (Excel)
- **Kaleido** for server-side chart-to-image conversion

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

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
# Open .env and add your GEMINI_API_KEY

# Start the backend
python main.py
# → Backend runs at http://localhost:8000
```

### 3. Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Frontend runs at http://localhost:5173
```

Navigate to [http://localhost:5173](http://localhost:5173) in your browser!

---

## 📖 Example Questions to Try

Upload any sales, HR, or financial dataset and try asking:

1. *"What is the distribution of sales by region?"*
2. *"Show the trend of revenue over time"*
3. *"Which product category has the highest average profit?"*
4. *"What is the correlation between age and salary?"*
5. *"Show the top 10 customers by order value"*

> **Pro Tip:** If you don't know what to ask, just click the **"✨ Suggest Questions"** button and let the AI generate 5 highly relevant questions for you based on your specific dataset schema!

---

## 🔐 Security & Sandbox

- **No Data Leakage:** Only your dataset's *column names* and *3 sample rows* are sent to the Gemini API. The full dataset never leaves your local machine/server.
- **Sandboxed Execution:** The Python code generated by the LLM is executed inside a restricted `exec()` environment where dangerous built-ins (`open`, `import`, `eval`) are blocked.
- **Environment Variables:** API keys are loaded via `.env` and are safely ignored by git.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it!
