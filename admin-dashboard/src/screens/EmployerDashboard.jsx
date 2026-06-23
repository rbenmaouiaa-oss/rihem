import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mon-profil');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [pointages, setPointages] = useState([]);
  const [plannings, setPlannings] = useState([]);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', phone: '', adresse: '', ville: '', code_postal: '',
    type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
    genre: '', etat_civil: '', autre_telephone: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [filterDateDebut, setFilterDateDebut] = useState('');
const [filterDateFin, setFilterDateFin] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const savedEmail = localStorage.getItem('email');
      if (!savedEmail) { navigate('/'); return; }

      const { data: userData } = await supabase.from('users').select('*').eq('email', savedEmail);
      if (!userData || userData.length === 0) { navigate('/'); return; }

      const user = userData[0];
      setCurrentUser(user);
      setFormData({
        nom: user.nom || '', prenom: user.prenom || '', email: user.email || '',
        phone: user.phone || '', adresse: user.address || user.adresse || '', ville: user.ville || '',
        code_postal: user.code_postal || '',
        type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
        genre: '', etat_civil: '', autre_telephone: ''
      });

      let attQuery = supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false }).limit(5000);
      const { data: pointageData } = await attQuery;
      if (pointageData && pointageData.length > 0) {
        setPointages(pointageData);
      }

      const { data: planningData } = await supabase
        .from('plannings')
        .select('*')
        .limit(10);
      if (planningData && planningData.length > 0) {
        setPlannings(planningData);
      }

      if (user.company_id) {
        const { data: collabData } = await supabase
          .from('users')
          .select('*')
          .eq('company_id', user.company_id)
          .neq('id', user.id);
          if (collabData && collabData.length > 0) {
            const collabIds = collabData.map(c => c.id);
            const today = new Date().toISOString().split('T')[0];
            const { data: todayAtts } = await supabase
              .from('attendance_logs')
              .select('employee_id, status')
              .in('employee_id', collabIds)
              .eq('date', today);
            const attMap = {};
            if (todayAtts) {
              todayAtts.forEach(a => { attMap[a.employee_id] = a.status; });
            }
            setCollaborators(collabData.map(c => ({ ...c, genre: c.genre || 'Homme', todayStatus: attMap[c.id] || 'absent' })));
          }
        }

      const { data: profileData } = await supabase
        .from('profil_employes')
        .select('*')
        .eq('email', savedEmail)
        .maybeSingle();
      if (profileData) {
        setProfile(profileData);
        setFormData(prev => ({ ...prev,
          type_contrat: profileData.type_contrat || '',
          numero_employe: profileData.numero_employe || '',
          date_naissance: profileData.date_naissance || '',
          date_recrutement: profileData.date_recrutement || '',
          genre: profileData.genre || '',
          etat_civil: profileData.etat_civil || '',
          autre_telephone: profileData.autre_telephone || ''
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: userErr, data: updated } = await supabase
        .from('users')
        .update({ nom: formData.nom, prenom: formData.prenom, phone: formData.phone })
        .eq('email', formData.email)
        .select();
      if (userErr) throw userErr;
      if (!updated || updated.length === 0) throw new Error('Aucun utilisateur trouvé avec cet email');

      const { error: profilErr } = await supabase
        .from('profil_employes')
        .upsert([{
          email: formData.email, adresse: formData.adresse, ville: formData.ville,
          code_postal: formData.code_postal, type_contrat: formData.type_contrat,
          numero_employe: formData.numero_employe, date_naissance: formData.date_naissance,
          date_recrutement: formData.date_recrutement, genre: formData.genre,
          etat_civil: formData.etat_civil, autre_telephone: formData.autre_telephone
        }], { onConflict: 'email' });
      if (profilErr) throw profilErr;

      showToast('Profil mis à jour avec succès');
    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = currentUser
    ? `${(currentUser.prenom || '')[0] || ''}${(currentUser.nom || '')[0] || ''}`.toUpperCase()
    : 'EM';

  const tabItems = [
    { key: 'mon-profil', label: 'Mon Tableau de Bord', icon: '📊' },
    { key: 'fiche-pointage', label: 'Fiche de Pointage', icon: '⏱️' },
    { key: 'modifier-profil', label: 'Modifier Profil', icon: '✏️' },
    { key: 'mon-planning', label: 'Mon Planning', icon: '📅' },
  ];

  const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#030712', color: '#f9fafb', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    sidebar: {
      width: '280px', backgroundColor: '#112A6D', borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', padding: '20px', height: '100vh',
      position: 'fixed', zIndex: 10
    },
    logoSection: {
      padding: '10px 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.15)',
      marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px'
    },
    roleBadge: {
      alignSelf: 'flex-start', fontSize: '9px', fontWeight: '800',
      backgroundColor: 'rgba(6,182,212,0.12)', color: '#06b6d4',
      padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.8px'
    },
    navItem: {
      padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#94a3b8',
      cursor: 'pointer', borderRadius: '10px', transition: 'all 0.25s ease',
      display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#112A6D'
    },
    navItemActive: {
      padding: '12px 16px', fontSize: '13px', fontWeight: '700',
      backgroundColor: 'rgba(6,182,212,0.08)', borderLeft: '4px solid #06b6d4',
      color: '#f9fafb', cursor: 'pointer', borderRadius: '10px',
      display: 'flex', alignItems: 'center', gap: '12px'
    },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', marginLeft: '280px' },
    header: {
      height: '75px', backgroundColor: 'rgba(3,7,18,0.6)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', position: 'sticky', top: 0, zIndex: 5
    },
    userProfile: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatarCircle: {
      width: '38px', height: '38px', borderRadius: '50%',
      backgroundColor: 'rgba(6,182,212,0.12)', color: '#06b6d4',
      fontSize: '14px', fontWeight: 'bold',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(6,182,212,0.2)'
    },
    profileName: { fontSize: '13px', fontWeight: '700', color: '#f9fafb' },
    profileEmail: { fontSize: '10px', color: '#64748b' },
    content: { padding: '40px', animation: 'fadeInUp 0.4s ease both' },
    card: {
      backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', padding: '30px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
    },
    cardTitle: { fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    infoLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
    infoValue: { fontSize: '15px', fontWeight: '600', color: '#f1f5f9' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)' },
    td: { padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    badge: { fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' },
    label: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' },
    input: {
      padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
      backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box'
    },
    formRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
    field: { flex: 1, display: 'flex', flexDirection: 'column' },
    button: {
      padding: '12px 24px', backgroundColor: '#06b6d4', border: 'none',
      borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
    },
    buttonDisabled: { padding: '12px 24px', backgroundColor: '#394e6a', border: 'none', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold', fontSize: '14px' },
    logout: {
      fontSize: '13px', fontWeight: '600', color: '#ef4444', cursor: 'pointer',
      padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto'
    },
    toast: {
      position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
      padding: '12px 24px', borderRadius: '10px', color: 'white',
      backgroundColor: '#065f46', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
      animation: 'slideInRight 0.3s ease both'
    },
    emptyState: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: {
      backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', textAlign: 'center'
    },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#06b6d4' },
    statLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px' },
    planningCard: {
      backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px', marginBottom: '12px'
    },
    planningName: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9' },
    planningTime: { fontSize: '13px', color: '#94a3b8', marginTop: '4px' },
    planningDays: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' },
    dayBadge: {
      fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
      backgroundColor: 'rgba(6,182,212,0.1)', color: '#06b6d4'
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#030712', color: '#06b6d4', fontSize: '16px' }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toast.show && <div style={styles.toast}>{toast.message}</div>}

      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <img src="/Logo.png" alt="Aca Robotics" style={{ height: '50px', width: 'auto', objectFit: 'contain', backgroundColor: '#112A6D', padding: '5px', borderRadius: '6px' }} />
          <span style={styles.roleBadge}>EMPLOYER</span>
        </div>
        <nav>
          {tabItems.map(tab => (
            <div
              key={tab.key}
              style={activeTab === tab.key ? styles.navItemActive : styles.navItem}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </nav>
        <div style={styles.logout} onClick={() => navigate('/')}>
          <span>🚪</span> Déconnexion
        </div>
      </aside>

      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div />
          <div style={styles.userProfile}>
            <div style={styles.avatarCircle}>{initials}</div>
            <div>
              <div style={styles.profileName}>{currentUser?.prenom} {currentUser?.nom}</div>
              <div style={styles.profileEmail}>{currentUser?.email}</div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {/* TAB: Mon Tableau de Bord */}
          {activeTab === 'mon-profil' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                  Bonjour, {currentUser?.prenom || 'Employer'} 👋
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
                  Voici votre tableau de bord aujourd'hui
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'left' }}>
                  📋 Votre Planning du Jour
                </h3>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entrée 1</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#06b6d4' }}>08:00</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sortie 1</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>12:00</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entrée 2</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#06b6d4' }}>14:00</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sortie 2</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>17:00</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'left' }}>
                  📊 Taux de Présence & Badges
                </h3>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Taux de Présence</div>
                    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <circle cx="70" cy="70" r="60" fill="none" stroke="#10B981" strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 60}`}
                          strokeDashoffset={`${2 * Math.PI * 60 * (1 - 86 / 100)}`}
                          strokeLinecap="round" transform="rotate(-90 70 70)" />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>86%</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Présence</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Badges</div>
                    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <circle cx="70" cy="70" r="60" fill="none" stroke="#10B981" strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 60}`}
                          strokeDashoffset={`${2 * Math.PI * 60 * (1 - 100 / 100)}`}
                          strokeLinecap="round" transform="rotate(-90 70 70)" />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>100%</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Badges</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', textAlign: 'left' }}>
                  👥 Vos Collaborateurs
                </h3>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  overflowX: 'auto'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Collaborateur</th>
                        <th style={styles.th}>Rôle</th>
                        <th style={styles.th}>Genre</th>
                        <th style={styles.th}>Téléphone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborators.length === 0 ? (
                        <tr><td colSpan={4} style={styles.emptyState}>Aucun collaborateur trouvé</td></tr>
                      ) : (
                        collaborators.map((c, i) => (
                          <tr key={c.id || i}>
                            <td style={{ ...styles.td, fontWeight: 'bold' }}>{c.prenom} {c.nom}</td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: c.role === 'Manager' ? 'rgba(245,158,11,0.12)' : c.role === 'CompanyAdmin' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)',
                                color: c.role === 'Manager' ? '#f59e0b' : c.role === 'CompanyAdmin' ? '#06b6d4' : '#94a3b8'
                              }}>{({ CompanyAdmin: 'Administrateur', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[c.role] || c.role || 'Employé'}</span>
                            </td>
                            <td style={styles.td}>{c.genre === 'Féminin' || c.genre === 'Female' || c.genre === 'Femme' ? 'Femme' : c.genre === 'Masculin' || c.genre === 'Male' || c.genre === 'Homme' ? 'Homme' : c.genre || '-'}</td>
                            <td style={styles.td}>{c.phone || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Fiche de Pointage */}
          {activeTab === 'fiche-pointage' && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 20px 0', textAlign: 'left' }}>
                📋 Fiche de Pointage
              </h2>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>Date début</label>
                  <input type="date" value={filterDateDebut} onChange={(e) => setFilterDateDebut(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>Date fin</label>
                  <input type="date" value={filterDateFin} onChange={(e) => setFilterDateFin(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px' }} />
                </div>
                <button onClick={async () => {
                  if (!currentUser?.id) return;
                  let q = supabase.from('attendance_logs').select('*').eq('employee_id', currentUser.id).order('date', { ascending: false }).limit(5000);
                  if (filterDateDebut) q = q.gte('date', filterDateDebut);
                  if (filterDateFin) q = q.lte('date', filterDateFin);
                  const { data } = await q;
                  if (data) setPointages(data);
                }}
                  style={{ padding: '10px 20px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  🔍 Chercher
                </button>
              </div>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Entrée 1</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Sortie 1</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Entrée 2</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Sortie 2</th>
                      <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(15,23,42,0.3)', textAlign: 'left' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let filtered = [...pointages];
                      if (filterDateDebut) filtered = filtered.filter(p => p.date >= filterDateDebut);
                      if (filterDateFin) filtered = filtered.filter(p => p.date <= filterDateFin);
                      return filtered.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun pointage trouvé</td></tr>
                      ) : (
                        filtered.map((p, i) => (
                          <tr key={p.id || i}>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{p.date}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{p.entree1 || p.time || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{p.sortie1 || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{p.entree2 || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{p.sortie2 || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{
                                fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', display: 'inline-block',
                                backgroundColor: p.status === 'present' ? 'rgba(16,185,129,0.15)' : p.status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: p.status === 'present' ? '#22c55e' : p.status === 'late' ? '#f59e0b' : '#ef4444'
                              }}>
                                {p.status === 'present' ? 'PRÉSENT' : p.status === 'late' ? 'RETARD' : 'ABSENT'}
                              </span>
                            </td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Modifier Profil */}
          {activeTab === 'modifier-profil' && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Modifier Mon Profil</h3>
              <form onSubmit={handleSaveProfile}>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Prénom</label>
                    <input style={styles.input} value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Nom</label>
                    <input style={styles.input} value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input style={styles.input} value={formData.email} disabled />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Téléphone</label>
                    <input style={styles.input} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Adresse</label>
                    <input style={styles.input} value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Ville</label>
                    <input style={styles.input} value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Code Postal</label>
                    <input style={styles.input} value={formData.code_postal} onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Type Contrat</label>
                    <input style={styles.input} value={formData.type_contrat} onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value })} placeholder="CDI, CDD, Stage..." />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Numéro Employé</label>
                    <input style={styles.input} value={formData.numero_employe} onChange={(e) => setFormData({ ...formData, numero_employe: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Genre</label>
                    <select style={styles.input} value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })}>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>Date Naissance</label>
                    <input type="date" style={styles.input} value={formData.date_naissance} onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Date Recrutement</label>
                    <input type="date" style={styles.input} value={formData.date_recrutement} onChange={(e) => setFormData({ ...formData, date_recrutement: e.target.value })} />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.field}>
                    <label style={styles.label}>État Civil</label>
                    <select style={styles.input} value={formData.etat_civil} onChange={(e) => setFormData({ ...formData, etat_civil: e.target.value })}>
                      <option value="">Sélectionner</option>
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Autre Téléphone</label>
                    <input style={styles.input} value={formData.autre_telephone} onChange={(e) => setFormData({ ...formData, autre_telephone: e.target.value })} placeholder="ex: +216 99 999 999" />
                  </div>
                </div>
                <button type="submit" style={saving ? styles.buttonDisabled : styles.button} disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: Mon Planning */}
          {activeTab === 'mon-planning' && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Mon Planning</h3>
              {plannings.length === 0 ? (
                <p style={styles.emptyState}>Aucun planning disponible</p>
              ) : (
                plannings.map((p, i) => (
                  <div key={p.id || i} style={styles.planningCard}>
                    <div style={styles.planningName}>{p.name}</div>
                    {p.description && <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0' }}>{p.description}</p>}
                    <div style={styles.planningTime}>
                      {p.start_time} - {p.end_time}
                    </div>
                    {p.working_days && p.working_days.length > 0 && (
                      <div style={styles.planningDays}>
                        {p.working_days.map((day, j) => (
                          <span key={j} style={styles.dayBadge}>{day}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
