import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function Profil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initials, setInitials] = useState('AV');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Unified form states
  const [formData, setFormData] = useState({
    nom: '', prenom: '', type_contrat: '', numero_employe: '',
    date_naissance: '', date_recrutement: '', genre: '', etat_civil: '',
    fonction: '', telephone_professionnel: '', description: '',
    adresse: '', code_postal: '', ville: '', autre_telephone: '', email: '',
    nom_contact_urgence: '', lien_contact_urgence: '', telephone_urgence: ''
  });

  // 2. Fetch logged-in user and existing profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Update initials when nom or prenom changes
  useEffect(() => {
    const fLetter = formData.prenom?.[0] || '';
    const lLetter = formData.nom?.[0] || '';
    setInitials(`${fLetter}${lLetter}`.toUpperCase() || 'AV');
  }, [formData.nom, formData.prenom]);

  async function loadUserProfile() {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Erreur d'authentification ou session expirée 👤", "error");
        return;
      }

      // Query profil_employes where email matches user's email
      const { data: profileData, error: dbError } = await supabase
        .from('profil_employes')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (dbError) {
        console.error("Supabase Profile Fetch Error:", dbError.message);
      }

      if (profileData) {
        setFormData(profileData);
      } else {
        // Auto fill email if no database record exists yet
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de chargement du profil ❌", "error");
    } finally {
      setLoading(false);
    }
  }

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Premium Floating Banner Alerts
  function showToast(message, type = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  }

  // Refactored Upsert handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Sanitize empty strings on date columns to null to avoid Postgres type mismatch errors
    const sanitizedData = {
      ...formData,
      date_naissance: formData.date_naissance === "" ? null : formData.date_naissance,
      date_recrutement: formData.date_recrutement === "" ? null : formData.date_recrutement
    };

    try {
      const { error } = await supabase
        .from('profil_employes')
        .upsert([sanitizedData], { onConflict: 'email' });

      if (error) {
        showToast("Erreur lors de l'enregistrement: " + error.message, "error");
      } else {
        showToast("Votre profil a été enregistré avec succès ! 🎉", "success");
        // Reload fresh updates
        loadUserProfile();
      }
    } catch (err) {
      showToast("Erreur: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {/* HEADER BAR */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>ADMIN</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>{initials[0]}</div>
            <span>{formData.prenom || 'Admin'} ▾</span>
          </div>
        </header>

        {/* PREMIUM TOAST NOTIFICATION */}
        {toast.show && (
          <div style={{
            ...styles.toastNotification,
            backgroundColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
            boxShadow: toast.type === 'success' ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 10px 30px rgba(239, 68, 68, 0.3)'
          }}>
            <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '🔔' : '⚠️'}</span>
            <span style={{ fontWeight: '700' }}>{toast.message}</span>
          </div>
        )}

        <div style={styles.content}>
          <form onSubmit={handleSubmit} style={styles.formLayout}>
            
            {/* COLONNE GAUCHE */}
            <div style={styles.leftColumn}>
              
              {/* PORTRAIT HEADER CARD */}
              <div style={styles.profileHeaderCard}>
                <div style={styles.avatarCircle}>{initials}</div>
                <div>
                  <h3 style={styles.profileMainName}>{formData.prenom || 'Nouveau'} {formData.nom || 'Profil'}</h3>
                  <span style={styles.profileMainEmail}>📧 {formData.email}</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Fonction: {formData.fonction || 'Non spécifiée'}
                  </p>
                </div>
              </div>

              {/* SECTION INFORMATION PERSONNEL */}
              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>INFORMATION PERSONNEL</h3>
                
                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>NOM</label>
                    <input style={styles.input} name="nom" value={formData.nom} onChange={handleChange} placeholder="Nom de l'employé" required />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>PRÉNOM</label>
                    <input style={styles.input} name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Prénom de l'employé" required />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>TYPE DE CONTRAT</label>
                    <input style={styles.input} name="type_contrat" value={formData.type_contrat} onChange={handleChange} placeholder="CDI, CDD, Freelance..." />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>TÉLÉPHONE MOBILE</label>
                    <input style={styles.input} name="numero_employe" value={formData.numero_employe} onChange={handleChange} placeholder="+216 XX XXX XXX" />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>DATE DE NAISSANCE</label>
                    <input type="date" style={styles.input} name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange} />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>DATE DE RECRUTEMENT</label>
                    <input type="date" style={styles.input} name="date_recrutement" value={formData.date_recrutement || ''} onChange={handleChange} />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>GENRE</label>
                    <select style={styles.select} name="genre" value={formData.genre} onChange={handleChange}>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>ÉTAT CIVIL</label>
                    <input style={styles.input} name="etat_civil" value={formData.etat_civil} onChange={handleChange} placeholder="Célibataire, Marié..." />
                  </div>
                </div>
              </section>

              {/* SECTION INFORMATION PUBLIQUE */}
              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>INFORMATION PROFESSIONNELLE</h3>
                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>FONCTION / POSTE</label>
                    <input style={styles.input} name="fonction" value={formData.fonction} onChange={handleChange} placeholder="Développeur, Manager..." />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>TÉLÉPHONE PROFESSIONNEL</label>
                    <input style={styles.input} name="telephone_professionnel" value={formData.telephone_professionnel} onChange={handleChange} placeholder="+216 XX XXX XXX" />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>NOTE & DESCRIPTION</label>
                  <textarea style={styles.textarea} name="description" value={formData.description} onChange={handleChange} placeholder="Courte description professionnelle..."></textarea>
                </div>
              </section>
            </div>

            {/* COLONNE DROITE */}
            <div style={styles.rightColumn}>
              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>COORDONNÉES DE CONTACT</h3>
                
                <div style={styles.field}>
                  <label style={styles.label}>ADRESSE RÉSIDENTIELLE</label>
                  <input style={styles.input} name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Adresse du domicile" />
                </div>

                <div style={styles.row}>
                  <div style={styles.flexField}>
                    <label style={styles.label}>CODE POSTAL</label>
                    <input style={styles.input} name="code_postal" value={formData.code_postal} onChange={handleChange} placeholder="Tunis Code" />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>VILLE</label>
                    <input style={styles.input} name="ville" value={formData.ville} onChange={handleChange} placeholder="Ville" />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>AUTRE TÉLÉPHONE FIXE</label>
                  <input style={styles.input} name="autre_telephone" value={formData.autre_telephone} onChange={handleChange} placeholder="+216 XX XXX XXX" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>ADRESSE EMAIL D'ACCÈS</label>
                  <input type="email" style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}} name="email" value={formData.email} disabled placeholder="Email" />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>⚠️ L'adresse e-mail est liée à vos identifiants d'accès et ne peut être modifiée.</span>
                </div>

                <div style={styles.row}>
                  <div style={{...styles.flexField, flex: 1.5}}>
                    <label style={styles.label}>CONTACT EN CAS D'URGENCE</label>
                    <input style={styles.input} name="nom_contact_urgence" value={formData.nom_contact_urgence} onChange={handleChange} placeholder="Nom du contact" />
                  </div>
                  <div style={styles.flexField}>
                    <label style={styles.label}>LIEN (PARENT, AMI...)</label>
                    <input style={styles.input} name="lien_contact_urgence" value={formData.lien_contact_urgence} onChange={handleChange} placeholder="Ex: Mère, Conjoint" />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>TÉLÉPHONE URGENCE</label>
                  <input style={styles.input} name="telephone_urgence" value={formData.telephone_urgence} onChange={handleChange} placeholder="+216 XX XXX XXX" />
                </div>
              </section>

              {/* PREMIUM SUBSCRIPTION PANEL */}
              <section style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>LICENCE & ABONNEMENT</h3>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'white', backgroundColor: 'var(--success)', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>PRO MAX ACTIVE</span>
                </div>

                <div style={styles.premiumBox}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '28px' }}>🚀</span>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>Lavance Attendance Pro Max</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Prochaine facturation : 24 Juin 2026</p>
                    </div>
                  </div>

                  <div style={{ marginTop: 15, padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Collaborateurs actifs</span>
                      <strong style={{ color: 'var(--primary)' }}>48 / 100</strong>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: '48%', height: '100%', backgroundColor: 'var(--primary)', borderRadius: 3 }} />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    style={styles.upgradeBtn} 
                    onClick={() => alert("Vous possédez déjà l'abonnement optimal ! 👑")}
                  >
                    👑 Mettre à jour l'abonnement
                  </button>
                </div>
              </section>

              <button type="submit" disabled={loading} style={styles.planningButton}>
                {loading ? "💾 Enregistrement en cours..." : "💾 Enregistrer mon Profil"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },

  main: { flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1px' },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' },
  
  // Custom Toast style
  toastNotification: { position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderRadius: '14px', color: 'white', fontWeight: '700', animation: 'fadeInUp 0.4s ease', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' },
  
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  formLayout: { display: 'flex', gap: '30px', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' },
  leftColumn: { flex: 1.3, display: 'flex', flexDirection: 'column', gap: '25px', minWidth: '320px' },
  rightColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '25px', minWidth: '320px' },
  
  // Profile Header Card
  profileHeaderCard: { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '25px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '20px', alignItems: 'center' },
  avatarCircle: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', border: '3px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', color: 'var(--primary)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)' },
  profileMainName: { fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' },
  profileMainEmail: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' },

  card: { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '25px', boxShadow: 'var(--shadow-sm)' },
  sectionTitle: { color: 'var(--text-main)', fontSize: '14px', marginTop: 0, marginBottom: '25px', fontWeight: '800', borderLeft: '4px solid var(--primary)', paddingLeft: '12px', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' },
  row: { display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' },
  field: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
  flexField: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' },
  label: { color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-main)', backgroundColor: 'var(--bg-app)', outline: 'none', transition: 'var(--transition-smooth)' },
  select: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-main)', backgroundColor: 'var(--bg-app)', outline: 'none', transition: 'var(--transition-smooth)', cursor: 'pointer' },
  textarea: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text-main)', height: '100px', backgroundColor: 'var(--bg-app)', resize: 'none', outline: 'none', transition: 'var(--transition-smooth)' },
  planningButton: { backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', width: '100%', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)' },
  premiumBox: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' },
  upgradeBtn: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', width: '100%', transition: 'var(--transition-smooth)' }
};