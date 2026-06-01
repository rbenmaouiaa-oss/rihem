# 🚀 Quick Start - Rihem App

Get the app running in 10 minutes.

## Prerequisites

- Node.js v16+
- Python 3.8+
- Expo CLI
- Supabase account

## Setup Steps

### 1. Mobile App (React Native)
```bash
cd qr_app
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm start
```

### 2. Admin Dashboard (Web)
```bash
cd admin-dashboard
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Python Backend
```bash
cd face_project
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install face_recognition numpy pillow
python encode_face.py
```

## Services Running

| Service | Port | URL |
|---------|------|-----|
| Mobile App | 8081 | http://localhost:8081 |
| Admin Dashboard | 5173 | http://localhost:5173 |
| Python Backend | Local | Ready |
| Supabase | Cloud | Connected |

## Test Credentials

```
Email: employee@test.com
Password: Test@1234

OR

Email: admin@test.com
Password: Admin@1234
```

## Key Features to Test

- Login/Register flow
- QR code generation
- Face recognition
- Team management
- Attendance tracking
- Reclamation system

## Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy Project URL and anon key
5. Add to your .env files

## Troubleshooting

**Mobile won't start:**
```bash
cd qr_app
npm cache clean --force
npm install
npm start
```

**Dashboard won't start:**
```bash
cd admin-dashboard
npm cache clean --force
npm install
npm run dev
```

**Python issues:**
```bash
python --version  # Check Python installed
pip install --upgrade face_recognition
```

See APP_GUIDE.md for more details.
