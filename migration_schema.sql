-- ====================================================================
-- SAAS DOUBLE-VERIFICATION ATTENDANCE ECOSYSTEM DATABASE MIGRATION
-- Project: Rihem / Ala Attendance Points SaaS
-- Target Database: Supabase / PostgreSQL
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to avoid conflicts if regenerating from scratch
DROP TABLE IF EXISTS public.used_tokens CASCADE;
DROP TABLE IF EXISTS public.manual_corrections CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.device_logs CASCADE;
DROP TABLE IF EXISTS public.face_profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reclamations CASCADE;
DROP TABLE IF EXISTS public.absence_requests CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.user_shifts CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. COMPANIES (Multi-tenant Saas Root)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    subscription_status VARCHAR(50) DEFAULT 'trial', -- 'active', 'suspended', 'trial'
    max_employees INT DEFAULT 100,
    company_secret_key VARCHAR(255) NOT NULL DEFAULT 'super-secret-company-hmac-key-123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. BRANCHES (Offices / Locations)
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Africa/Tunis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. DEPARTMENTS
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. USERS (SaaS Authentication & Role Master)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Self-referencing manager hierarchy
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'Employee', -- 'SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee'
    avatar_url TEXT,
    leave_balance_annual INT DEFAULT 14,
    leave_balance_sick INT DEFAULT 5,
    leave_balance_unpaid INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. SHIFTS (Company Specific Shifts Rules)
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Morning Shift', 'Night Shift', 'Flexible Shift'
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    late_tolerance_minutes INT DEFAULT 10,
    checkout_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. USER SHIFTS (Employee Shift Mappings)
CREATE TABLE public.user_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. DEVICES (ESP32-S3-CAM Terminals)
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    device_uid VARCHAR(100) UNIQUE NOT NULL, -- MAC Address or Chip ID
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    firmware_version VARCHAR(30) DEFAULT '1.0.0',
    status VARCHAR(50) DEFAULT 'offline', -- 'online', 'offline'
    last_online TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. ATTENDANCE LOGS
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'check_in', -- 'check_in', 'check_out'
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'late', 'absent', 'manual_correction', 'synced_late'
    qr_verified BOOLEAN DEFAULT FALSE,
    face_verified BOOLEAN DEFAULT FALSE,
    face_score FLOAT, -- Lower value means closer face verification match
    date DATE DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    geolocation JSONB, -- Coordinates: { "latitude": 36.8065, "longitude": 10.1815 }
    photo_proof_url TEXT, -- Optional base64 or storage link proof of matching face
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. ABSENCE REQUESTS (Leaves / Vacations)
CREATE TABLE public.absence_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'sick', 'vacation', 'unpaid', 'personal'
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    manager_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    manager_comment TEXT,
    admin_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. RECLAMATIONS (Tickets or Pointage Corrections)
CREATE TABLE public.reclamations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    priority VARCHAR(30) DEFAULT 'normal', -- 'normal', 'urgent'
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'rejected'
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 11. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 12. FACE PROFILES (Dlib Encodings Matrix)
CREATE TABLE public.face_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    encoding_vector JSONB NOT NULL, -- 128 float coordinates vector representation
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 13. DEVICE HEALTH LOGS
CREATE TABLE public.device_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL, -- 'boot', 'scan_success', 'scan_failed', 'offline_queue_sync'
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 14. HOLIDAYS CALENDAR
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 15. MANUAL POINTAGE CORRECTIONS
CREATE TABLE public.manual_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_log_id UUID REFERENCES public.attendance_logs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    requested_time TIME NOT NULL,
    reason TEXT NOT NULL,
    manager_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 16. USED TOKENS (Anti-replay cache table)
CREATE TABLE public.used_tokens (
    token VARCHAR(50) PRIMARY KEY,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Bypass Row Level Security (RLS) across all tables for public development clients
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_corrections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_tokens DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Insert Initial seed records for testing
-- ====================================================================

-- 1. Insert seed company
INSERT INTO public.companies (id, name, subscription_status, company_secret_key)
VALUES ('e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'SaaS Corp', 'active', 'super-secret-company-hmac-key-123')
ON CONFLICT DO NOTHING;

-- 2. Insert branches
INSERT INTO public.branches (id, company_id, name, city, timezone)
VALUES 
('a6b18972-e1d2-430c-ab26-9f448c5825a0', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'Tunis Office', 'Tunis', 'Africa/Tunis'),
('c351f08a-2117-48b4-9c17-1f480db0d49f', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'Sousse Office', 'Sousse', 'Africa/Tunis')
ON CONFLICT DO NOTHING;

-- 3. Insert departments
INSERT INTO public.departments (id, company_id, name)
VALUES 
('d51fb0cf-916c-48c9-8d18-2e0618dbbc89', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'R&D Robotics'),
('f881b0a1-7788-444a-8d11-b0dbac2b99cf', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'Human Resources')
ON CONFLICT DO NOTHING;

-- 4. Insert default shifts
INSERT INTO public.shifts (id, company_id, name, start_time, end_time, late_tolerance_minutes)
VALUES 
('511fb0cf-7777-4444-8d18-2e0618dbbc77', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'Standard Day', '08:00', '17:00', 10),
('522fb0cf-8888-4444-8d18-2e0618dbbc88', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'Night Shift', '22:00', '06:00', 15)
ON CONFLICT DO NOTHING;

-- 5. Insert users (SaaS Admin, Managers, and Employees)
-- All users share seed hashing for simplicity (plain text password representation for sandbox auth)
INSERT INTO public.users (id, company_id, department_id, branch_id, email, password_hash, nom, prenom, role, phone)
VALUES 
-- Company Admin
('f1111111-cdee-4d97-b5ae-a3867e6f3a31', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'f881b0a1-7788-444a-8d11-b0dbac2b99cf', 'a6b18972-e1d2-430c-ab26-9f448c5825a0', 'admin@saas.com', 'admin123', 'Eddine', 'Ala', 'CompanyAdmin', '+216 99 888 777'),
-- Department Manager
('f2222222-cdee-4d97-b5ae-a3867e6f3a32', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'd51fb0cf-916c-48c9-8d18-2e0618dbbc89', 'a6b18972-e1d2-430c-ab26-9f448c5825a0', 'manager@saas.com', 'manager123', 'Ben Maouia', 'Rihem', 'Manager', '+216 22 333 444'),
-- Employee reporting to Manager above
('f3333333-cdee-4d97-b5ae-a3867e6f3a33', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'd51fb0cf-916c-48c9-8d18-2e0618dbbc89', 'a6b18972-e1d2-430c-ab26-9f448c5825a0', 'employee@saas.com', 'employee123', 'Bouslama', 'Mohamed', 'Employee', '+216 55 666 777')
ON CONFLICT DO NOTHING;

-- Map manager references
UPDATE public.users 
SET manager_id = 'f2222222-cdee-4d97-b5ae-a3867e6f3a32' 
WHERE id = 'f3333333-cdee-4d97-b5ae-a3867e6f3a33';

-- Map employee shift assignment
INSERT INTO public.user_shifts (user_id, shift_id)
VALUES ('f3333333-cdee-4d97-b5ae-a3867e6f3a33', '511fb0cf-7777-4444-8d18-2e0618dbbc77')
ON CONFLICT (user_id) DO NOTHING;

-- 6. Insert devices
INSERT INTO public.devices (id, company_id, branch_id, device_uid, name, ip_address, status)
VALUES ('d11fb0cf-abcd-ef01-2345-6789abcdef01', 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f', 'a6b18972-e1d2-430c-ab26-9f448c5825a0', 'ESP32_TUNIS_01_A8:B4:C2', 'Tunis S3 CAM Entrance', '192.168.1.150', 'online')
ON CONFLICT DO NOTHING;

-- ====================================================================
-- EXPLICIT PUBLIC ANONYMOUS RLS POLICIES FOR ALL 16 TABLES
-- Authorizes read/write access via the Supabase Publishable Key
-- ====================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read companies" ON public.companies;
CREATE POLICY "Allow anon read companies" ON public.companies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert companies" ON public.companies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update companies" ON public.companies FOR UPDATE TO anon USING (true);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read branches" ON public.branches;
CREATE POLICY "Allow anon read branches" ON public.branches FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert branches" ON public.branches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update branches" ON public.branches FOR UPDATE TO anon USING (true);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read departments" ON public.departments;
CREATE POLICY "Allow anon read departments" ON public.departments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert departments" ON public.departments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update departments" ON public.departments FOR UPDATE TO anon USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read users" ON public.users;
CREATE POLICY "Allow anon read users" ON public.users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE TO anon USING (true);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read shifts" ON public.shifts;
CREATE POLICY "Allow anon read shifts" ON public.shifts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert shifts" ON public.shifts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update shifts" ON public.shifts FOR UPDATE TO anon USING (true);

ALTER TABLE public.user_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read user_shifts" ON public.user_shifts;
CREATE POLICY "Allow anon read user_shifts" ON public.user_shifts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert user_shifts" ON public.user_shifts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update user_shifts" ON public.user_shifts FOR UPDATE TO anon USING (true);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read devices" ON public.devices;
CREATE POLICY "Allow anon read devices" ON public.devices FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert devices" ON public.devices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update devices" ON public.devices FOR UPDATE TO anon USING (true);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read attendance_logs" ON public.attendance_logs;
CREATE POLICY "Allow anon read attendance_logs" ON public.attendance_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert attendance_logs" ON public.attendance_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update attendance_logs" ON public.attendance_logs FOR UPDATE TO anon USING (true);

ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read absence_requests" ON public.absence_requests;
CREATE POLICY "Allow anon read absence_requests" ON public.absence_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert absence_requests" ON public.absence_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update absence_requests" ON public.absence_requests FOR UPDATE TO anon USING (true);

ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read reclamations" ON public.reclamations;
CREATE POLICY "Allow anon read reclamations" ON public.reclamations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert reclamations" ON public.reclamations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update reclamations" ON public.reclamations FOR UPDATE TO anon USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read notifications" ON public.notifications;
CREATE POLICY "Allow anon read notifications" ON public.notifications FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert notifications" ON public.notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update notifications" ON public.notifications FOR UPDATE TO anon USING (true);

ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read face_profiles" ON public.face_profiles;
CREATE POLICY "Allow anon read face_profiles" ON public.face_profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert face_profiles" ON public.face_profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update face_profiles" ON public.face_profiles FOR UPDATE TO anon USING (true);

ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read device_logs" ON public.device_logs;
CREATE POLICY "Allow anon read device_logs" ON public.device_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert device_logs" ON public.device_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update device_logs" ON public.device_logs FOR UPDATE TO anon USING (true);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read holidays" ON public.holidays;
CREATE POLICY "Allow anon read holidays" ON public.holidays FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert holidays" ON public.holidays FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update holidays" ON public.holidays FOR UPDATE TO anon USING (true);

ALTER TABLE public.manual_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read manual_corrections" ON public.manual_corrections;
CREATE POLICY "Allow anon read manual_corrections" ON public.manual_corrections FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert manual_corrections" ON public.manual_corrections FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update manual_corrections" ON public.manual_corrections FOR UPDATE TO anon USING (true);

ALTER TABLE public.used_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read used_tokens" ON public.used_tokens;
CREATE POLICY "Allow anon read used_tokens" ON public.used_tokens FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert used_tokens" ON public.used_tokens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update used_tokens" ON public.used_tokens FOR UPDATE TO anon USING (true);
