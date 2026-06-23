import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from './RBACContext';

export default function ProtectedRoute({ allowedRoles, children, redirectTo = '/' }) {
  const { role, loading } = useRBAC();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#030712',
        color: '#06b6d4',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        <div style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '8px'
        }}>
          Vérification des accès...
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
