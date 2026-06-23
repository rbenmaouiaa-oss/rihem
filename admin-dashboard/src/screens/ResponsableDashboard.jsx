import React, { useEffect, useState } from 'react';
import { supabase, supabaseUrl, supabaseKey } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function ResponsableDashboard() {
  const navigate = useNavigate();

  // ================= STATE VARIABLES =================
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('CompanyAdmin');
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time Database Collections
  const [employees, setEmployees] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [devices, setDevices] = useState([]);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [plannings, setPlannings] = useState([]);
  const [allTeamMembers, setAllTeamMembers] = useState([]);

  // Form states & UI toggles
  const [loading, setLoading] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0.48);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  // Create planning form state
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const [dayShifts, setDayShifts] = useState({
    Lundi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Mardi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Mercredi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Jeudi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Vendredi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Samedi: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' },
    Dimanche: { entree1: '08:00', sortie1: '12:00', entree2: '13:00', sortie2: '17:00' }
  });

  // Affectations form state
  const [affTeamName, setAffTeamName] = useState('');
  const [affManagerId, setAffManagerId] = useState('');
  const [affDescription, setAffDescription] = useState('');
  const [affSelectedEmployees, setAffSelectedEmployees] = useState([]);
  const [savingAff, setSavingAff] = useState(false);
  const [newManager, setNewManager] = useState({ nom: '', prenom: '', email: '', password: 'password123' });
  const [savingMgr, setSavingMgr] = useState(false);

  // New item inputs
  const [newEmp, setNewEmp] = useState({ nom: '', prenom: '', email: '', role: 'Employee', phone: '', department_id: '', branch_id: '', password: 'password123' });

  // Profile form states
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', phone: '', adresse: '', ville: '', code_postal: '',
    type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
    genre: '', etat_civil: '', autre_telephone: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [myAttendance, setMyAttendance] = useState([]);
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');

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

  // ================= AUTO-CLOSE ALERTS =================
  const triggerAlert = (type, message) => {
    setAlertBanner({ type, message });
    setTimeout(() => {
      setAlertBanner(null);
    }, 4500);
  };

  // ================= AUTH & INITIAL SEED SYNC =================
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const savedEmail = localStorage.getItem('email');
      console.log("checkSession: savedEmail =", savedEmail);
      if (savedEmail) {
        console.log("checkSession: querying users table for email:", savedEmail);
        const { data: dbUsers, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', savedEmail);

        if (dbError) {
          console.log("checkSession: Error querying user by email:", dbError.message);
        }

        if (dbUsers && dbUsers.length > 0) {
          const dbUser = dbUsers[0];
          console.log("checkSession: Found user:", dbUser.email, "role:", dbUser.role, "company:", dbUser.company_id);
          setCurrentUser(dbUser);
          setUserRole(dbUser.role);
          setCurrentCompanyId(dbUser.company_id);
          fetchCompanyCollections(dbUser.company_id, dbUser.role, dbUser.id);
          return;
        }
        console.log("checkSession: User not found by email, falling through...");
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log("checkSession: No auth session. Using mock admin profile.");
        const mockUser = {
          id: 'f1111111-cdee-4d97-b5ae-a3867e6f3a31',
          email: 'admin@saas.com',
          nom: 'Eddine',
          prenom: 'Ala',
          role: 'CompanyAdmin',
          company_id: 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f'
        };
        setCurrentUser(mockUser);
        setUserRole(mockUser.role);
        setCurrentCompanyId(mockUser.company_id);
        fetchCompanyCollections(mockUser.company_id, mockUser.role, mockUser.id);
        return;
      }

      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email);

      if (dbError || !dbUsers || dbUsers.length === 0) {
        const { data: companyRes } = await supabase.from('companies').select('*').limit(1);
        const targetCoId = companyRes?.[0]?.id || 'e8f9c122-38b4-4b53-8f67-85bdeee7a99f';
        
        const freshUser = {
          email: user.email,
          nom: 'Collaborateur',
          prenom: 'Nouveau',
          role: 'CompanyAdmin',
          company_id: targetCoId
        };
        
        const { data: insertedUser } = await supabase
          .from('users')
          .insert(freshUser)
          .select()
          .single();

        const activeUser = insertedUser || freshUser;
        setCurrentUser(activeUser);
        setUserRole(activeUser.role);
        setCurrentCompanyId(activeUser.company_id);
        fetchCompanyCollections(activeUser.company_id, activeUser.role, activeUser.id);
      } else {
        const foundUser = dbUsers[0];
        setCurrentUser(foundUser);
        setUserRole(foundUser.role);
        setCurrentCompanyId(foundUser.company_id);
        fetchCompanyCollections(foundUser.company_id, foundUser.role, foundUser.id);
      }
    } catch (err) {
      console.log("checkSession: Exception caught:", err);
    }
  }

  // Load profile form data when currentUser changes
  useEffect(() => {
    if (!currentUser?.email) return;
    setFormData({
      nom: currentUser.nom || '', prenom: currentUser.prenom || '', email: currentUser.email || '',
      phone: currentUser.phone || '', adresse: currentUser.adresse || '', ville: currentUser.ville || '',
      code_postal: currentUser.code_postal || '',
      type_contrat: '', numero_employe: '', date_naissance: '', date_recrutement: '',
      genre: '', etat_civil: '', autre_telephone: ''
    });
    (async () => {
      const { data: profileData } = await supabase
        .from('profil_employes')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();
      if (profileData) {
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
    })();
  }, [currentUser?.email]);

  // Load initial attendance data
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      const { data } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('date', { ascending: false });
      if (data) setMyAttendance(data);
    })();
  }, [currentUser?.id]);

  // ================= DATA FETCHER =================
  const fetchCompanyCollections = async (companyId, role, userId) => {
    setLoading(true);

    let depts = [];
    try {
      const { data, error } = await supabase.from('departments').select('*').eq('company_id', companyId);
      if (error) throw error;
      depts = data || [];
      setDepartments(depts);
    } catch (e) {
      console.log("Error loading departments:", e.message);
    }

    let brs = [];
    try {
      const { data, error } = await supabase.from('branches').select('*').eq('company_id', companyId);
      if (error) throw error;
      brs = data || [];
      setBranches(brs);
    } catch (e) {
      console.log("Error loading branches:", e.message);
    }

    let sfs = [];
    try {
      const { data, error } = await supabase.from('shifts').select('*').eq('company_id', companyId);
      if (error) throw error;
      sfs = data || [];
      setShifts(sfs);
    } catch (e) {
      console.log("Error loading shifts:", e.message);
    }

    let emps = [];
    try {
      let empQuery = supabase.from('users').select('*').eq('company_id', companyId);
      if (role === 'Manager') {
        empQuery = empQuery.eq('manager_id', userId);
      }
      const { data, error } = await empQuery;
      if (error) throw error;
      emps = data || [];
      console.log(`Loaded ${emps.length} employees for company ${companyId}`);
      
      const mappedEmps = emps.map(emp => ({
        ...emp,
        departments: depts.find(d => d.id === emp.department_id),
        branches: brs.find(b => b.id === emp.branch_id)
      }));
      setEmployees(mappedEmps);
    } catch (e) {
      console.log("Error loading employees:", e.message);
      triggerAlert('danger', `Erreur chargement employés: ${e.message}`);
    }

    let teamList = [];
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/teams?select=*`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      teamList = await res.json();
      if (!Array.isArray(teamList)) teamList = [];

      // Fetch team_members and compute counts
      let memberCounts = {};
      try {
        const tmRes = await fetch(`${supabaseUrl}/rest/v1/team_members?select=team_id,user_id`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const tmData = await tmRes.json();
        if (Array.isArray(tmData)) {
          setAllTeamMembers(tmData);
          tmData.forEach(tm => { memberCounts[tm.team_id] = (memberCounts[tm.team_id] || 0) + 1; });
        }
      } catch (e) {
        console.log("Error loading team_members:", e.message);
      }

      const teamListWithCounts = teamList.map(team => ({
        ...team,
        member_count: memberCounts[team.id] || 0
      }));
      setTeams(teamListWithCounts);
      console.log(`Loaded ${teamList.length} teams with member counts`);
    } catch (e) {
      console.log("Error loading teams:", e.message);
    }

    // Load plannings
    try {
      let planQuery = supabase.from('plannings').select('*');
      if (role === 'Manager') {
        planQuery = planQuery.eq('company_id', companyId);
      }
      const { data: planData, error: planErr } = await planQuery;
      if (planErr) throw planErr;
      setPlannings(planData || []);
      console.log(`Loaded ${(planData || []).length} plannings`);
    } catch (e) {
      console.log("Error loading plannings:", e.message);
    }

    let devs = [];
    try {
      const { data, error } = await supabase.from('devices').select('*').eq('company_id', companyId);
      if (error) throw error;
      devs = data || [];
      const mappedDevs = devs.map(dev => ({
        ...dev,
        branches: brs.find(b => b.id === dev.branch_id)
      }));
      setDevices(mappedDevs);
    } catch (e) {
      console.log("Error loading devices:", e.message);
    }

    try {
      const directSubIds = role === 'Manager' ? emps.map(e => e.id) : [];
      let countQuery = supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if (role === 'Manager') countQuery = countQuery.in('employee_id', directSubIds);
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      const totalRecords = count || 0;
      let allAtts = [];
      const pageSize = 1000;
      for (let offset = 0; offset < totalRecords; offset += pageSize) {
        let pageQuery = supabase.from('attendance_logs').select('*').eq('company_id', companyId);
        if (role === 'Manager') pageQuery = pageQuery.in('employee_id', directSubIds);
        const { data, error } = await pageQuery.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
        if (error) throw error;
        allAtts = allAtts.concat(data || []);
      }
      const empIds = new Set(emps.map(e => e.id));
      const mappedAtts = allAtts
        .filter(att => empIds.has(att.employee_id))
        .map(att => ({
          ...att,
          users: emps.find(e => e.id === att.employee_id),
          devices: devs.find(d => d.id === att.device_id)
        }));
      setPointages(mappedAtts);
    } catch (e) {
      console.log("Error loading attendance_logs:", e.message);
    }

    try {
      if (devs && devs.length > 0) {
        const devIds = devs.map(d => d.id);
        const { data, error } = await supabase.from('device_logs').select('*').in('device_id', devIds).order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        const dLogs = data || [];
        const mappedDLogs = dLogs.map(l => ({
          ...l,
          devices: devs.find(d => d.id === l.device_id)
        }));
        setDeviceLogs(mappedDLogs);
      }
    } catch (e) {
      console.log("Error loading device_logs:", e.message);
    }

    setLoading(false);
  };

  // ================= ACTION HANDLERS =================

  // 1. Add Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.nom || !newEmp.prenom || !newEmp.email) {
      triggerAlert('danger', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    try {
      setLoading(true);
      const freshEmp = {
        company_id: currentCompanyId,
        nom: newEmp.nom,
        prenom: newEmp.prenom,
        email: newEmp.email,
        phone: newEmp.phone,
        role: newEmp.role,
        password_hash: newEmp.password,
        department_id: newEmp.department_id || null,
        branch_id: newEmp.branch_id || null,
        manager_id: userRole === 'Manager' ? currentUser.id : null
      };

      const { data, error } = await supabase.from('users').insert(freshEmp).select();
      if (error) throw error;

      triggerAlert('success', `Employé ${newEmp.prenom} ${newEmp.nom} créé avec succès.`);
      setShowEmployeeModal(false);
      setNewEmp({ nom: '', prenom: '', email: '', role: 'Employee', phone: '', department_id: '', branch_id: '', password: 'password123' });
      fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
    } catch (err) {
      triggerAlert('danger', `Erreur de création: ${err.message}`);
      setLoading(false);
    }
  };

  // 2. Enroll Face
  const handleFaceEnrollment = async (empId) => {
    try {
      setLoading(true);
      const mockVector = Array.from({ length: 128 }, () => parseFloat((Math.random() * 0.4 - 0.2).toFixed(6)));
      
      const { error } = await supabase.from('face_profiles').upsert({
        user_id: empId,
        encoding_vector: mockVector,
        photo_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${empId}`
      }, { onConflict: 'user_id' });

      if (error) throw error;
      triggerAlert('success', 'Signature faciale IA 128-D générée avec succès.');
      fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
    } catch (err) {
      triggerAlert('danger', `Erreur encodage: ${err.message}`);
      setLoading(false);
    }
  };

  // ================= STYLED COMPONENT VARIABLES =================
  const eventInputStyle = {
    width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };
  const timeInputStyle = {
    width: '100%', padding: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', outline: 'none', textAlign: 'center', boxSizing: 'border-box'
  };

  // ================= RENDER METHOD =================
  return (
    <div className="app-container">
      
      {/* Top Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '14px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
          backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      {/* Sidebar Mobile Overlay Backdrop */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* 1. TOP PREMIUM NOTIFICATIONS BANNER */}
      {alertBanner && (
        <div style={{
          ...styles.banner,
          backgroundColor: alertBanner.type === 'success' ? '#065f46' : alertBanner.type === 'danger' ? '#991b1b' : '#92400e',
          borderLeft: `5px solid ${alertBanner.type === 'success' ? 'var(--accent-green)' : alertBanner.type === 'danger' ? 'var(--accent-red)' : 'var(--accent-amber)'}`
        }}>
          <span>{alertBanner.message}</span>
          <button style={styles.bannerClose} onClick={() => setAlertBanner(null)}>✕</button>
        </div>
      )}

      {/* 2. DYNAMIC PREMIUM SIDEBAR */}
      <aside className={`sidebar-responsive ${sidebarOpen ? 'open' : ''}`}>
        <div style={styles.logoSection}>
          <img src="/Logo.png" alt="Aca Robotics" style={{ height: '60px', width: 'auto', objectFit: 'contain', backgroundColor: '#112A6D', padding: '6px', borderRadius: '8px' }} />
          <span style={styles.roleBadge}>Responsable</span>
        </div>
        
        <nav style={styles.nav}>
          <div style={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            <span>📊</span> Mon Tableau de Bord
          </div>
          
          <div style={activeTab === 'mon-profil' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('mon-profil'); setSidebarOpen(false); }}>
            <span>👤</span> Mon Profil
          </div>

          <div style={activeTab === 'ma-fiche' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('ma-fiche'); setSidebarOpen(false); }}>
            <span>⏱️</span> Ma Fiche de Pointage
          </div>

          <div style={activeTab === 'employees' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('employees'); setSidebarOpen(false); }}>
            <span>👥</span> Les Employés
          </div>

          <div style={activeTab === 'equipes' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('equipes'); setSidebarOpen(false); }}>
            <span>⚙️</span> Les Équipes
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(6,182,212,0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '10px' }}>{teams.length}</span>
          </div>

          <div style={activeTab === 'plannings' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('plannings'); setSidebarOpen(false); }}>
            <span>📅</span> Les Plannings
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(6,182,212,0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '10px' }}>{plannings.length}</span>
          </div>

          <div style={activeTab === 'live' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('live'); setSidebarOpen(false); }}>
            <span>⚡</span> Pointage
          </div>

          <div style={activeTab === 'affectations' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('affectations'); setSidebarOpen(false); }}>
            <span>📋</span> Affectations
          </div>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.logout} onClick={() => navigate('/')}>
            <span>🚪</span> Déconnexion
          </div>
        </div>
      </aside>

      {/* 3. MAIN APP LAYOUT */}
      <main className="main-content">
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div />
          </div>
          <div style={styles.userProfile}>
            <div style={styles.avatarCircle}>
              {currentUser?.prenom?.[0] || 'A'}
            </div>
            <div>
              <div style={styles.profileName}>{currentUser?.prenom} {currentUser?.nom}</div>
              <div style={styles.profileEmail}>{currentUser?.email}</div>
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading && <div style={styles.loader}>Synchronisation Cloud en cours...</div>}

          {/* ================= TAB 1: DASHBOARD HOME ================= */}
          {activeTab === 'dashboard' && (
            <div style={styles.tabContentAnim}>
              {/* TOP HUD ROW */}
              <div className="hud-responsive-grid">
                <div style={styles.hudCard}>
                  <div style={styles.hudHeader}>
                    <span>Total Collaborateurs</span>
                    <span style={styles.hudIcon}>👥</span>
                  </div>
                  <h3>{employees.length}</h3>
                  <p>Inscrits dans la base</p>
                </div>
                
                <div style={{ ...styles.hudCard, borderLeft: '4px solid var(--accent-green)' }}>
                  <div style={styles.hudHeader}>
                    <span>Présent</span>
                    <span style={styles.hudIcon}>✅</span>
                  </div>
                  <h3 style={{ color: 'var(--accent-green)' }}>
                    {employees.filter(e => e.status === 'present').length}
                  </h3>
                  <p>Via statut</p>
                </div>

                <div style={{ ...styles.hudCard, borderLeft: '4px solid var(--accent-amber)' }}>
                  <div style={styles.hudHeader}>
                    <span>Retard</span>
                    <span style={styles.hudIcon}>⏰</span>
                  </div>
                  <h3 style={{ color: 'var(--accent-amber)' }}>
                    {employees.filter(e => e.status === 'late').length}
                  </h3>
                  <p>Via statut</p>
                </div>

                <div style={{ ...styles.hudCard, borderLeft: '4px solid #ef4444' }}>
                  <div style={styles.hudHeader}>
                    <span>Absent</span>
                    <span style={styles.hudIcon}>❌</span>
                  </div>
                  <h3 style={{ color: '#ef4444' }}>
                    {employees.filter(e => e.status === 'absent').length}
                  </h3>
                  <p>Non pointés</p>
                </div>
              </div>

              {/* GRAPHS AND RADIAL GAUGE ROWS */}
              <div className="split-responsive-flex">
                <div style={styles.splitCard}>
                  <h4>Taux de Présence & Badges</h4>
                  <div style={{ display: 'flex', gap: '30px', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                      <svg width="130" height="130" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent-cyan)" strokeWidth="10" 
                                strokeDasharray={2 * Math.PI * 50} 
                                strokeDashoffset={2 * Math.PI * 50 * (1 - (pointages.length > 0 ? 88 : 0) / 100)}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)" />
                      </svg>
                      <div style={styles.radialLabel}>
                        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{pointages.length > 0 ? '88%' : '0%'}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>ACTIFS</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <div style={styles.progressBarHeader}>
                          <span>Reconnaissance Faciale double scan</span>
                          <span>92%</span>
                        </div>
                        <div style={styles.progressBarTrack}><div style={{ ...styles.progressBarFill, width: '92%', backgroundColor: 'var(--accent-cyan)' }} /></div>
                      </div>
                      <div>
                        <div style={styles.progressBarHeader}>
                          <span>Vérification Cryptographique QR</span>
                          <span>100%</span>
                        </div>
                        <div style={styles.progressBarTrack}><div style={{ ...styles.progressBarFill, width: '100%', backgroundColor: 'var(--accent-green)' }} /></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.splitCard}>
                  <h4>Ecosystem Activité Terminal logs</h4>
                  <div style={styles.logsView}>
                    {deviceLogs.slice(0, 5).map((l, i) => (
                      <div key={i} style={styles.logRow}>
                        <span style={styles.logTime}>{new Date(l.created_at).toLocaleTimeString()}</span>
                        <span style={{
                          ...styles.logBadge,
                          color: l.log_type === 'scan_success' ? 'var(--accent-green)' : 'var(--accent-red)'
                        }}>{l.log_type.toUpperCase()}</span>
                        <p style={styles.logMsg}>{l.message}</p>
                      </div>
                    ))}
                    {deviceLogs.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Aucun log enregistré dans les terminaux cloud.</p>}
                  </div>
                </div>
              </div>

              {/* Mon Pointage Personnel */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: 0 }}>📋 Mon Pointage</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-green)' }}>
                        {new Set(pointages.filter(p => p.employee_id === currentUser?.id && p.status === 'present').map(p => p.date)).size}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Présents</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                        {pointages.filter(p => p.employee_id === currentUser?.id && p.status === 'late').length}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Retards</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#06b6d4' }}>
                        {pointages.filter(p => p.employee_id === currentUser?.id).length}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total</div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Horaire</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>QR</th>
                        <th style={styles.th}>Visage</th>
                        <th style={styles.th}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointages.filter(p => p.employee_id === currentUser?.id).slice(0, 10).map((p, i) => (
                        <tr key={p.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={styles.td}>{p.date}</td>
                          <td style={styles.td}>{p.time}</td>
                          <td style={styles.td}>{p.type === 'check_in' ? 'Entrée' : 'Sortie'}</td>
                          <td style={styles.td}><span style={{ color: p.qr_verified ? 'var(--accent-green)' : 'var(--accent-red)' }}>{p.qr_verified ? 'Valide' : 'Invalide'}</span></td>
                          <td style={styles.td}><span style={{ color: p.face_verified ? 'var(--accent-green)' : 'var(--accent-red)' }}>{p.face_verified ? 'Reconnu' : 'Échec'}</span></td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: p.status === 'present' ? 'rgba(16,185,129,0.15)' : p.status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                              color: p.status === 'present' ? 'var(--accent-green)' : p.status === 'late' ? 'var(--accent-amber)' : 'var(--accent-red)'
                            }}>{p.status === 'present' ? 'PRÉSENT' : p.status === 'late' ? 'RETARD' : 'ABSENT'}</span>
                          </td>
                        </tr>
                      ))}
                      {pointages.filter(p => p.employee_id === currentUser?.id).length === 0 && (
                        <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#64748b', padding: '30px' }}>Aucun pointage personnel</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: LIVE MONITOR ================= */}
          {activeTab === 'live' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>

                {/* Month Filter Band */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Tous', value: 'all' },
                    { label: 'Janvier', value: '01' },
                    { label: 'Février', value: '02' },
                    { label: 'Mars', value: '03' },
                    { label: 'Avril', value: '04' },
                    { label: 'Mai', value: '05' },
                    { label: 'Juin', value: '06' },
                    { label: 'Juillet', value: '07' },
                    { label: 'Août', value: '08' },
                    { label: 'Septembre', value: '09' },
                    { label: 'Octobre', value: '10' },
                    { label: 'Novembre', value: '11' },
                    { label: 'Décembre', value: '12' },
                  ].map(m => (
                    <div
                      key={m.value}
                      onClick={() => setSelectedMonth(m.value)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: selectedMonth === m.value ? '700' : '500',
                        cursor: 'pointer',
                        backgroundColor: selectedMonth === m.value ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: selectedMonth === m.value ? '#fff' : 'var(--text-secondary)',
                        border: selectedMonth === m.value ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>

                {(() => {
                  const pointagesFiltres = selectedMonth === 'all'
                    ? pointages
                    : pointages.filter(p => {
                        const parts = p.date ? p.date.split('-') : [];
                        return parts.length >= 2 && parts[1] === selectedMonth;
                      });

                  return (
                    <>
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: '#22c55e' }}>
                            {pointagesFiltres.filter(p => p.status === 'present').length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Présent</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                            {pointagesFiltres.filter(p => p.status === 'late').length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Retard</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                            {pointagesFiltres.filter(p => p.status === 'absent').length}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Absent</div>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Photo</th>
                              <th>Collaborateur</th>
                              <th>Type</th>
                              <th>QR Cryp.</th>
                              <th>Visage</th>
                              <th>Date/Heure</th>
                              <th>Appareil</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pointagesFiltres.map((p, index) => {
                        const emp = p.users || {};
                        const dev = p.devices || {};
                        const initials = `${emp.prenom?.[0] || '?'}${emp.nom?.[0] || '?'}`.toUpperCase();
                        return (
                          <tr key={p.id || index}>
                            <td>
                              <div style={styles.avatarInitials}>{initials}</div>
                            </td>
                            <td style={{ fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: p.type === 'check_in' ? 'var(--accent-cyan-glow)' : 'rgba(255,255,255,0.05)',
                                color: p.type === 'check_in' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                              }}>{p.type === 'check_in' ? 'ENTRÉE' : p.type === 'check_out' ? 'SORTIE' : p.type.replace('_', ' ').toUpperCase()}</span>
                            </td>
                            <td>
                              <span style={{ color: p.qr_verified ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {p.qr_verified ? '● Valide' : '○ Invalide'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: '600' }}>
                                {p.face_verified ? `✅ Correspond (${p.face_score?.toFixed(3) || '0.35'})` : '❌ Non reconnu'}
                              </span>
                            </td>
                            <td>
                              <div>{p.time}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.date}</div>
                            </td>
                            <td>{dev.name || 'Virtual Terminal'}</td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: p.status === 'present' ? 'rgba(16,185,129,0.15)' : p.status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: p.status === 'present' ? 'var(--accent-green)' : p.status === 'late' ? 'var(--accent-amber)' : 'var(--accent-red)'
                              }}>{p.status.toUpperCase()}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {pointagesFiltres.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            Aucun pointage pour cette période. Connectez le simulator pour injecter des scans.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================= TAB 3: EMPLOYEES DIRECTORY ================= */}
          {activeTab === 'employees' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.actionRow}>
                <h3>Annuaire du Personnel</h3>
                <button style={styles.buttonCyan} onClick={() => setShowEmployeeModal(true)}>+ Recruter Collaborateur</button>
              </div>

              {/* Modal add employee */}
              {showEmployeeModal && (
                <div style={styles.modalBackdrop}>
                  <div style={styles.modalCard}>
                    <h4>Ajouter un collaborateur</h4>
                    <form onSubmit={handleAddEmployee} style={styles.form}>
                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Prénom</label>
                          <input type="text" style={styles.input} value={newEmp.prenom} onChange={(e) => setNewEmp({ ...newEmp, prenom: e.target.value })} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Nom</label>
                          <input type="text" style={styles.input} value={newEmp.nom} onChange={(e) => setNewEmp({ ...newEmp, nom: e.target.value })} required />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Email</label>
                          <input type="email" style={styles.input} value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} required />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Téléphone</label>
                          <input type="text" style={styles.input} value={newEmp.phone} onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })} />
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Département</label>
                          <select style={styles.input} value={newEmp.department_id} onChange={(e) => setNewEmp({ ...newEmp, department_id: e.target.value })}>
                            <option value="">Sélectionner...</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Bureau / Branch</label>
                          <select style={styles.input} value={newEmp.branch_id} onChange={(e) => setNewEmp({ ...newEmp, branch_id: e.target.value })}>
                            <option value="">Sélectionner...</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={styles.formRow}>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Rôle de Sécurité</label>
                          <select style={styles.input} value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                            <option value="Employee">Employé</option>
                            <option value="Manager">Manager</option>
                            <option value="CompanyAdmin">Responsable</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.modalActions}>
                        <button type="button" style={styles.buttonCancel} onClick={() => setShowEmployeeModal(false)}>Fermer</button>
                        <button type="submit" style={styles.buttonCyan}>Confirmer</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div style={styles.card}>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Email / ID</th>
                        <th>Rôle</th>
                        <th>Département</th>
                        <th>Bureau</th>
                        <th>Vecteur Facial IA</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>👥</div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>Aucun collaborateur trouvé</div>
                            <div style={{ fontSize: '13px' }}>Les employés n'ont pas pu être chargés. Vérifiez la console navigateur (F12) pour les erreurs.</div>
                          </td>
                        </tr>
                      )}
                      {employees.map(e => {
                        const initials = `${e.prenom?.[0] || '?'}${e.nom?.[0] || '?'}`.toUpperCase();
                        return (
                          <tr key={e.id} style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }} onClick={() => navigate(`/employees/${e.id}`)}>
                            <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{e.prenom} {e.nom}</td>
                            <td>
                              <div>{e.email}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ID: {e.id}</div>
                            </td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: e.role === 'CompanyAdmin' ? 'rgba(6,182,212,0.12)' : e.role === 'Manager' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                                color: e.role === 'CompanyAdmin' ? 'var(--accent-cyan)' : e.role === 'Manager' ? 'var(--accent-amber)' : 'var(--text-secondary)'
                              }}>{({ CompanyAdmin: 'Responsable', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[e.role] || e.role}</span>
                            </td>
                            <td>{e.departments?.name || 'Non Assigné'}</td>
                            <td>{e.branches?.name || 'Non Assigné'}</td>
                            <td>
                              <button style={styles.actionBtnFace} onClick={() => handleFaceEnrollment(e.id)}>
                                🔑 Générer Profil Facial
                              </button>
                            </td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: e.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: e.status === 'active' ? 'var(--accent-green)' : 'var(--accent-red)'
                              }}>{e.status}</span>
                            </td>
                            <td>
                              <button style={styles.actionBtnFace} onClick={(ev) => { ev.stopPropagation(); navigate(`/employees/${e.id}`); }}>
                                📊 Voir Profil
                              </button>
                            </td>
                            <td>
                              <button style={styles.actionBtnTrash} onClick={async (ev) => {
                                ev.stopPropagation();
                                if (confirm('Archiver ce collaborateur ?')) {
                                  await supabase.from('users').update({ status: 'archived' }).eq('id', e.id);
                                  fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
                                }
                              }}>🗄️ Archiver</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: MON PROFIL ================= */}
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

          {/* ================= TAB: MA FICHE DE POINTAGE ================= */}
          {activeTab === 'ma-fiche' && (
            <div>
              <div style={styles.pageTitle}>Ma Fiche de Pointage</div>
              <div style={styles.divider}></div>

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
                  let q = supabase.from('attendance_logs').select('*').eq('employee_id', currentUser.id).order('date', { ascending: false });
                  if (filterDateDebut) q = q.gte('date', filterDateDebut);
                  if (filterDateFin) q = q.lte('date', filterDateFin);
                  const { data } = await q;
                  if (data) setMyAttendance(data);
                }}
                  style={{ padding: '10px 20px', backgroundColor: '#06b6d4', border: 'none', borderRadius: '8px', color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  🔍 Chercher
                </button>
              </div>

              <div style={styles.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Entrée 1</th>
                      <th style={styles.th}>Sortie 1</th>
                      <th style={styles.th}>Entrée 2</th>
                      <th style={styles.th}>Sortie 2</th>
                      <th style={styles.th}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAttendance.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun pointage trouvé</td></tr>
                    ) : (
                      myAttendance.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={styles.td}>{p.date}</td>
                          <td style={styles.td}>{p.entree1 || p.time || '-'}</td>
                          <td style={styles.td}>{p.sortie1 || '-'}</td>
                          <td style={styles.td}>{p.entree2 || '-'}</td>
                          <td style={styles.td}>{p.sortie2 || '-'}</td>
                          <td style={styles.td}>
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB: LES ÉQUIPES ================= */}
          {activeTab === 'equipes' && (
            <div>
              <div style={styles.pageTitle}>Les Équipes</div>
              <div style={styles.divider}></div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  {selectedTeam ? (
                    <span onClick={() => { setSelectedTeam(null); setTeamMembers([]); }} style={{ cursor: 'pointer', color: '#06b6d4' }}>← Retour</span>
                  ) : `Liste des Équipes (${teams.length})`}
                </h3>
                {!selectedTeam ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nom</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Membres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucune équipe trouvée</td></tr>
                      ) : (
                        teams.map((team, i) => (
                          <tr key={team.id || i} style={{ cursor: 'pointer' }} onClick={async () => {
                            setSelectedTeam(team);
                            setLoadingTeamMembers(true);
                            try {
                              const tmRes = await fetch(`${supabaseUrl}/rest/v1/team_members?select=user_id&team_id=eq.${team.id}`, {
                                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
                              });
                              const tmData = await tmRes.json();
                              if (Array.isArray(tmData) && tmData.length > 0) {
                                const userIds = tmData.map(tm => tm.user_id);
                                const uRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id,email,prenom,nom,role,status&id=in.(${userIds.join(',')})`, {
                                  headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
                                });
                                const uData = await uRes.json();
                                setTeamMembers(Array.isArray(uData) ? uData : []);
                              } else {
                                setTeamMembers([]);
                              }
                            } catch (e) {
                              console.log('Error loading team members:', e);
                              setTeamMembers([]);
                            }
                            setLoadingTeamMembers(false);
                          }}>
                            <td style={{ ...styles.td, color: '#06b6d4', fontWeight: '600' }}>{team.name}</td>
                            <td style={styles.td}>{team.description || '-'}</td>
                            <td style={styles.td}>{team.member_count || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', color: '#e2e8f0' }}>{selectedTeam.name}</h4>
                    {loadingTeamMembers ? (
                      <p style={{ color: '#64748b' }}>Chargement...</p>
                    ) : teamMembers.length === 0 ? (
                      <p style={{ color: '#64748b' }}>Aucun membre dans cette équipe</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Nom</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Rôle</th>
                            <th style={styles.th}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((m, i) => (
                            <tr key={m.id || i}>
                              <td style={styles.td}>{m.prenom} {m.nom}</td>
                              <td style={styles.td}>{m.email}</td>
                              <td style={styles.td}>{({ CompanyAdmin: 'Responsable', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[m.role] || m.role || 'Employé'}</td>
                              <td style={styles.td}>
                                <span style={{
                                  fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px',
                                  backgroundColor: m.status === 'present' ? 'rgba(16,185,129,0.15)' : m.status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: m.status === 'present' ? '#22c55e' : m.status === 'late' ? '#f59e0b' : '#ef4444'
                                }}>
                                  {m.status === 'present' ? 'PRÉSENT' : m.status === 'late' ? 'RETARD' : 'ABSENT'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'plannings' && (
            <div>
              <div style={styles.pageTitle}>Les Plannings</div>
              <div style={styles.divider}></div>

              {/* Create new planning form */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Créer un nouveau planning</h3>

                {/* Titre + Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Titre de planning</label>
                  <input
                    type="text" placeholder="Ex: Horaire Standard"
                    value={planName} onChange={e => setPlanName(e.target.value)}
                    style={eventInputStyle}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea
                    placeholder="Ex: Planning de travail standard"
                    value={planDescription} onChange={e => setPlanDescription(e.target.value)}
                    style={{ ...eventInputStyle, minHeight: '60px', resize: 'vertical' }}
                  />
                </div>

                {/* Partie 1 / Partie 2 labels */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <div></div>
                  <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#06b6d4' }}>Partie 1</div>
                  <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#f59e0b' }}>Partie 2</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                  <div></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Entrée 1</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Sortie 1</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Entrée 2</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Sortie 2</span>
                  </div>
                </div>

                {/* Days */}
                {weekDays.map(day => (
                  <div key={day} style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '8px', alignItems: 'center',
                    padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>{day}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <input type="time" value={dayShifts[day].entree1} onChange={e => setDayShifts({ ...dayShifts, [day]: { ...dayShifts[day], entree1: e.target.value } })} style={timeInputStyle} />
                      <input type="time" value={dayShifts[day].sortie1} onChange={e => setDayShifts({ ...dayShifts, [day]: { ...dayShifts[day], sortie1: e.target.value } })} style={timeInputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <input type="time" value={dayShifts[day].entree2} onChange={e => setDayShifts({ ...dayShifts, [day]: { ...dayShifts[day], entree2: e.target.value } })} style={timeInputStyle} />
                      <input type="time" value={dayShifts[day].sortie2} onChange={e => setDayShifts({ ...dayShifts, [day]: { ...dayShifts[day], sortie2: e.target.value } })} style={timeInputStyle} />
                    </div>
                  </div>
                ))}

                {/* Save button */}
                <button
                  onClick={async () => {
                    if (!planName.trim()) { alert('Veuillez entrer un titre de planning'); return; }
                    setLoading(true);
                    try {
                      const workingDays = weekDays.filter(d => dayShifts[d].entree1 && dayShifts[d].sortie1);
                      const minStart = workingDays.reduce((min, d) => dayShifts[d].entree1 < min ? dayShifts[d].entree1 : min, '99:99');
                      const maxEnd = workingDays.reduce((max, d) => dayShifts[d].sortie2 > max ? dayShifts[d].sortie2 : max, '00:00');
                      const { data, error } = await supabase.from('plannings').insert({
                        name: planName.trim(),
                        description: planDescription.trim(),
                        start_time: minStart,
                        end_time: maxEnd,
                        working_days: workingDays
                      }).select();
                      if (error) throw error;
                      setPlanName(''); setPlanDescription('');
                      setPlannings(prev => [...prev, data[0]]);
                      alert('Planning créé avec succès !');
                    } catch (e) {
                      console.log('Error creating planning:', e.message);
                      alert('Erreur lors de la création du planning');
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                  style={{
                    marginTop: '20px', padding: '12px 32px', backgroundColor: '#06b6d4', color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Création en cours...' : 'Créer le planning'}
                </button>
              </div>

              {/* Existing plannings list */}
              <div style={{ ...styles.card, marginTop: '24px' }}>
                <h3 style={styles.cardTitle}>Plannings existants ({plannings.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nom</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Horaire</th>
                      <th style={styles.th}>Jours Travaillés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannings.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucun planning trouvé</td></tr>
                    ) : (
                      plannings.map((p, i) => (
                        <tr key={p.id || i}>
                          <td style={{ ...styles.td, color: '#06b6d4', fontWeight: '600' }}>{p.name}</td>
                          <td style={styles.td}>{p.description || '-'}</td>
                          <td style={styles.td}>{p.start_time?.slice(0,5) || 'N/A'} - {p.end_time?.slice(0,5) || 'N/A'}</td>
                          <td style={styles.td}>{Array.isArray(p.working_days) ? p.working_days.join(', ') : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'affectations' && (
            <div>
              <div style={styles.pageTitle}>Affectations</div>
              <div style={styles.divider}></div>

              {/* Ajouter un Manager */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Ajouter un Manager</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Nom</label>
                    <input type="text" placeholder="Nom" value={newManager.nom} onChange={e => setNewManager({ ...newManager, nom: e.target.value })} style={eventInputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Prénom</label>
                    <input type="text" placeholder="Prénom" value={newManager.prenom} onChange={e => setNewManager({ ...newManager, prenom: e.target.value })} style={eventInputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Email</label>
                    <input type="email" placeholder="manager@email.com" value={newManager.email} onChange={e => setNewManager({ ...newManager, email: e.target.value })} style={eventInputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Mot de passe</label>
                    <input type="text" placeholder="password123" value={newManager.password} onChange={e => setNewManager({ ...newManager, password: e.target.value })} style={eventInputStyle} />
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!newManager.nom.trim() || !newManager.prenom.trim() || !newManager.email.trim()) { alert('Veuillez remplir tous les champs obligatoires'); return; }
                    setSavingMgr(true);
                    try {
                      const mgrRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
                        method: 'POST',
                        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                        body: JSON.stringify({
                          nom: newManager.nom.trim(),
                          prenom: newManager.prenom.trim(),
                          email: newManager.email.trim(),
                          password_hash: newManager.password.trim(),
                          role: 'Manager',
                          company_id: currentCompanyId
                        })
                      });
                      if (!mgrRes.ok) { const err = await mgrRes.text(); throw new Error(err); }
                      setNewManager({ nom: '', prenom: '', email: '', password: 'password123' });
                      fetchCompanyCollections(currentCompanyId, userRole, currentUser?.id);
                      alert('Manager créé avec succès !');
                    } catch (e) {
                      console.log('Error creating manager:', e.message);
                      alert('Erreur lors de la création du manager');
                    }
                    setSavingMgr(false);
                  }}
                  disabled={savingMgr}
                  style={{
                    padding: '10px 32px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: savingMgr ? 'not-allowed' : 'pointer',
                    opacity: savingMgr ? 0.6 : 1
                  }}
                >
                  {savingMgr ? 'Création...' : 'Ajouter le Manager'}
                </button>
              </div>

              {/* Créer une nouvelle équipe */}
              <div style={{ ...styles.card, marginTop: '24px' }}>
                <h3 style={styles.cardTitle}>Créer une nouvelle équipe</h3>

                {/* Row: Nom de l'équipe + Manager de l'équipe */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Nom de l'équipe</label>
                    <input type="text" placeholder="Ex: Intelligence Artificielle" value={affTeamName} onChange={e => setAffTeamName(e.target.value)} style={eventInputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Manager de l'équipe</label>
                    <input type="text" list="managerList" placeholder="Tapez le nom du manager" value={affManagerId} onChange={e => setAffManagerId(e.target.value)} style={eventInputStyle} />
                    <datalist id="managerList">
                      {employees.filter(e => e.role === 'Manager').map(m => (
                        <option key={m.id} value={`${m.prenom} ${m.nom}`} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Description de l'équipe */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Description de l'équipe</label>
                  <textarea placeholder="Ex: Équipe dédiée à l'intelligence artificielle" value={affDescription} onChange={e => setAffDescription(e.target.value)} style={{ ...eventInputStyle, minHeight: '60px', resize: 'vertical' }} />
                </div>

                {/* Ajouter un employé */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Ajouter un employé</label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px' }}>
                    {employees.filter(e => e.role === 'Employee').map(emp => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', color: '#e2e8f0' }}>
                        <input
                          type="checkbox"
                          checked={affSelectedEmployees.includes(emp.id)}
                          onChange={() => {
                            setAffSelectedEmployees(prev =>
                              prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          style={{ accentColor: '#22c55e' }}
                        />
                        {emp.prenom} {emp.nom} ({emp.email})
                      </label>
                    ))}
                    {employees.filter(e => e.role === 'Employee').length === 0 && (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Aucun employé disponible</p>
                    )}
                  </div>
                </div>

                {/* Green Enregistrer button */}
                <button
                  onClick={async () => {
                    if (!affTeamName.trim()) { alert('Veuillez entrer un nom d\'équipe'); return; }
                    setSavingAff(true);
                    try {
                      const mgrFull = affManagerId.trim();
                      const foundMgr = mgrFull ? employees.find(e => e.role === 'Manager' && `${e.prenom} ${e.nom}`.toLowerCase() === mgrFull.toLowerCase()) : null;
                      const teamRes = await fetch(`${supabaseUrl}/rest/v1/teams`, {
                        method: 'POST',
                        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                        body: JSON.stringify({
                          name: affTeamName.trim(),
                          description: affDescription.trim(),
                          manager_id: foundMgr ? foundMgr.id : null
                        })
                      });
                      if (!teamRes.ok) throw new Error('Team insert failed: ' + (await teamRes.text()));
                      const newTeams = await teamRes.json();
                      if (!newTeams[0]?.id) throw new Error('No team returned');
                      if (affSelectedEmployees.length > 0) {
                        const members = affSelectedEmployees.map(user_id => ({ team_id: newTeams[0].id, user_id }));
                        const tmRes = await fetch(`${supabaseUrl}/rest/v1/team_members`, {
                          method: 'POST',
                          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                          body: JSON.stringify(members)
                        });
                        if (!tmRes.ok) throw new Error('Team members insert failed: ' + (await tmRes.text()));
                      }
                      setAffTeamName(''); setAffManagerId(''); setAffDescription(''); setAffSelectedEmployees([]);
                      fetchCompanyCollections(currentCompanyId, userRole, currentUser?.id);
                      alert('Équipe créée avec succès !');
                    } catch (e) {
                      console.log('Error creating team:', e.message);
                      alert('Erreur lors de la création de l\'équipe');
                    }
                    setSavingAff(false);
                  }}
                  disabled={savingAff}
                  style={{
                    padding: '12px 40px', backgroundColor: '#22c55e', color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: savingAff ? 'not-allowed' : 'pointer',
                    opacity: savingAff ? 0.6 : 1
                  }}
                >
                  {savingAff ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>

              {/* Existing teams table */}
              <div style={{ ...styles.card, marginTop: '24px' }}>
                <h3 style={styles.cardTitle}>Équipes existantes ({teams.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nom</th>
                      <th style={styles.th}>Manager</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Membres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Aucune équipe créée</td></tr>
                    ) : teams.map((team, i) => {
                      const mgr = employees.find(e => e.id === team.manager_id);
                      const cnt = allTeamMembers.filter(tm => tm.team_id === team.id).length;
                      return (
                        <tr key={team.id || i}>
                          <td style={{ ...styles.td, color: '#06b6d4', fontWeight: '600' }}>{team.name}</td>
                          <td style={styles.td}>{mgr ? `${mgr.prenom} ${mgr.nom}` : '-'}</td>
                          <td style={styles.td}>{team.description || '-'}</td>
                          <td style={styles.td}>{cnt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ================= STUNNING GLASSMORPHIC THEME STYLES =================
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#030712',
    color: '#f9fafb',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#112A6D',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    height: '100vh',
    zIndex: 10
  },
  logoSection: {
    padding: '10px 0 20px 0',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#f9fafb',
    margin: 0
  },
  roleBadge: {
    alignSelf: 'flex-start',
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    color: '#06b6d4',
    padding: '2px 8px',
    borderRadius: '12px',
    letterSpacing: '0.8px'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto'
  },
  divider: {
    padding: '15px 10px 5px 10px',
    fontSize: '9px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1.2px'
  },
  navItem: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  navItemActive: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '700',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderLeft: '4px solid #06b6d4',
    color: '#f9fafb',
    cursor: 'pointer',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  navItemSim: {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    cursor: 'pointer',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  navItemActiveSim: {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#f9fafb',
    cursor: 'pointer',
    borderRadius: '10px',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    border: '1px solid #06b6d4',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  navBadgeRed: {
    marginLeft: 'auto',
    backgroundColor: '#991b1b',
    color: '#fca5a5',
    fontSize: '10px',
    fontWeight: '800',
    padding: '1px 6px',
    borderRadius: '10px'
  },
  navBadgeAmber: {
    marginLeft: 'auto',
    backgroundColor: '#78350f',
    color: '#fde68a',
    fontSize: '10px',
    fontWeight: '800',
    padding: '1px 6px',
    borderRadius: '10px'
  },
  sidebarFooter: {
    paddingTop: '15px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  logout: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  header: {
    height: '75px',
    backgroundColor: 'rgba(3, 7, 18, 0.6)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    position: 'sticky',
    top: 0,
    zIndex: 5
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#f9fafb',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    color: '#06b6d4',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(6, 182, 212, 0.2)'
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#f9fafb'
  },
  profileEmail: {
    fontSize: '10px',
    color: '#64748b'
  },
  content: {
    padding: '40px',
    animation: 'fadeInUp 0.5s ease both'
  },
  loader: {
    padding: '10px 20px',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: '#06b6d4',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center'
  },
  banner: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    padding: '15px 25px',
    borderRadius: '10px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
    animation: 'slideInRight 0.3s ease both'
  },
  bannerClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  // HUD analytics Styles
  hudGrid: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px'
  },
  hudCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '20px 25px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  hudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  hudIcon: {
    fontSize: '18px'
  },
  dashboardSplit: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px'
  },
  splitCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '25px'
  },
  radialLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '130px',
    height: '130px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '6px',
    color: '#94a3b8'
  },
  progressBarTrack: {
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px'
  },
  logsView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '15px'
  },
  logRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '11px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '8px'
  },
  logTime: {
    color: '#64748b',
    fontWeight: '600'
  },
  logBadge: {
    fontWeight: 'bold',
    fontSize: '9px',
    padding: '2px 6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '4px'
  },
  logMsg: {
    margin: 0,
    color: '#94a3b8'
  },

  // Generic Card Styles
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
    overflowX: 'auto'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    margin: '0 0 10px 0'
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  avatarInitials: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '11px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  badge: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block'
  },

  // Form Fields
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  buttonCyan: {
    padding: '10px 20px',
    backgroundColor: '#06b6d4',
    border: 'none',
    borderRadius: '8px',
    color: 'black',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonCyanSmall: {
    padding: '6px 12px',
    backgroundColor: '#06b6d4',
    border: 'none',
    borderRadius: '6px',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '11px',
    cursor: 'pointer'
  },
  buttonCancel: {
    padding: '10px 20px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px'
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#030712',
    color: 'white',
    fontSize: '13px'
  },
  inputSmall: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#030712',
    color: 'white',
    fontSize: '12px'
  },

  // Modals
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  modalCard: {
    width: '550px',
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 45px rgba(0,0,0,0.5)'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },

  // Action Buttons
  actionBtnFace: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    color: '#06b6d4',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  actionBtnTrash: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  // ================= SIMULATOR LAYOUTS =================
  simulatorGrid: {
    display: 'flex',
    gap: '20px'
  },
  simCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  simHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '12px',
    fontWeight: '800',
    fontSize: '13px'
  },
  simScreenViewport: {
    height: '240px',
    backgroundColor: '#000000',
    borderRadius: '12px',
    border: '2px solid rgba(6, 182, 212, 0.3)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    marginTop: '20px'
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '2px',
    backgroundColor: '#06b6d4',
    boxShadow: '0 0 10px #06b6d4',
    animation: 'glowLineAnim 4s infinite linear'
  },
  cameraBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  scanLaser: {
    position: 'absolute',
    width: '100%',
    height: '4px',
    backgroundColor: '#ef4444',
    boxShadow: '0 0 8px #ef4444'
  },
  terminalStatusDisplay: {
    height: '60px',
    backgroundColor: '#0a0f1d',
    borderTop: '1px solid rgba(6,182,212,0.2)',
    padding: '10px 15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  terminalStatusText: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#06b6d4',
    fontFamily: 'monospace',
    letterSpacing: '1px'
  },
  hardwareIndicators: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)'
  },
  indicatorGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '11px',
    gap: '6px'
  },
  ledNode: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },
  buzzerNode: {
    fontSize: '16px'
  },
  toggleBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  faceToggle: {
    flex: 1,
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '2px solid rgba(255,255,255,0.04)',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  simulatorTerminalLogs: {
    height: '120px',
    backgroundColor: '#030712',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },

  tabContentAnim: {
    animation: 'fadeInUp 0.4s ease both'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'rgba(15,23,42,0.3)'
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#cbd5e1',
    borderBottom: '1px solid var(--border)'
  }
};
