# 🎯 AI Voice Interview & Resume ATS Analyzer System

> A production-ready, full-stack AI-powered interview preparation platform with voice-based interviews, LLM evaluation, resume ATS analysis, and analytics dashboard.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-6366f1)](https://reactjs.org)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-68a063)](https://nodejs.org)
[![AI](https://img.shields.io/badge/AI-Groq%20%7C%20OpenAI%20%7C%20Gemini-ff6b35)](https://groq.com)
[![DB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47a248)](https://mongodb.com)

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🎙️ **Voice Interview** | TTS reads questions aloud; STT captures your spoken answers |
| 🤖 **AI Evaluation** | LLM scores every answer across 5 dimensions (0–10 each) |
| 📄 **ATS Resume Analyzer** | Upload PDF → get ATS score, matched/missing skills, suggestions |
| 📊 **Analytics Dashboard** | Radar chart, score history line chart, strengths/weaknesses |
| 🔐 **JWT Auth** | Signup/Login; all interview data stored per user |
| 📧 **Email Reports** | Beautiful HTML report sent via Nodemailer after each session |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend (Vite)              │
│  Landing → Login/Signup → Interview Setup → Voice   │
│  Interview → Results → Resume ATS → Dashboard        │
│  Web Speech API (TTS/STT) | Chart.js / Recharts      │
└───────────────────┬─────────────────────────────────┘
                    │ Axios + JWT Bearer
┌───────────────────▼─────────────────────────────────┐
│             Node.js + Express Backend                │
│  /api/auth  /api/interview  /api/resume              │
│  /api/dashboard  /api/email                          │
└────────────┬─────────────────┬───────────────────────┘
             │                 │
     ┌───────▼──────┐  ┌──────▼───────────┐
     │ MongoDB Atlas │  │  Groq / OpenAI   │
     │  (Mongoose)   │  │  LLM API         │
     └───────────────┘  └──────────────────┘
```

---

## 📂 Project Structure

```
AI_Interview/
├── backend/
│   ├── config/          # db.js
│   ├── controllers/     # auth, interview, resume, dashboard, email
│   ├── middleware/       # auth.js (JWT)
│   ├── models/          # User, Interview, Resume
│   ├── routes/          # auth, interview, resume, dashboard, email
│   ├── utils/           # llm.js (multi-provider), emailTemplate.js
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Navbar, ProtectedRoute
        ├── context/     # AuthContext
        ├── pages/       # Landing, Login, Signup, InterviewSetup,
        │                # Interview (voice), Results, ResumeAnalyzer, Dashboard
        ├── services/    # api.js (Axios)
        └── App.jsx
```

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-voice-interview-system.git
cd ai-voice-interview-system
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, GROQ_API_KEY (or OPENAI_API_KEY), JWT_SECRET, EMAIL_USER, EMAIL_PASS
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🔑 Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret key (min 32 chars) |
| `LLM_PROVIDER` | `groq` \| `openai` \| `gemini` |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `OPENAI_API_KEY` | OpenAI API key (if provider=openai) |
| `GEMINI_API_KEY` | Google AI Studio key (if provider=gemini) |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `CLIENT_URL` | Frontend URL for CORS |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL e.g. `http://localhost:5000/api` |

---

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guides for:
- **Frontend** → Vercel
- **Backend** → Render  
- **Database** → MongoDB Atlas

---

## 🛠 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS 3, Recharts, Axios, Web Speech API, Lucide Icons, React Router v6, React Hot Toast

**Backend:** Node.js, Express 4, MongoDB + Mongoose, JWT, Bcrypt, Multer, pdf-parse, Nodemailer

**AI:** Groq (llama3-70b-8192) | OpenAI (GPT-4o) | Google Gemini (1.5-pro)

---

## 📜 License

MIT License — free to use for personal and commercial projects.
