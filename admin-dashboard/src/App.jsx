import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// SCREENS
import Login from "./screens/Login";
import Register from "./screens/Register";
import AdministrateurDashboard from "./screens/AdministrateurDashboard";
import Profil from "./screens/Profil";
import ForgotPassword from "./screens/ForgotPassword";
import VerifyOTP from "./screens/VerifyOTP";
import ResetPassword from "./screens/ResetPassword";
import Equipes from "./screens/Equipes";
import CreerEquipe from "./screens/CreerEquipe";
import FichePointage from './screens/FichePointage';
import CreerPlanning from './screens/CreerPlanning';
import FaceScanner from "./screens/FaceScanner";
import QRScanner from "./screens/QRScanner";
import SmartTerminal from "./screens/SmartTerminal";
import QrBadge from "./screens/QrBadge";
import ManagerDashboard from "./screens/ManagerDashboard";
import EmployerDashboard from "./screens/EmployerDashboard";
import ResponsableDashboard from "./screens/ResponsableDashboard";
import EquipeMembres from "./screens/EquipeMembres";
import CreerEmploye from "./screens/CreerEmploye";
import EmployeProfil from "./screens/EmployeProfil";
import { RBACProvider } from './RBACContext';


function App() {
  return (
    <BrowserRouter>
      <RBACProvider>
        <Routes>

          {/* AUTH */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PASSWORD FLOW */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* MAIN */}
          <Route path="/home" element={<AdministrateurDashboard />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/creer-equipe" element={<CreerEquipe />} />
          <Route path="/fiche-pointage" element={<FichePointage />} />
          <Route path="/creer-planning" element={<CreerPlanning />} />
          <Route path="/scanner-facial" element={<FaceScanner />} />
          <Route path="/scanner-qr" element={<QRScanner />} />
          <Route path="/terminal-intelligent" element={<SmartTerminal />} />
          <Route path="/badge-qr" element={<QrBadge />} />

          {/* EMPLOYER DASHBOARD */}
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />

          {/* MANAGER & ADMIN */}
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/responsable/dashboard" element={<ResponsableDashboard />} />
          <Route path="/equipes/:teamId/membres" element={<EquipeMembres />} />
          <Route path="/admin/employees/create" element={<CreerEmploye />} />
          <Route path="/employees/:id" element={<EmployeProfil />} />

          {/* AI RECRUITMENT — now an embedded tab inside the dashboard */}
          <Route path="/recrutement" element={<Navigate to="/home" />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </RBACProvider>
    </BrowserRouter>
  );
}

export default App;
