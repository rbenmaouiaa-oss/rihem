import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';
import AnalysePointage from "./AnalysePointage";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('mon-tableau');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [plannings, setPlannings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editPlanning, setEditPlanning] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStart, setEditStart] = useState('08:00');
  const [editEnd, setEditEnd] = useState('17:00');
  const [editDays, setEditDays] = useState([]);
  const [savingPlanning, setSavingPlanning] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', phone: '', adresse: '', ville: '', code_postal: '',
    type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
    genre: '', etat_civil: '', autre_telephone: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    setSelectedTeam(null);
    if (tabParam === 'mon-tableau' || tabParam === 'mes-equipes' || tabParam === 'mon-profil' || tabParam === 'ma-fiche' || tabParam === 'mon-planning' || tabParam === 'mes-collaborateurs' || tabParam === 'pointage') {
      setActiveTab(tabParam);
    } else {
      setActiveTab('mon-profil');
    }
  }, [location.search]);

  useEffect(() => {
    fetchManagerData();
  }, []);

  async function fetchManagerData() {
    setLoading(true);
    try {
      const savedEmail = localStorage.getItem('email');
      if (!savedEmail) { setLoading(false); return; }

      const { data: userData } = await supabase.from('users').select('*').eq('email', savedEmail);
      if (!userData || userData.length === 0) { setLoading(false); return; }

      const manager = userData[0];
      setCurrentUser(manager);

      let teamMemberIds = [];

      const teamResp = await fetch('https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/teams?select=*&manager_id=eq.' + manager.id, {
        headers: { apikey: 'sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv', Authorization: 'Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv' }
      });
      const teamData = await teamResp.json();
      if (teamData && teamData.length > 0) {
        const teamsWithMembers = await Promise.all(teamData.map(async (t) => {
          const memResp = await fetch('https://npouyrppjqbxifuvpqan.supabase.co/rest/v1/team_members?select=user_id&team_id=eq.' + t.id, {
            headers: { apikey: 'sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv', Authorization: 'Bearer sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv' }
          });
          const members = await memResp.json();
          if (members && Array.isArray(members)) {
            teamMemberIds.push(...members.map(m => m.user_id));
          }
          return { ...t, member_count: (members && Array.isArray(members)) ? members.length : 0 };
        }));
        setTeams(teamsWithMembers);
      } else {
        setTeams([]);
      }

      teamMemberIds = [...new Set(teamMemberIds)];

      if (teamMemberIds.length > 0) {
        const { data: empData } = await supabase.from('users').select('*').in('id', teamMemberIds);
        if (empData && empData.length > 0) {
          setEmployees(empData);
        } else {
          setEmployees([]);
        }
      } else {
        setEmployees([]);
      }

      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      if (teamMemberIds.length > 0) {
        const { data: attData } = await supabase.from('attendance_logs')
          .select('*').in('employee_id', teamMemberIds).gte('date', dateStr).order('created_at', { ascending: false });
        if (attData && attData.length > 0) {
          setAttendanceLogs(attData);
        } else {
          setAttendanceLogs([]);
        }
      } else {
        setAttendanceLogs([]);
      }

      const { data: allEmp } = await supabase.from('users').select('*').eq('company_id', manager.company_id);
      setAllEmployees(allEmp || []);

      if (manager.company_id) {
        const empIds = (allEmp || []).map(u => u.id);
        if (empIds.length > 0) {
          const { data: allAtt } = await supabase.from('attendance_logs')
            .select('*').in('employee_id', empIds).gte('date', dateStr).order('created_at', { ascending: false });
          setAllAttendance(allAtt || []);
        } else {
          setAllAttendance([]);
        }
      } else {
        setAllAttendance([]);
      }

      const { data: myAtt } = await supabase.from('attendance_logs')
        .select('*').eq('employee_id', manager.id).order('created_at', { ascending: false });
      if (myAtt && myAtt.length > 0) {
        setMyAttendance(myAtt);
      } else {
        setMyAttendance([]);
      }

      setFormData({
        nom: manager.nom || '', prenom: manager.prenom || '', email: manager.email || '',
        phone: manager.phone || '', adresse: manager.address || manager.adresse || '', ville: manager.ville || '',
        code_postal: manager.code_postal || '',
        type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
        genre: '', etat_civil: '', autre_telephone: ''
      });

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

      const { data: planningData } = await supabase
        .from('plannings')
        .select('*')
        .limit(10);
      if (planningData && planningData.length > 0) {
        setPlannings(planningData);
      }

    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.container}>
      {toast.show && <div style={styles.toast}>{toast.message}</div>}
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div></div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>{currentUser?.prenom?.[0] || 'M'}</div>
            <span>{currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Manager'}</span>
          </div>
        </header>

        <div style={styles.content}>
          {loading && <div style={styles.loader}>Chargement des données...</div>}

          {!loading && (
            <>
              {/* Tab: Mon Tableau de Bord */}
              {activeTab === 'mon-tableau' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                      Bonjour, {currentUser?.prenom || 'Manager'} 👋
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
                            <th style={styles.th}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allEmployees.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun collaborateur trouvé</td></tr>
                          ) : (
                            allEmployees.map((emp, i) => (
                              <tr key={emp.id || i}>
                                <td style={{ ...styles.td, fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                                <td style={styles.td}>
                                  <span style={{
                                    ...styles.badge,
                                    backgroundColor: emp.role === 'Manager' ? 'rgba(245,158,11,0.12)' : emp.role === 'CompanyAdmin' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)',
                                    color: emp.role === 'Manager' ? '#f59e0b' : emp.role === 'CompanyAdmin' ? '#06b6d4' : '#94a3b8'
                                  }}>{({ CompanyAdmin: 'Administrateur', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[emp.role] || emp.role || 'Employé'}</span>
                                </td>
                                <td style={styles.td}>{emp.genre === 'Féminin' || emp.genre === 'Female' || emp.genre === 'Femme' ? 'Femme' : emp.genre === 'Masculin' || emp.genre === 'Male' || emp.genre === 'Homme' ? 'Homme' : emp.genre || '-'}</td>
                                <td style={styles.td}>{emp.phone || '-'}</td>
                                <td style={styles.td}>
                                  <span style={{
                                    ...styles.badge,
                                    backgroundColor: (emp.status||'').toLowerCase().trim().startsWith('pr') ? 'rgba(16,185,129,0.15)' : (emp.status||'').toLowerCase().trim() === 'late' || (emp.status||'').toLowerCase().trim() === 'retard' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: (emp.status||'').toLowerCase().trim().startsWith('pr') ? '#22c55e' : (emp.status||'').toLowerCase().trim() === 'late' || (emp.status||'').toLowerCase().trim() === 'retard' ? '#f59e0b' : '#ef4444'
                                  }}>{(emp.status||'').toLowerCase().trim().startsWith('pr') ? 'PRÉSENT' : (emp.status||'').toLowerCase().trim() === 'late' || (emp.status||'').toLowerCase().trim() === 'retard' ? 'RETARD' : 'ABSENT'}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Mon Profil */}
              {activeTab === 'mon-profil' && (
                <div>
                  <div style={styles.pageTitle}>Mon Profil</div>
                  <div style={styles.divider}></div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Modifier Mon Profil</h3>
                    <form onSubmit={handleSaveProfile}>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Prénom</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Nom</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Email</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.email} disabled />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Téléphone</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Adresse</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Ville</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Code Postal</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.code_postal} onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Type Contrat</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.type_contrat} onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value })} placeholder="CDI, CDD, Stage..." />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Numéro Employé</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.numero_employe} onChange={(e) => setFormData({ ...formData, numero_employe: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Genre</label>
                          <select style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })}>
                            <option value="">Sélectionner</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Date Naissance</label>
                          <input type="date" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.date_naissance} onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Date Recrutement</label>
                          <input type="date" style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.date_recrutement} onChange={(e) => setFormData({ ...formData, date_recrutement: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>État Civil</label>
                          <select style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.etat_civil} onChange={(e) => setFormData({ ...formData, etat_civil: e.target.value })}>
                            <option value="">Sélectionner</option>
                            <option value="Célibataire">Célibataire</option>
                            <option value="Marié(e)">Marié(e)</option>
                            <option value="Divorcé(e)">Divorcé(e)</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>Autre Téléphone</label>
                          <input style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} value={formData.autre_telephone} onChange={(e) => setFormData({ ...formData, autre_telephone: e.target.value })} placeholder="ex: +216 99 999 999" />
                        </div>
                      </div>
                      <button type="submit" style={saving ? { padding: '12px 24px', backgroundColor: '#394e6a', border: 'none', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold', fontSize: '14px' } : { padding: '12px 24px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }} disabled={saving}>
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab: Ma Fiche de Pointage */}
              {activeTab === 'ma-fiche' && currentUser && (
                <AnalysePointage
                  employee={currentUser}
                  pointages={myAttendance}
                  allPointages={myAttendance}
                  onClose={() => setActiveTab('mon-tableau')}
                />
              )}

              {/* Tab: Mon Planning */}
              {activeTab === 'mon-planning' && (
                <div>
                  <div style={styles.pageTitle}>Mon Planning</div>
                  <div style={styles.divider}></div>
                  {plannings.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun planning disponible</p>
                  ) : (
                    plannings.map((p, i) => (
                      <div key={p.id || i} style={{
                        backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px', padding: '20px', marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>{p.name}</div>
                            {p.description && <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0' }}>{p.description}</p>}
                            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                              {p.start_time} - {p.end_time}
                            </div>
                            {p.working_days && p.working_days.length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {p.working_days.map((day, j) => (
                                  <span key={j} style={{
                                    fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
                                    backgroundColor: 'rgba(6,182,212,0.1)', color: '#06b6d4'
                                  }}>{day}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => {
                            setEditPlanning(p);
                            setEditName(p.name || '');
                            setEditDesc(p.description || '');
                            setEditStart(p.start_time || '08:00');
                            setEditEnd(p.end_time || '17:00');
                            setEditDays(p.working_days || []);
                          }} style={{ padding: '8px 14px', backgroundColor: 'rgba(6,182,212,0.1)', border: 'none', borderRadius: '8px', color: '#06b6d4', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
                            ✏️ Modifier
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {editPlanning && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1000, backdropFilter: 'blur(4px)'
                }} onClick={() => setEditPlanning(null)}>
                  <div style={{
                    backgroundColor: '#020817', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw'
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>Modifier le Planning</h3>
                      <button onClick={() => setEditPlanning(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Nom</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Description</label>
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px', boxSizing: 'border-box', minHeight: '60px', resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Heure début</label>
                          <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Heure fin</label>
                          <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#030712', color: 'white', fontSize: '13px', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Jours travaillés</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].map((day) => (
                            <label key={day} style={{
                              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                              backgroundColor: editDays.includes(day) ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                              color: editDays.includes(day) ? '#06b6d4' : '#94a3b8',
                              border: editDays.includes(day) ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.06)'
                            }}
                              onClick={() => setEditDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}>
                              {day}
                            </label>
                          ))}
                        </div>
                      </div>
                      <button onClick={async () => {
                        if (!editName.trim()) { showToast('Le nom est requis', 'error'); return; }
                        setSavingPlanning(true);
                        try {
                          const { error } = await supabase.from('plannings').update({
                            name: editName.trim(),
                            description: editDesc.trim(),
                            start_time: editStart,
                            end_time: editEnd,
                            working_days: editDays
                          }).eq('id', editPlanning.id);
                          if (error) throw error;
                          showToast('Planning modifié avec succès');
                          setEditPlanning(null);
                          const { data } = await supabase.from('plannings').select('*').limit(10);
                          if (data) setPlannings(data);
                        } catch (err) {
                          showToast('Erreur: ' + err.message, 'error');
                        } finally {
                          setSavingPlanning(false);
                        }
                      }} style={{
                        padding: '12px', backgroundColor: savingPlanning ? '#394e6a' : '#06b6d4',
                        border: 'none', borderRadius: '8px', color: savingPlanning ? '#94a3b8' : 'black',
                        fontWeight: 'bold', cursor: savingPlanning ? 'default' : 'pointer', fontSize: '14px', marginTop: '4px'
                      }} disabled={savingPlanning}>
                        {savingPlanning ? 'Enregistrement...' : '💾 Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Mes Équipes */}
              {activeTab === 'mes-equipes' && !selectedTeam && (
                <div>
                  <div style={styles.pageTitle}>Mes Équipes</div>
                  <div style={styles.divider}></div>

                  <div style={styles.statsRow}>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid var(--primary)' }}>
                      <div style={styles.statNumber}>{teams.length}</div>
                      <div style={styles.statLabel}>Équipes</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
                      <div style={{ ...styles.statNumber, color: '#22c55e' }}>{employees.length}</div>
                      <div style={styles.statLabel}>Collaborateurs</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #06b6d4' }}>
                      <div style={{ ...styles.statNumber, color: '#06b6d4' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return l && l.status === 'present'; }).length}</div>
                      <div style={styles.statLabel}>Présents</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return l && l.status === 'late'; }).length}</div>
                      <div style={styles.statLabel}>Retards</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
                      <div style={{ ...styles.statNumber, color: '#ef4444' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return !l || (l.status !== 'present' && l.status !== 'late'); }).length}</div>
                      <div style={styles.statLabel}>Absents</div>
                    </div>
                  </div>

                  {/* Équipes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '20px' }}>
                    {teams.map(team => (
                      <div key={team.id} style={styles.teamCard} onClick={() => setSelectedTeam(team)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '28px' }}>👥</span>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#f1f5f9' }}>{team.name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{team.description || 'Aucune description'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{team.member_count || 0} membre{(team.member_count || 0) !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Voir détails →</span>
                        </div>
                      </div>
                    ))}
                    {teams.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Aucune équipe sous votre responsabilité.
                      </div>
                    )}
                  </div>

                  {/* Collaborateurs */}
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Collaborateurs et Derniers Pointages</h3>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Collaborateur</th>
                          <th style={styles.th}>Rôle</th>
                          <th style={styles.th}>Dernier Pointage</th>
                          <th style={styles.th}>Statut</th>
                          <th style={styles.th}>Taux Présence</th>
                          <th style={styles.th}>Profil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map(emp => {
                          const last = attendanceLogs.filter(a => a.employee_id === emp.id)[0] || null;
                          const empLogs = attendanceLogs.filter(a => a.employee_id === emp.id);
                          const total = new Set(empLogs.map(a => a.date)).size;
                          const present = new Set(empLogs.filter(a => a.status === 'present').map(a => a.date)).size;
                          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                          return (
                            <tr key={emp.id} style={styles.tr}>
                              <td style={{ ...styles.td, fontWeight: '600' }}>{emp.prenom} {emp.nom}</td>
                              <td style={styles.td}><span style={styles.roleBadge}>{emp.role === 'Employee' ? 'Employé' : emp.role}</span></td>
                              <td style={styles.td}>{last ? `${last.date} ${last.time}` : '—'}</td>
                              <td style={styles.td}>
                                {last ? (
                                  <span style={{
                                    ...styles.badge,
                                    backgroundColor: last.status === 'present' ? 'rgba(16,185,129,0.15)' : last.status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: last.status === 'present' ? '#22c55e' : last.status === 'late' ? '#f59e0b' : '#ef4444'
                                  }}>{last.status === 'present' ? 'PRÉSENT' : last.status === 'late' ? 'RETARD' : 'ABSENT'}</span>
                                ) : <span style={{ color: '#64748b' }}>—</span>}
                              </td>
                              <td style={styles.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: `${rate}%`, backgroundColor: rate > 80 ? '#22c55e' : rate > 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{rate}%</span>
                                </div>
                              </td>
                              <td style={styles.td}>
                                <span style={styles.profileLink} onClick={() => navigate(`/employees/${emp.id}`)}>
                                  Voir →
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Team Detail */}
              {selectedTeam && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setSelectedTeam(null)}>←</span>
                    <div style={styles.pageTitle}>{selectedTeam.name}</div>
                  </div>
                  <div style={styles.divider}></div>

                  <div style={styles.statsRow}>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid var(--primary)' }}>
                      <div style={styles.statNumber}>{selectedTeam.member_count || 0}</div>
                      <div style={styles.statLabel}>Membres</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
                      <div style={{ ...styles.statNumber, color: '#22c55e' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return l && l.status === 'present'; }).length}</div>
                      <div style={styles.statLabel}>Présents</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return l && l.status === 'late'; }).length}</div>
                      <div style={styles.statLabel}>Retards</div>
                    </div>
                    <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
                      <div style={{ ...styles.statNumber, color: '#ef4444' }}>{employees.filter(e => { const l = attendanceLogs.find(a => a.employee_id === e.id); return !l || (l.status !== 'present' && l.status !== 'late'); }).length}</div>
                      <div style={styles.statLabel}>Absents</div>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Membres de l'Équipe</h3>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Collaborateur</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Poste</th>
                          <th style={styles.th}>Département</th>
                          <th style={styles.th}>Dernier Pointage</th>
                          <th style={styles.th}>Profil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map(emp => {
                          const last = attendanceLogs.filter(a => a.employee_id === emp.id)[0] || null;
                          return (
                            <tr key={emp.id} style={styles.tr}>
                              <td style={{ ...styles.td, fontWeight: '600' }}>{emp.prenom} {emp.nom}</td>
                              <td style={styles.td}>{emp.email}</td>
                              <td style={styles.td}>{emp.position || '—'}</td>
                              <td style={styles.td}>{emp.departments?.name || emp.department_id || '—'}</td>
                              <td style={styles.td}>{last ? `${last.date} ${last.time}` : '—'}</td>
                              <td style={styles.td}>
                                <span style={styles.profileLink} onClick={() => navigate(`/employees/${emp.id}`)}>
                                  Voir le profil →
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Mes Collaborateurs */}
              {activeTab === 'mes-collaborateurs' && (
                <div>
                  <div style={styles.pageTitle}>Mes Collaborateurs</div>
                  <div style={styles.divider}></div>

                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayStatusMap = {};
                    allAttendance.forEach(a => {
                      if (a.date === todayStr && a.status) {
                        todayStatusMap[a.employee_id] = a.status;
                      }
                    });
                    const total = allEmployees.length;
                    const presents = allEmployees.filter(e => todayStatusMap[e.id] === 'present').length;
                    const lates = allEmployees.filter(e => todayStatusMap[e.id] === 'late').length;
                    const absents = allEmployees.filter(e => !todayStatusMap[e.id] || todayStatusMap[e.id] === 'absent').length;

                    return (
                      <>
                        <div style={styles.statsRow}>
                          <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
                            <div style={{ ...styles.statNumber, color: '#22c55e' }}>{total}</div>
                            <div style={styles.statLabel}>Total Collaborateurs</div>
                          </div>
                          <div style={{ ...styles.statCard, borderLeft: '4px solid #06b6d4' }}>
                            <div style={{ ...styles.statNumber, color: '#06b6d4' }}>{presents}</div>
                            <div style={styles.statLabel}>Présents</div>
                          </div>
                          <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{lates}</div>
                            <div style={styles.statLabel}>Retards</div>
                          </div>
                          <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
                            <div style={{ ...styles.statNumber, color: '#ef4444' }}>{absents}</div>
                            <div style={styles.statLabel}>Absents</div>
                          </div>
                        </div>

                        <div style={styles.card}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Collaborateur</th>
                                <th style={styles.th}>Rôle</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Téléphone</th>
                                <th style={styles.th}>Statut</th>
                                <th style={styles.th}>Profil</th>
                              </tr>
                            </thead>
                            <tbody>
                              {total === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun collaborateur trouvé</td></tr>
                              ) : (
                                allEmployees.map((emp, i) => {
                                  const empStatus = todayStatusMap[emp.id] || '';
                                  const isPresent = empStatus === 'present';
                                  const isLate = empStatus === 'late';
                                  const isAbsent = !empStatus || empStatus === 'absent';
                                  return (
                                    <tr key={emp.id || i}>
                                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                                      <td style={styles.td}>
                                        <span style={{
                                          ...styles.badge,
                                          backgroundColor: emp.role === 'Manager' ? 'rgba(245,158,11,0.12)' : emp.role === 'CompanyAdmin' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)',
                                          color: emp.role === 'Manager' ? '#f59e0b' : emp.role === 'CompanyAdmin' ? '#06b6d4' : '#94a3b8'
                                        }}>{({ CompanyAdmin: 'Administrateur', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[emp.role] || emp.role || 'Employé'}</span>
                                      </td>
                                      <td style={styles.td}>{emp.email || '-'}</td>
                                      <td style={styles.td}>{emp.phone || '-'}</td>
                                      <td style={styles.td}>
                                        <span style={{
                                          ...styles.badge,
                                          backgroundColor: isPresent ? 'rgba(16,185,129,0.15)' : isLate ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                          color: isPresent ? '#22c55e' : isLate ? '#f59e0b' : '#ef4444'
                                        }}>
                                          {isPresent ? 'PRÉSENT' : isLate ? 'RETARD' : 'ABSENT'}
                                        </span>
                                      </td>
                                      <td style={styles.td}>
                                        <span style={styles.profileLink} onClick={() => navigate(`/employees/${emp.id}`)}>
                                          Voir →
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Tab: Pointage */}
              {activeTab === 'pointage' && (
                <div>
                  <div style={styles.pageTitle}>Pointage</div>
                  <div style={styles.divider}></div>
                  <div style={styles.card}>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
                      Accédez au terminal de pointage intelligent pour enregistrer les présences par QR code ou reconnaissance faciale.
                    </p>
                    <button
                      onClick={() => navigate('/terminal-intelligent')}
                      style={{ padding: '14px 28px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                    >
                      ⚡ Ouvrir le Terminal de Pointage
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  main: { flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'rgba(37,99,235,0.15)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px' },
  loader: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '16px', fontWeight: '600' },
  toast: {
    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
    padding: '12px 24px', borderRadius: '10px', color: 'white',
    backgroundColor: '#065f46', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
    animation: 'slideInRight 0.3s ease both'
  },
  tabBar: { display: 'flex', gap: '4px', marginBottom: '30px', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' },
  tab: { padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s' },
  tabActive: { padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#fff', backgroundColor: 'var(--primary)', transition: 'all 0.2s' },
  pageTitle: { fontSize: '22px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', paddingLeft: '0', margin: 0 },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 30px 0' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' },
  statCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' },
  statNumber: { fontSize: '32px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' },
  statLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' },
  card: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '20px', overflow: 'hidden' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: '0 0 16px 0' },
  teamCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' },
  roleBadge: { padding: '3px 10px', fontSize: '11px', borderRadius: '8px', fontWeight: '700', backgroundColor: 'rgba(37,99,235,0.15)', color: '#06b6d4' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(15,23,42,0.3)' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'all 0.15s' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#cbd5e1' },
  badge: { padding: '2px 10px', fontSize: '10px', fontWeight: '700', borderRadius: '6px', letterSpacing: '0.3px' },
  profileLink: { color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' },
};
