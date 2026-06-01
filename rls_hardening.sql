-- ====================================================================
-- SAAS DOUBLE-VERIFICATION ATTENDANCE ECOSYSTEM: RLS HARDENING MIGRATION
-- Project: Rihem / Ala Attendance Points SaaS
-- Target Database: Supabase / PostgreSQL
-- ====================================================================

-- ====================================================================
-- 1. CLEANUP & HELPER SECURITY DEFINER FUNCTIONS
-- ====================================================================

-- Function: get_current_company_id
-- Safely fetches the company_id associated with the authenticated user (auth.uid())
CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: get_current_user_role
-- Safely fetches the role of the authenticated user (auth.uid())
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ====================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 16 TABLES
-- ====================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_tokens ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 3. SAAS MULTI-TENANT FILTER POLICIES (TENANT ISOLATION & RBAC)
-- ====================================================================

-- ----------------- 3.1. COMPANIES POLICIES -----------------
DROP POLICY IF EXISTS "Companies read tenant isolation" ON public.companies;
DROP POLICY IF EXISTS "Companies update tenant isolation" ON public.companies;

-- Select: Any active employee can select their own tenant company
CREATE POLICY "Companies read tenant isolation" ON public.companies
    FOR SELECT TO anon, authenticated
    USING (id = public.get_current_company_id());

-- Update: Company Admin can update company rules
CREATE POLICY "Companies update tenant isolation" ON public.companies
    FOR UPDATE TO authenticated
    USING (id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.2. BRANCHES POLICIES -----------------
DROP POLICY IF EXISTS "Branches read tenant isolation" ON public.branches;
DROP POLICY IF EXISTS "Branches write tenant isolation" ON public.branches;

-- Select: Any employee can view branches of their company
CREATE POLICY "Branches read tenant isolation" ON public.branches
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update/Delete: Company Admins only
CREATE POLICY "Branches write tenant isolation" ON public.branches
    FOR ALL TO authenticated
    USING (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin')
    WITH CHECK (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.3. DEPARTMENTS POLICIES -----------------
DROP POLICY IF EXISTS "Departments read tenant isolation" ON public.departments;
DROP POLICY IF EXISTS "Departments write tenant isolation" ON public.departments;

-- Select: Any employee can view departments of their company
CREATE POLICY "Departments read tenant isolation" ON public.departments
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update/Delete: Company Admins only
CREATE POLICY "Departments write tenant isolation" ON public.departments
    FOR ALL TO authenticated
    USING (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin')
    WITH CHECK (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.4. USERS POLICIES -----------------
DROP POLICY IF EXISTS "Users read tenant isolation" ON public.users;
DROP POLICY IF EXISTS "Users write tenant isolation" ON public.users;

-- Select: Employees can view profiles inside their company
CREATE POLICY "Users read tenant isolation" ON public.users
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update/Delete: Admins manage all; Employees can update own credentials
CREATE POLICY "Users write tenant isolation" ON public.users
    FOR ALL TO authenticated
    USING (
        company_id = public.get_current_company_id() AND (
            public.get_current_user_role() = 'CompanyAdmin' OR
            id = auth.uid()
        )
    )
    WITH CHECK (
        company_id = public.get_current_company_id() AND (
            public.get_current_user_role() = 'CompanyAdmin' OR
            id = auth.uid()
        )
    );


-- ----------------- 3.5. SHIFTS POLICIES -----------------
DROP POLICY IF EXISTS "Shifts read tenant isolation" ON public.shifts;
DROP POLICY IF EXISTS "Shifts write tenant isolation" ON public.shifts;

-- Select: Employees can view shift assignments
CREATE POLICY "Shifts read tenant isolation" ON public.shifts
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update/Delete: Admins only
CREATE POLICY "Shifts write tenant isolation" ON public.shifts
    FOR ALL TO authenticated
    USING (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin')
    WITH CHECK (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.6. USER SHIFTS POLICIES -----------------
DROP POLICY IF EXISTS "User shifts read tenant isolation" ON public.user_shifts;
DROP POLICY IF EXISTS "User shifts write tenant isolation" ON public.user_shifts;

-- Select: View shift mappings of own company users
CREATE POLICY "User shifts read tenant isolation" ON public.user_shifts
    FOR SELECT TO anon, authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()));

-- Insert/Update/Delete: Admins only
CREATE POLICY "User shifts write tenant isolation" ON public.user_shifts
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin'))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin'));


-- ----------------- 3.7. DEVICES POLICIES -----------------
DROP POLICY IF EXISTS "Devices read tenant isolation" ON public.devices;
DROP POLICY IF EXISTS "Devices write tenant isolation" ON public.devices;

-- Select: Employees can read active terminals in their company
CREATE POLICY "Devices read tenant isolation" ON public.devices
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update/Delete: Admins manage terminals
CREATE POLICY "Devices write tenant isolation" ON public.devices
    FOR ALL TO authenticated
    USING (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin')
    WITH CHECK (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.8. ATTENDANCE LOGS POLICIES -----------------
DROP POLICY IF EXISTS "Logs read tenant isolation" ON public.attendance_logs;
DROP POLICY IF EXISTS "Logs write tenant isolation" ON public.attendance_logs;

-- Select: Employees read own logs; Managers read reporting subordinate logs; Admins read all
CREATE POLICY "Logs read tenant isolation" ON public.attendance_logs
    FOR SELECT TO anon, authenticated
    USING (
        company_id = public.get_current_company_id() AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin' OR
            (public.get_current_user_role() = 'Manager' AND employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid()))
        )
    );

-- Insert/Update: Physical terminals scan & insert points autonomously
CREATE POLICY "Logs write tenant isolation" ON public.attendance_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (company_id = public.get_current_company_id());


-- ----------------- 3.9. ABSENCE REQUESTS POLICIES -----------------
DROP POLICY IF EXISTS "Absences read tenant isolation" ON public.absence_requests;
DROP POLICY IF EXISTS "Absences write tenant isolation" ON public.absence_requests;

-- Select: Employees see own; Managers see reporting subordinates; Admins see all
CREATE POLICY "Absences read tenant isolation" ON public.absence_requests
    FOR SELECT TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin' OR
            (public.get_current_user_role() = 'Manager' AND employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid()))
        )
    );

-- Insert/Update: Employees insert own; Managers/Admins approve
CREATE POLICY "Absences write tenant isolation" ON public.absence_requests
    FOR ALL TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() IN ('CompanyAdmin', 'Manager')
        )
    )
    WITH CHECK (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() IN ('CompanyAdmin', 'Manager')
        )
    );


-- ----------------- 3.10. RECLAMATIONS POLICIES -----------------
DROP POLICY IF EXISTS "Reclamations read tenant isolation" ON public.reclamations;
DROP POLICY IF EXISTS "Reclamations write tenant isolation" ON public.reclamations;

-- Select: Employees read own tickets; Admins read all company tickets
CREATE POLICY "Reclamations read tenant isolation" ON public.reclamations
    FOR SELECT TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    );

-- Insert/Update: Employees submit own; Admins reply and resolve
CREATE POLICY "Reclamations write tenant isolation" ON public.reclamations
    FOR ALL TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    )
    WITH CHECK (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    );


-- ----------------- 3.11. NOTIFICATIONS POLICIES -----------------
DROP POLICY IF EXISTS "Notifications read tenant isolation" ON public.notifications;
DROP POLICY IF EXISTS "Notifications write tenant isolation" ON public.notifications;

-- Select: Employees read own notifications
CREATE POLICY "Notifications read tenant isolation" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Insert/Update: System/Devices insert; Employees update read marker
CREATE POLICY "Notifications write tenant isolation" ON public.notifications
    FOR ALL TO anon, authenticated
    USING (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()))
    WITH CHECK (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()));


-- ----------------- 3.12. FACE PROFILES POLICIES -----------------
DROP POLICY IF EXISTS "Face profiles read tenant isolation" ON public.face_profiles;
DROP POLICY IF EXISTS "Face profiles write tenant isolation" ON public.face_profiles;

-- Select: Employees view own; Admins view all company encodings
CREATE POLICY "Face profiles read tenant isolation" ON public.face_profiles
    FOR SELECT TO anon, authenticated
    USING (
        user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            user_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    );

-- Insert/Update: Employees upload own vectors; Admins manage
CREATE POLICY "Face profiles write tenant isolation" ON public.face_profiles
    FOR ALL TO anon, authenticated
    USING (
        user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            user_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    )
    WITH CHECK (
        user_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            user_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin'
        )
    );


-- ----------------- 3.13. DEVICE HEALTH LOGS POLICIES -----------------
DROP POLICY IF EXISTS "Device logs read tenant isolation" ON public.device_logs;
DROP POLICY IF EXISTS "Device logs write tenant isolation" ON public.device_logs;

-- Select: Admins view device logs
CREATE POLICY "Device logs read tenant isolation" ON public.device_logs
    FOR SELECT TO authenticated
    USING (device_id IN (SELECT id FROM public.devices WHERE company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin'));

-- Insert: Anonymous terminals record logs
CREATE POLICY "Device logs write tenant isolation" ON public.device_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (device_id IN (SELECT id FROM public.devices WHERE company_id = public.get_current_company_id()));


-- ----------------- 3.14. HOLIDAYS POLICIES -----------------
DROP POLICY IF EXISTS "Holidays read tenant isolation" ON public.holidays;
DROP POLICY IF EXISTS "Holidays write tenant isolation" ON public.holidays;

-- Select: Employees view corporate calendar holidays
CREATE POLICY "Holidays read tenant isolation" ON public.holidays
    FOR SELECT TO anon, authenticated
    USING (company_id = public.get_current_company_id());

-- Insert/Update: Admins configure holidays
CREATE POLICY "Holidays write tenant isolation" ON public.holidays
    FOR ALL TO authenticated
    USING (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin')
    WITH CHECK (company_id = public.get_current_company_id() AND public.get_current_user_role() = 'CompanyAdmin');


-- ----------------- 3.15. MANUAL CORRECTIONS POLICIES -----------------
DROP POLICY IF EXISTS "Corrections read tenant isolation" ON public.manual_corrections;
DROP POLICY IF EXISTS "Corrections write tenant isolation" ON public.manual_corrections;

-- Select: Employees view own; Managers view subordinate; Admins view all
CREATE POLICY "Corrections read tenant isolation" ON public.manual_corrections
    FOR SELECT TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() = 'CompanyAdmin' OR
            (public.get_current_user_role() = 'Manager' AND employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid()))
        )
    );

-- Insert/Update: Employees request corrections; Admins/Managers decide
CREATE POLICY "Corrections write tenant isolation" ON public.manual_corrections
    FOR ALL TO authenticated
    USING (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() IN ('CompanyAdmin', 'Manager')
        )
    )
    WITH CHECK (
        employee_id IN (SELECT id FROM public.users WHERE company_id = public.get_current_company_id()) AND (
            employee_id = auth.uid() OR
            public.get_current_user_role() IN ('CompanyAdmin', 'Manager')
        )
    );


-- ----------------- 3.16. USED TOKENS POLICIES -----------------
DROP POLICY IF EXISTS "Tokens read tenant isolation" ON public.used_tokens;
DROP POLICY IF EXISTS "Tokens write tenant isolation" ON public.used_tokens;

-- Select: Any terminal or user checks replay state
CREATE POLICY "Tokens read tenant isolation" ON public.used_tokens
    FOR SELECT TO anon, authenticated
    USING (true);

-- Insert: Terminals record used token
CREATE POLICY "Tokens write tenant isolation" ON public.used_tokens
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ====================================================================
-- SUCCESS MESSAGE
-- ====================================================================
SELECT 'Multi-Tenant RLS policies successfully initialized across all 16 tables' AS status;
