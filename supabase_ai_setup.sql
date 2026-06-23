-- ============================================================================
--  RIHEM — COMPLETE AI SETUP (run this ONCE in the Supabase SQL editor)
--  Combines, in the correct order:
--    1. recruitment tables (job_offers, candidates, cv_analyses)
--    2. ai_intelligence columns (fraud_alerts + reclamation AI fields)
--    3. ai_features columns (sentiment / reply / interview)
--  Safe to re-run (IF NOT EXISTS everywhere).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1 — RECRUITMENT TABLES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_offers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title         VARCHAR(150) NOT NULL,
    description   TEXT NOT NULL,
    location      VARCHAR(150),
    seniority     VARCHAR(50),
    status        VARCHAR(30) DEFAULT 'open',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.candidates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    job_offer_id    UUID REFERENCES public.job_offers(id) ON DELETE SET NULL,
    full_name       VARCHAR(150),
    email           VARCHAR(150),
    phone           VARCHAR(50),
    location        VARCHAR(150),
    current_title   VARCHAR(150),
    cv_filename     VARCHAR(255),
    cv_text         TEXT,
    job_category    VARCHAR(100),
    seniority_level VARCHAR(50),
    overall_score   INT,
    match_score     INT,
    status          VARCHAR(30) DEFAULT 'new',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.cv_analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_offer_id        UUID REFERENCES public.job_offers(id) ON DELETE SET NULL,
    analysis_json       JSONB,
    classification_json JSONB,
    match_json          JSONB,
    model               VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_candidates_company   ON public.candidates(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job        ON public.candidates(job_offer_id);
CREATE INDEX IF NOT EXISTS idx_candidates_category   ON public.candidates(job_category);
CREATE INDEX IF NOT EXISTS idx_job_offers_company    ON public.job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_candidate ON public.cv_analyses(candidate_id);

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2 — AI INTELLIGENCE (fraud alerts + reclamation prediction columns)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_log_id UUID REFERENCES public.attendance_logs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'low',
    description TEXT NOT NULL,
    face_score FLOAT,
    qr_verified BOOLEAN,
    face_verified BOOLEAN,
    log_time TIME,
    log_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_predicted_priority VARCHAR(20);
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_predicted_category VARCHAR(50);
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_confidence FLOAT;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3 — AI FEATURES (smart reclamation reply + interview questions)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_sentiment       VARCHAR(20);
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_suggested_reply TEXT;
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_summary         TEXT;
ALTER TABLE public.cv_analyses  ADD COLUMN IF NOT EXISTS interview_json     JSONB;

-- Done.
