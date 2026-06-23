import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Veuillez saisir votre adresse e-mail !");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password'
    });
    setLoading(false);

    if (error) {
      alert("Erreur: " + error.message);
      return;
    }

    alert("Si un compte existe pour cet e-mail, un code de réinitialisation vous a été envoyé !");
    navigate('/verify-otp', { state: { email } });
  };

  return (
    <div style={styles.wrapper}>
      {/* Brand Side Panel */}
      <div style={styles.brandSide}>
        <div style={styles.brandOverlay} />
        <div style={styles.brandContent}>
          <img src="/Logo.png" alt="Aca Robotics" style={{ height: '80px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start', backgroundColor: '#112A6D', padding: '8px', borderRadius: '8px' }} />
          <div style={styles.brandCenterText}>
            <h1 style={styles.brandTitle}>Récupération de mot de passe</h1>
            <p style={styles.brandSubtitle}>
              Ne vous inquiétez pas ! Renseignez votre adresse e-mail pour recevoir un code OTP de réinitialisation sécurisé.
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
            <h2 style={styles.cardTitle}>Mot de passe oublié</h2>
            <p style={styles.cardSubtitle}>Saisissez votre e-mail pour commencer la récupération.</p>
          </div>

          <form onSubmit={handleReset} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Adresse e-mail</label>
              <input
                type="email"
                placeholder="nom@entreprise.com"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={styles.loginButton} disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le code OTP"}
            </button>
          </form>

          <p style={styles.signUpText}>
            Retour à la{' '}
            <span style={styles.link} onClick={() => navigate('/')}>
              connexion
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  brandSide: { flex: 1.2, position: 'relative', backgroundColor: '#112A6D', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '50px' },
  brandOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.15), transparent)', pointerEvents: 'none' },
  brandContent: { position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brandLogo: { fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '1.5px', fontFamily: 'var(--font-heading)' },
  brandCenterText: { maxWidth: '500px', margin: 'auto 0' },
  brandTitle: { fontSize: '42px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', fontFamily: 'var(--font-heading)', marginBottom: '20px' },
  brandSubtitle: { fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' },
  brandFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' },
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