# 🤖 Module Recrutement IA (Groq)

AI recruitment add-on for the Rihem HR system. Powered by **Groq** (Llama 3.3 70B).

## Features
| Feature | What it does |
|---------|--------------|
| **CV Analyser** | Extracts structured data from a CV (name, contact, skills, experience, education, languages) + summary, strengths, red flags, and a 0–100 quality score. |
| **CV Classifier** | Auto-tags job category, suggested department, and seniority level with a confidence score. |
| **Job ↔ CV Matching** | Scores a candidate against a job offer (0–100), with matching/missing skills and a recruiter recommendation. |
| **Smart Reclamation AI** | Analyses employee complaints → priority, category, sentiment, summary, and an AI-drafted professional reply. Also upgrades the `ai_intelligence.py` batch job (LLM with keyword fallback). |
| **Interview Q Generator** | Generates tailored interview questions (technical / experience / behavioral / to-clarify / tips) from a candidate's CV + the job offer. |
| **HR Insights Summarizer** | Aggregates attendance + fraud stats and produces a manager-readable report (headline, findings, risks, recommendations). |

## Architecture
```
llm_engine.py          → Groq wrapper (analyze_cv / classify_cv / match_cv_to_job)
recruitment_api.py     → Flask blueprint, /api/ai/* routes (registered in app.py)
recruitment_migration.sql → DB tables: job_offers, candidates, cv_analyses
admin-dashboard/src/
  services/recruitmentService.js → frontend API client
  screens/Recrutement.jsx        → UI (route /recrutement, sidebar "Analyse CV (IA)")
```

## Setup
1. **Install deps** (backend):
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure secrets**: copy `.env.example` → `.env` and set `GROQ_API_KEY`
   (get one at https://console.groq.com/keys). `app.py` loads `.env` automatically.
3. **Run the migrations** in the Supabase SQL editor, in order:
   `recruitment_migration.sql` then `ai_features_migration.sql`
   (and `ai_intelligence_migration.sql` if not already applied).
4. **Start backend**: `python app.py`  → look for `🤖 AI recruitment module loaded`.
5. **Start dashboard**: `cd admin-dashboard && npm install && npm run dev`, then open
   the sidebar → **Recrutement IA → Analyse CV (IA)**.

## API
| Method | Route | Body |
|--------|-------|------|
| GET | `/api/ai/health` | — (checks Groq connectivity) |
| GET | `/api/ai/jobs?company_id=` | list job offers |
| POST | `/api/ai/jobs` | `{title, description, company_id, location?, seniority?}` |
| POST | `/api/ai/cv/analyze` | multipart `file` (PDF/DOCX/TXT) + `company_id?`, `job_offer_id?` — or JSON `{cv_text}` |
| GET | `/api/ai/candidates?company_id=&job_offer_id=` | ranked candidate list |
| GET | `/api/ai/candidates/<id>` | full analysis for one candidate |
| POST | `/api/ai/cv/match` | `{candidate_id, job_offer_id}` (re-match) |
| POST | `/api/ai/reclamation/classify` | `{subject, message, reclamation_id?}` → priority/category/sentiment/reply |
| POST | `/api/ai/reclamation/analyze-all` | batch-process complaints without AI priority |
| POST | `/api/ai/interview/generate` | `{candidate_id, job_offer_id?}` or `{cv_text, job_title, job_description}` |
| GET | `/api/ai/insights/summary?company_id=&days=30` | natural-language HR report |

## Change the model
Set `GROQ_MODEL` in `.env` — e.g. `llama-3.1-8b-instant` for speed,
`llama-3.3-70b-versatile` (default) for quality.

## ⚠️ Security
- The Groq key in `.env` is gitignored. **Rotate the key** you shared in chat at
  console.groq.com → it was exposed in plaintext.
- `/api/ai/*` is currently open like the rest of the Flask API. Add auth before
  production (e.g. verify a Supabase JWT in a `before_request` hook).

## Possible future features
- HR chatbot for employees (leave balance, policies) via RAG over Supabase data
- Auto job-description generator from a few keywords
- Performance-review / feedback summariser
