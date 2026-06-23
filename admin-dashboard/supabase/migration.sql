-- ============================================================
-- Migration : Système de Pointage Intelligent
-- Double vérification : QR Code + Reconnaissance Faciale
-- ============================================================

-- 1.1 Table des devices ESP32
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_uid TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id),
  name TEXT,
  branch_id UUID REFERENCES branches(id),
  status TEXT DEFAULT 'offline',
  last_online TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Table des profils faciaux (encodings)
CREATE TABLE IF NOT EXISTS face_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  encoding_vector JSONB NOT NULL,
  image_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Table anti-replay (tokens déjà utilisés)
CREATE TABLE IF NOT EXISTS used_tokens (
  token TEXT PRIMARY KEY,
  employee_id UUID REFERENCES users(id),
  device_id UUID REFERENCES devices(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Table logs des devices
CREATE TABLE IF NOT EXISTS device_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  log_type TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Table shifts (horaires)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT,
  start_time TIME,
  end_time TIME,
  late_tolerance_minutes INT DEFAULT 10
);

-- 1.7 Table user_shifts (liaison employé → horaire)
CREATE TABLE IF NOT EXISTS user_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  shift_id UUID REFERENCES shifts(id),
  UNIQUE(user_id, shift_id)
);

-- ============================================================
-- Ajout des colonnes manquantes à attendance_logs
-- ============================================================
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id);
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'check_in';
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS qr_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS face_score FLOAT DEFAULT 0.0;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS photo_proof_url TEXT;

-- ============================================================
-- Ajout colonne qr_code dans users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- ============================================================
-- Colonnes supplémentaires pour le profil employé
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_recrutement DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS type_contrat TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS etat_civil TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS autre_telephone TEXT;

-- ============================================================
-- Table des alertes de fraude
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES users(id),
  severity TEXT DEFAULT 'low',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Index pour les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON attendance_logs(company_id, date);
CREATE INDEX IF NOT EXISTS idx_device_logs_device ON device_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_used_tokens_created ON used_tokens(created_at);

-- ============================================================
-- Désactiver RLS sur toutes les nouvelles tables
-- ============================================================
ALTER TABLE IF EXISTS devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS face_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS used_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fraud_alerts DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur les tables existantes
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS branches DISABLE ROW LEVEL SECURITY;
