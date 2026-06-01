import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [phone, setPhone] = useState('');
  const [poste, setPoste] = useState('');
  const [cin, setCin] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔐 REGISTER
  const register = async () => {
    if (!nom || !prenom || !email || !password || !confirmPassword) {
      alert("Veuillez remplir tous les champs obligatoires !");
      return;
    }

    if (!birthDate) {
      alert("Veuillez sélectionner votre date de naissance.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(`Erreur d'inscription: ${error.message}\n\n💡 ASTUCE: Si vous obtenez une erreur d'envoi d'e-mail, désactivez "Confirm Email" dans votre console Supabase (Authentication -> Providers -> Email -> Confirm email -> OFF).`);
      setLoading(false);
      return;
    }

    const user = data.user;

    const { error: dbError } = await supabase
      .from('employers')
      .insert([
        {
          id: user?.id,
          email,
          nom,
          prenom,
          phone,
          poste,
          cin,
          birthdate: birthDate
        }
      ]);

    setLoading(false);

    if (dbError) {
      alert("Compte auth créé mais erreur d'enregistrement dans la table employers: " + dbError.message);
      return;
    }

    alert("Compte créé avec succès ! 🎉 Vous pouvez maintenant vous connecter.");
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
            <h1 style={styles.brandTitle}>Rejoignez notre Espace Entreprise</h1>
            <p style={styles.brandSubtitle}>
              Créez votre compte administrateur ou collaborateur et accédez instantanément à vos outils de pointage interactifs.
            </p>
          </div>
          <div style={styles.brandFooter}>
            <span style={styles.brandBadge}>Inscription Rapide</span>
            <span style={styles.brandVersion}>v2.4.0</span>
          </div>
        </div>
      </div>

      {/* Register Form Side */}
      <div style={styles.formSide}>
        <div style={styles.registerCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Créer un compte</h2>
            <p style={styles.cardSubtitle}>Remplissez les informations ci-dessous pour vous enregistrer.</p>
          </div>

          <div style={styles.scrollContainer}>
            <div style={styles.form}>
              <div style={styles.row}>
                <div style={styles.flexField}>
                  <label style={styles.label}>Nom *</label>
                  <input
                    placeholder="Nom"
                    style={styles.input}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                <div style={styles.flexField}>
                  <label style={styles.label}>Prénom *</label>
                  <input
                    placeholder="Prénom"
                    style={styles.input}
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.flexField}>
                  <label style={styles.label}>Téléphone</label>
                  <input
                    placeholder="ex: +216 99 999 999"
                    style={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div style={styles.flexField}>
                  <label style={styles.label}>Poste</label>
                  <input
                    placeholder="ex: Ingénieur R&D"
                    style={styles.input}
                    value={poste}
                    onChange={(e) => setPoste(e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.flexField}>
                  <label style={styles.label}>Numéro CIN</label>
                  <input
                    placeholder="8 chiffres"
                    style={styles.input}
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                  />
                </div>
                <div style={styles.flexField}>
                  <label style={styles.label}>Date de naissance *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Adresse e-mail *</label>
                <input
                  placeholder="nom@entreprise.com"
                  type="email"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mot de passe *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    style={styles.passwordInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirmer le mot de passe *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    placeholder="••••••••"
                    type={showConfirmPassword ? 'text' : 'password'}
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                style={styles.button}
                onClick={register}
                disabled={loading}
              >
                {loading ? "Création du compte..." : "Créer mon compte"}
              </button>
            </div>

            <p style={styles.signUpText}>
              Vous possédez déjà un compte ?{' '}
              <span style={styles.link} onClick={() => navigate('/')}>
                Se connecter
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 HIGH-END STYLES DICTIONARY (MATCHING LOGIN SCREEN)
const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    fontFamily: 'var(--font-sans)',
    overflow: 'hidden'
  },
  brandSide: {
    flex: 1.2,
    position: 'relative',
    backgroundColor: '#0b0f19',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '50px',
    '@media (max-width: 900px)': {
      display: 'none'
    }
  },
  brandOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
    backdropFilter: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.15), transparent)',
    pointerEvents: 'none'
  },
  brandContent: {
    position: 'relative',
    zIndex: 10,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  brandLogo: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '1.5px',
    fontFamily: 'var(--font-heading)'
  },
  brandCenterText: {
    maxWidth: '500px',
    margin: 'auto 0'
  },
  brandTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1.2',
    fontFamily: 'var(--font-heading)',
    marginBottom: '20px',
    textShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  brandSubtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    lineHeight: '1.6'
  },
  brandFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px'
  },
  brandBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--primary)',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    padding: '6px 14px',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  brandVersion: {
    fontSize: '13px',
    color: '#64748b'
  },
  formSide: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '30px 40px',
    backgroundColor: 'var(--bg-app)'
  },
  registerCard: {
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '20px',
    padding: '35px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeInUp 0.6s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeader: {
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    color: 'var(--text-main)',
    marginBottom: '6px'
  },
  cardSubtitle: {
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  },
  scrollContainer: {
    overflowY: 'auto',
    paddingRight: '6px',
    flex: 1
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  row: {
    display: 'flex',
    gap: '15px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  flexField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14.5px',
    color: 'var(--text-main)',
    backgroundColor: 'var(--bg-app)',
    outline: 'none',
    transition: 'var(--transition-smooth)',
    width: '100%'
  },
  passwordWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-app)',
    overflow: 'hidden',
    transition: 'var(--transition-smooth)'
  },
  passwordInput: {
    flex: 1,
    padding: '12px 14px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14.5px',
    color: 'var(--text-main)'
  },
  eyeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    paddingRight: '14px',
    display: 'flex',
    alignItems: 'center'
  },
  button: {
    width: '100%',
    padding: '13px',
    backgroundColor: 'var(--primary)',
    color: 'var(--text-white)',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
    transition: 'var(--transition-smooth)',
    marginTop: '15px'
  },
  signUpText: {
    textAlign: 'center',
    fontSize: '13.5px',
    color: 'var(--text-muted)',
    marginTop: '25px',
    marginBottom: '5px'
  },
  link: {
    color: 'var(--primary)',
    fontWeight: '700',
    cursor: 'pointer'
  }
};