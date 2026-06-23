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

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Allow anon read fraud_alerts" ON public.fraud_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Allow anon insert fraud_alerts" ON public.fraud_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Allow anon update fraud_alerts" ON public.fraud_alerts FOR UPDATE TO anon, authenticated USING (true);
