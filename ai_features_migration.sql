-- ============================================================================
--  RIHEM — AI FEATURES migration (reclamation AI, interview generator)
--  Run after ai_intelligence_migration.sql and recruitment_migration.sql.
--  Safe to re-run.
-- ============================================================================

-- Smart Reclamation AI: store sentiment + the AI-drafted reply
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_sentiment       VARCHAR(20);
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_suggested_reply TEXT;
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS ai_summary         TEXT;

-- Interview question generator: store generated questions per candidate analysis
ALTER TABLE public.cv_analyses ADD COLUMN IF NOT EXISTS interview_json JSONB;
