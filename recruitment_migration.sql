-- ============================================================================
--  RIHEM — AI RECRUITMENT MODULE  (migration)
--  Tables: job_offers, candidates, cv_analyses
--  Run after migration_schema.sql. Safe to re-run (IF NOT EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. JOB OFFERS — open positions a company is recruiting for
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_offers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title         VARCHAR(150) NOT NULL,
    description   TEXT NOT NULL,
    location      VARCHAR(150),
    seniority     VARCHAR(50),                 -- Junior / Confirmé / Senior ...
    status        VARCHAR(30) DEFAULT 'open',  -- 'open', 'closed', 'draft'
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ---------------------------------------------------------------------------
-- 2. CANDIDATES — people who applied (one row per uploaded CV)
-- ---------------------------------------------------------------------------
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
    cv_text         TEXT,                       -- extracted raw text
    -- denormalised classifier output for fast list/filtering:
    job_category    VARCHAR(100),
    seniority_level VARCHAR(50),
    overall_score   INT,                        -- 0-100 CV quality (from analyser)
    match_score     INT,                        -- 0-100 vs linked job_offer (nullable)
    status          VARCHAR(30) DEFAULT 'new',  -- 'new','shortlisted','interview','rejected','hired'
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ---------------------------------------------------------------------------
-- 3. CV ANALYSES — full structured LLM output (JSON), kept for audit/history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_analyses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id   UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_offer_id   UUID REFERENCES public.job_offers(id) ON DELETE SET NULL,
    analysis_json  JSONB,        -- output of analyze_cv()
    classification_json JSONB,   -- output of classify_cv()
    match_json     JSONB,        -- output of match_cv_to_job() (nullable)
    model          VARCHAR(100), -- which Groq model produced this
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ---------------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_company   ON public.candidates(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job        ON public.candidates(job_offer_id);
CREATE INDEX IF NOT EXISTS idx_candidates_category   ON public.candidates(job_category);
CREATE INDEX IF NOT EXISTS idx_job_offers_company    ON public.job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_candidate ON public.cv_analyses(candidate_id);
