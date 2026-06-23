-- ====================================================================
-- MIGRATION: Teams, Plannings, Employee Fields
-- Run this in Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all teams" ON public.teams;
CREATE POLICY "Allow anon all teams" ON public.teams FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. TEAM MEMBERS (join table)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all team_members" ON public.team_members;
CREATE POLICY "Allow anon all team_members" ON public.team_members FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. PLANNINGS
CREATE TABLE IF NOT EXISTS public.plannings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    working_days JSONB DEFAULT '["Lundi","Mardi","Mercredi","Jeudi","Vendredi"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all plannings" ON public.plannings;
CREATE POLICY "Allow anon all plannings" ON public.plannings FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS planning_id UUID REFERENCES public.plannings(id) ON DELETE SET NULL;
