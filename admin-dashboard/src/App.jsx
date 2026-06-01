import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// SCREENS
import Login from "./screens/Login";
import Register from "./screens/Register";
import Home from "./screens/Home";
import Profil from "./screens/Profil";
import ForgotPassword from "./screens/ForgotPassword";
import VerifyOTP from "./screens/VerifyOTP";
import ResetPassword from "./screens/ResetPassword";
import Equipes from "./screens/Equipes";
import CreerEquipe from "./screens/CreerEquipe";
import FichePointage from './screens/FichePointage';
import CreerPlanning from './screens/CreerPlanning'; // La nouvelle page
import FaceScanner from "./screens/FaceScanner";
import QRScanner from "./screens/QRScanner";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PASSWORD FLOW */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* MAIN */}
        <Route path="/home" element={<Home />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/equipes" element={<Equipes />} />
        <Route path="/creer-equipe" element={<CreerEquipe />} />
        <Route path="/fiche-pointage" element={<FichePointage />} />
        <Route path="/creer-planning" element={<CreerPlanning />} />
        <Route path="/scanner-facial" element={<FaceScanner />} />
        <Route path="/scanner-qr" element={<QRScanner />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;