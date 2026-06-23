-- ============================================================
-- ÉTAPE 1 : Tables pour le système de pointage ESP32-CAM
-- ============================================================

-- 1.1 Table des devices ESP32
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_uid TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id),
  status TEXT DEFAULT 'offline',
  last_online TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Table des profils faciaux (encodings)
CREATE TABLE IF NOT EXISTS face_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  encoding_vector JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Table anti-replay (tokens déjà utilisés)
CREATE TABLE IF NOT EXISTS used_tokens (
  token TEXT PRIMARY KEY,
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
  title TEXT,
  message TEXT,
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
  shift_id UUID REFERENCES shifts(id)
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
-- Désactiver RLS sur toutes les nouvelles tables
-- ============================================================
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE face_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE used_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_shifts DISABLE ROW LEVEL SECURITY;
