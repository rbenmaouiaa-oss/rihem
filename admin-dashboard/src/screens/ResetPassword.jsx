import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    setLoading(false);

    if (error) {
      alert("Erreur de mise à jour: " + error.message);
      return;
    }

    alert("Votre mot de passe a été modifié avec succès ! Connectez-vous avec vos nouveaux identifiants.");
    navigate('/');
  };

  return (
    <div style={styles.wrapper}>
      {/* Brand Side Panel */}
      <div style={styles.brandSide}>
        <div style={styles.brandOverlay} />
        <div style={styles.brandContent}>
          <h2 style={styles.brandLogo}>LAVANCE-</h2>
          <div style={styles.brandCenterText}>
            <h1 style={styles.brandTitle}>Modifier le mot de passe</h1>
            <p style={styles.brandSubtitle}>
              Saisissez votre nouveau mot de passe administrateur pour finaliser la sécurisation de votre compte.
            </p>
          </div>
          <div style={styles.brandFooter}>
            <span style={styles.brandBadge}>Sécurité</span>
            <span style={styles.brandVersion}>v2.4.0</span>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div style={styles.formSide}>
        <div style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Nouveau mot de passe</h2>
            <p style={styles.cardSubtitle}>Saisissez et confirmez le nouveau code d'accès.</p>
          </div>

          <form onSubmit={handleReset} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={styles.loginButton} disabled={loading}>
              {loading ? "Modification..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  brandSide: { flex: 1.2, position: 'relative', backgroundColor: '#0b0f19', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '50px' },
  brandOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.15), transparent)', pointerEvents: 'none' },
  brandContent: { position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brandLogo: { fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '1.5px', fontFamily: 'var(--font-heading)' },
  brandCenterText: { maxWidth: '500px', margin: 'auto 0' },
  brandTitle: { fontSize: '42px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', fontFamily: 'var(--font-heading)', marginBottom: '20px' },
  brandSubtitle: { fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' },
  brandFooter: { display: 'flex', justifySub: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' },
  brandBadge: { fontSize: '12px', fontWeight: '700', color: 'var(--primary)', backgroundColor: 'rgba(37, 99, 235, 0.15)', padding: '6px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  brandVersion: { fontSize: '13px', color: '#64748b' },
  formSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: 'var(--bg-app)' },
  loginCard: { width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.6s ease' },
  cardHeader: { marginBottom: '30px' },
  cardTitle: { fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginBottom: '8px' },
  cardSubtitle: { fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '15px', color: 'var(--text-main)', backgroundColor: 'var(--bg-app)', outline: 'none', transition: 'var(--transition-smooth)' },
  loginButton: { width: '100%', padding: '14px', backgroundColor: 'var(--primary)', color: 'var(--text-white)', fontSize: '15px', fontWeight: '700', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)', marginTop: '10px' },
  signUpText: { textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '30px' },
  link: { color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }
};