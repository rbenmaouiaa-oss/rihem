# 📋 RIHEM - Workforce Management System

A complete workforce management platform with **mobile app**, **admin dashboard**, and **AI-powered face recognition**.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get running in 10 minutes
- **[APP_GUIDE.md](./APP_GUIDE.md)** - Complete feature guide
- **[WORKFLOW.md](./WORKFLOW.md)** - System workflows & integration

## 🏗️ System Architecture

```
Mobile App (React Native/Expo)
├── Employee interface
├── QR code generation
└── Attendance tracking

Admin Dashboard (React/Vite)
├── Team management
├── Face recognition
├── Schedule planning
└── QR code scanning

Python Backend
├── Face recognition
└── Encoding management

Supabase Cloud
├── PostgreSQL Database
├── Authentication
└── Real-time API
```

## 🚀 Quick Start

```bash
# Mobile App
cd qr_app && npm install && npm start

# Admin Dashboard  
cd admin-dashboard && npm install && npm run dev

# Python Face Recognition
cd face_project && python -m venv .venv && source .venv/bin/activate
pip install face_recognition numpy && python encode_face.py
```

## 🔐 Setup

1. Create `.env` files in `qr_app/` and `admin-dashboard/` using `.env.example` as template
2. Add your Supabase credentials from https://supabase.com/dashboard
3. Run the commands above

## ✨ Features

- **Authentication** - Secure login & password reset
- **Attendance** - Track via QR code or face recognition
- **Teams** - Create and manage departments
- **Planning** - Create work schedules
- **Reclamations** - Employee complaint system
- **Reports** - Analytics and attendance reports
- **Real-time** - WebSocket notifications

## 📱 Available on

- Mobile: iOS, Android, Web (Expo)
- Web: Modern browsers (React/Vite)

## 📞 Documentation Links

- Supabase: https://supabase.com/docs
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- Vite: https://vitejs.dev

---

**Last Updated:** May 30, 2026  
**Version:** 1.0.0
