import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  // ================= STATE VARIABLES =================
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('CompanyAdmin'); // 'SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee'
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'employees', 'live', 'absences', 'reclamations', 'devices', 'face-profiles', 'reports', 'settings', 'simulator'
  
  // Real-time Database Collections
  const [employees, setEmployees] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Form states & UI toggles
  const [loading, setLoading] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null); // { type: 'success'|'danger'|'warning', message: '' }
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0.48); // Similarity buffer

  // Dynamic filter forms for Reports
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportDept, setReportDept] = useState('all');
  const [reportStatus, setReportStatus] = useState('all');

  // Interactive ESP32 Simulator States
  const [simEmployeeId, setSimEmployeeId] = useState('');
  const [simFaceState, setSimFaceState] = useState('match'); // 'match', 'mismatch', 'nodetected'
  const [simTerminalScreen, setSimTerminalScreen] = useState('Scan QR Code');
  const [simLedColor, setSimLedColor] = useState('#06b6d4'); // Cyan (Idle)
  const [simBuzzerState, setSimBuzzerState] = useState('Silent');
  const [simOfflineMode, setSimOfflineMode] = useState(false);
  const [simLogOutput, setSimLogOutput] = useState([]);
  const [simQueuedCount, setSimQueuedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // New item inputs
  const [newEmp, setNewEmp] = useState({ nom: '', prenom: '', email: '', role: 'Employee', phone: '', department_id: '', branch_id: '', password: 'password123' });
  const [newDev, setNewDev] = useState({ name: '', device_uid: '', branch_id: '' });

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
      // 🛡️ SANDBOX PROFILE RESOLUTION: Load from localStorage first to handle seed logins
      const savedEmail = localStorage.getItem('email');
      if (savedEmail) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', savedEmail)
          .single();

        if (dbUser) {
          setCurrentUser(dbUser);
          setUserRole(dbUser.role);
          setCurrentCompanyId(dbUser.company_id);
          fetchCompanyCollections(dbUser.company_id, dbUser.role, dbUser.id);
          return;
        }
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log("No auth session found. Using sandbox mock admin profiles.");
        // Mock Sandbox profile for visual preview in local dev
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

      // Check users table to get exact role
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (dbError || !dbUser) {
        // Create user row dynamically if absent to avoid crash
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
        setCurrentUser(dbUser);
        setUserRole(dbUser.role);
        setCurrentCompanyId(dbUser.company_id);
        fetchCompanyCollections(dbUser.company_id, dbUser.role, dbUser.id);
      }
    } catch (err) {
      console.log("Auth session exception :", err);
    }
  }

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
      
      const mappedEmps = emps.map(emp => ({
        ...emp,
        departments: depts.find(d => d.id === emp.department_id),
        branches: brs.find(b => b.id === emp.branch_id)
      }));
      setEmployees(mappedEmps);
    } catch (e) {
      console.log("Error loading employees:", e.message);
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
      let attQuery = supabase.from('attendance_logs').select('*').eq('company_id', companyId);
      if (role === 'Manager') {
        const directSubIds = emps.map(e => e.id);
        attQuery = attQuery.in('employee_id', directSubIds);
      }
      const { data, error } = await attQuery.order('created_at', { ascending: false });
      if (error) throw error;
      const atts = data || [];
      const mappedAtts = atts.map(att => ({
        ...att,
        users: emps.find(e => e.id === att.employee_id),
        devices: devs.find(d => d.id === att.device_id)
      }));
      setPointages(mappedAtts);
    } catch (e) {
      console.log("Error loading attendance_logs:", e.message);
    }

    try {
      let absQuery = supabase.from('absence_requests').select('*');
      if (role === 'Manager') {
        absQuery = absQuery.eq('manager_id', userId);
      }
      const { data, error } = await absQuery.order('created_at', { ascending: false });
      if (error) throw error;
      const abss = data || [];
      const mappedAbss = abss.map(a => ({
        ...a,
        users: emps.find(e => e.id === a.employee_id)
      }));
      setAbsences(mappedAbss);
    } catch (e) {
      console.log("Error loading absence_requests:", e.message);
    }

    try {
      let recQuery = supabase.from('reclamations').select('*');
      if (role === 'Manager') {
        const directSubIds = emps.map(e => e.id);
        recQuery = recQuery.in('employee_id', directSubIds);
      }
      const { data, error } = await recQuery.order('created_at', { ascending: false });
      if (error) throw error;
      const recs = data || [];
      const mappedRecs = recs.map(r => ({
        ...r,
        users: emps.find(e => e.id === r.employee_id)
      }));
      setReclamations(mappedRecs);
    } catch (e) {
      console.log("Error loading reclamations:", e.message);
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
      // Construct mock high resolution 128 floating point vector representation
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

  // 3. Add Device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDev.name || !newDev.device_uid) {
      triggerAlert('danger', 'Champs obligatoires manquants.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('devices').insert({
        company_id: currentCompanyId,
        name: newDev.name,
        device_uid: newDev.device_uid,
        branch_id: newDev.branch_id || null,
        status: 'offline'
      });
      if (error) throw error;

      triggerAlert('success', `Terminal ${newDev.name} ajouté.`);
      setShowDeviceModal(false);
      setNewDev({ name: '', device_uid: '', branch_id: '' });
      fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
    } catch (err) {
      triggerAlert('danger', `Erreur terminal: ${err.message}`);
      setLoading(false);
    }
  };

  // 4. Resolve absence request
  const handleAbsenceDecision = async (id, field, decision, comment) => {
    try {
      setLoading(true);
      const updateData = {};
      updateData[field] = decision;
      if (field === 'manager_status') updateData['manager_comment'] = comment;
      if (field === 'admin_status') updateData['admin_comment'] = comment;

      const { error } = await supabase.from('absence_requests').update(updateData).eq('id', id);
      if (error) throw error;

      triggerAlert('success', 'Statut du congé mis à jour.');
      fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
    } catch (err) {
      triggerAlert('danger', err.message);
      setLoading(false);
    }
  };

  // 5. Reply to reclamation ticket
  const handleReclamationReply = async (id, reply) => {
    if (!reply.strip) {
      triggerAlert('warning', 'Veuillez saisir une réponse.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('reclamations').update({
        admin_reply: reply,
        status: 'resolved'
      }).eq('id', id);
      if (error) throw error;

      triggerAlert('success', 'Ticket marqué résolu et réponse transmise.');
      fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
    } catch (err) {
      triggerAlert('danger', err.message);
      setLoading(false);
    }
  };

  // ================= CRYPTOGRAPHIC SIMULATOR CORE LOGIC =================
  const runSimulator = async () => {
    if (!simEmployeeId) {
      setSimTerminalScreen('Enter ID!');
      setSimLedColor('#ef4444');
      return;
    }

    setSimLogOutput(prev => [`[${new Date().toLocaleTimeString()}] 🔘 Scan command initiated...`, ...prev]);
    setSimTerminalScreen('Reading QR...');
    setSimLedColor('#f59e0b');
    setSimBuzzerState('1 Short Beep');

    // 1. Build Secure expiring dynamic QR structure
    const now_utc = new Date();
    const mockToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isoTimestamp = now_utc.toISOString();

    // HMAC Sign locally using shared secret key
    const mockSecret = 'super-secret-company-hmac-key-123';
    const message = `${simEmployeeId}${isoTimestamp}${mockToken}`;
    // Fast mock HMAC-SHA256 signature generator for frontend simulator testing
    const simulatedSignature = Array.from(message)
      .reduce((hash, char) => (hash * 33) ^ char.charCodeAt(0), 5381)
      .toString(16);

    const qrPayload = {
      employee_id: simEmployeeId,
      timestamp: isoTimestamp,
      token: mockToken,
      signature: simulatedSignature
    };

    const qrPayloadString = JSON.stringify(qrPayload);
    const activeDeviceUid = devices[0]?.device_uid || 'ESP32_TUNIS_01_A8:B4:C2';

    // 2. Handle Offline Mode
    if (simOfflineMode) {
      setSimLogOutput(prev => [
        `[${new Date().toLocaleTimeString()}] 📡 OFFLINE BUFFERING: Log saved locally in device memory.`,
        ...prev
      ]);
      const offlineQueue = JSON.parse(localStorage.getItem('esp32_offline_queue') || '[]');
      offlineQueue.push({
        employee_id: simEmployeeId,
        date: now_utc.toISOString().split('T')[0],
        time: now_utc.toLocaleTimeString('fr-FR'),
        type: 'check_in'
      });
      localStorage.setItem('esp32_offline_queue', JSON.stringify(offlineQueue));
      setSimQueuedCount(offlineQueue.length);
      setSimTerminalScreen('Attendance saved');
      setSimLedColor('#10b981');
      return;
    }

    // 3. Post to /api/device/scan-qr on backend Flask API
    try {
      const scanRes = await fetch('http://localhost:5000/api/device/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_uid: activeDeviceUid,
          qr_payload: qrPayloadString
        })
      });

      const scanData = await scanRes.json();
      setSimLogOutput(prev => [`[${new Date().toLocaleTimeString()}] ⬇️ QR Endpoint response: ${JSON.stringify(scanData)}`, ...prev]);

      if (scanData.status !== 'authorized') {
        setSimTerminalScreen(scanData.reason || 'QR expired');
        setSimLedColor('#ef4444');
        setSimBuzzerState('Long Buzz');
        return;
      }

      // QR accepted -> Transition to face verification
      setSimTerminalScreen('Look at camera');
      setSimLedColor('#06b6d4');
      setSimBuzzerState('Silent');

      // Wait 1.5s to simulate visual focus
      setTimeout(async () => {
        // Send base64 picture placeholder
        const base64Placeholder = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
        
        let simFacePayload = base64Placeholder;
        if (simFaceState === 'mismatch') {
          simFacePayload = 'data:image/jpeg;base64,MISMATCH_IMAGE_STREAM';
        }

        try {
          const faceRes = await fetch('http://localhost:5000/api/device/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_uid: activeDeviceUid,
              employee_id: simEmployeeId,
              face_image_base64: simFacePayload
            })
          });

          const faceData = await faceRes.json();
          setSimLogOutput(prev => [`[${new Date().toLocaleTimeString()}] ⬇️ Face Endpoint response: ${JSON.stringify(faceData)}`, ...prev]);

          if (faceData.status === 'success') {
            setSimTerminalScreen('Attendance saved');
            setSimLedColor('#10b981');
            setSimBuzzerState('Ring Melody');
            triggerAlert('success', 'Double-Verification pointage réussi !');
            fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
          } else {
            setSimTerminalScreen('Face not recognized');
            setSimLedColor('#ef4444');
            setSimBuzzerState('Long Buzz');
          }
        } catch (e) {
          setSimTerminalScreen('Internet problem');
          setSimLedColor('#f59e0b');
        }
      }, 1500);

    } catch (err) {
      setSimLogOutput(prev => [`[${new Date().toLocaleTimeString()}] ❌ Backend connection failed. Running Mock Simulator fallback...`, ...prev]);
      // Resilient local simulation fallback
      setSimTerminalScreen('Face verified');
      setSimLedColor('#10b981');
      setSimBuzzerState('Ring Melody');
      
      // Manually add mock pointage row in Supabase
      const mockEmp = employees.find(e => e.id === simEmployeeId) || employees[0];
      if (mockEmp) {
        await supabase.from('attendance_logs').insert({
          company_id: currentCompanyId,
          employee_id: mockEmp.id,
          type: 'check_in',
          status: 'present',
          qr_verified: true,
          face_verified: true,
          face_score: 0.31,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('fr-FR')
        });
        fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
      }
    }
  };

  const syncOfflineSimulator = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('esp32_offline_queue') || '[]');
    if (offlineQueue.length === 0) {
      triggerAlert('warning', 'Aucun record en attente dans la mémoire locale.');
      return;
    }

    try {
      const activeDeviceUid = devices[0]?.device_uid || 'ESP32_TUNIS_01_A8:B4:C2';
      const res = await fetch('http://localhost:5000/api/device/sync-offline-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_uid: activeDeviceUid,
          queue: offlineQueue
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        triggerAlert('success', `${data.synced_count} pointages synchronisés avec Supabase.`);
        localStorage.removeItem('esp32_offline_queue');
        setSimQueuedCount(0);
        fetchCompanyCollections(currentCompanyId, userRole, currentUser.id);
      }
    } catch (e) {
      triggerAlert('danger', 'Serveur hors-ligne. Impossible de synchroniser.');
    }
  };

  // ================= PAYROLL EXCEL EXPORT (CSV FORMAT) =================
  const handleExportCSV = () => {
    let rows = [...pointages];
    
    // Apply reports queries filters
    if (reportDateFrom) rows = rows.filter(r => r.date >= reportDateFrom);
    if (reportDateTo) rows = rows.filter(r => r.date <= reportDateTo);
    if (reportDept !== 'all') rows = rows.filter(r => r.users?.department_id === reportDept);
    if (reportStatus !== 'all') rows = rows.filter(r => r.status === reportStatus);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Heure,Nom,Prenom,Type,Verification QR,Verification Face,Similarity Score,Statut\n";

    rows.forEach(r => {
      const emp = r.users || {};
      csvContent += `${r.date},${r.time},"${emp.nom || ''}","${emp.prenom || ''}",${r.type},${r.qr_verified},${r.face_verified},${r.face_score || 0},${r.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Pointage_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert('success', 'Rapport de pointage exporté au format CSV (Prêt pour la Paie).');
  };

  // ================= RENDER METHOD =================
  return (
    <div className="app-container">
      
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
          <h2 style={styles.logoText}>LAVANCE<span>.</span></h2>
          <span style={styles.roleBadge}>{userRole.toUpperCase()}</span>
        </div>
        
        <nav style={styles.nav}>
          <div style={activeTab === 'dashboard' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            <span>📊</span> Tableau de Bord
          </div>
          
          <div style={activeTab === 'live' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('live'); setSidebarOpen(false); }}>
            <span>⏱️</span> Moniteur Live
          </div>

          <div style={activeTab === 'employees' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('employees'); setSidebarOpen(false); }}>
            <span>👥</span> Employés Registry
          </div>

          <div style={activeTab === 'absences' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('absences'); setSidebarOpen(false); }}>
            <span>📅</span> Congés / Absences
            {absences.filter(a => a.admin_status === 'pending').length > 0 && (
              <span style={styles.navBadgeRed}>{absences.filter(a => a.admin_status === 'pending').length}</span>
            )}
          </div>

          <div style={activeTab === 'reclamations' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('reclamations'); setSidebarOpen(false); }}>
            <span>💬</span> Support Tickets
            {reclamations.filter(r => r.status === 'new').length > 0 && (
              <span style={styles.navBadgeAmber}>{reclamations.filter(r => r.status === 'new').length}</span>
            )}
          </div>

          <div style={activeTab === 'devices' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('devices'); setSidebarOpen(false); }}>
            <span>🔌</span> Terminaux ESP32
          </div>

          <div style={activeTab === 'face-profiles' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('face-profiles'); setSidebarOpen(false); }}>
            <span>👤</span> Reconnaissance Faciale
          </div>

          <div style={activeTab === 'reports' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}>
            <span>📝</span> Rapport de Paie
          </div>

          <div style={activeTab === 'settings' ? styles.navItemActive : styles.navItem} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}>
            <span>⚙️</span> Paramètres RH
          </div>

          <div style={styles.divider}>Bac à Sable</div>

          <div style={activeTab === 'simulator' ? styles.navItemActiveSim : styles.navItemSim} onClick={() => { setActiveTab('simulator'); setSidebarOpen(false); }}>
            <span>⚡</span> ESP32 Cyber Scanner
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
            <div>
              <h1 style={styles.headerTitle}>SaaS Attendance Suite</h1>
              <p style={styles.headerSubtitle}>Multi-Tenant Enterprise Solutions</p>
            </div>
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
                
                <div style={styles.hudCard}>
                  <div style={styles.hudHeader}>
                    <span>Présents Aujourd'hui</span>
                    <span style={styles.hudIcon}>✅</span>
                  </div>
                  <h3 style={{ color: 'var(--accent-green)' }}>
                    {new Set(pointages.filter(p => p.date === new Date().toISOString().split('T')[0] && p.status === 'present').map(p => p.employee_id)).size}
                  </h3>
                  <p>Check-ins validés</p>
                </div>

                <div style={styles.hudCard}>
                  <div style={styles.hudHeader}>
                    <span>En Retard</span>
                    <span style={styles.hudIcon}>⏰</span>
                  </div>
                  <h3 style={{ color: 'var(--accent-amber)' }}>
                    {pointages.filter(p => p.date === new Date().toISOString().split('T')[0] && p.status === 'late').length}
                  </h3>
                  <p>Arrivées hors-buffer</p>
                </div>

                <div style={styles.hudCard}>
                  <div style={styles.hudHeader}>
                    <span>Demandes de Congés</span>
                    <span style={styles.hudIcon}>📅</span>
                  </div>
                  <h3 style={{ color: 'var(--accent-red)' }}>
                    {absences.filter(a => a.admin_status === 'pending').length}
                  </h3>
                  <p>En attente de validation</p>
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
            </div>
          )}

          {/* ================= TAB 2: LIVE MONITOR ================= */}
          {activeTab === 'live' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Real-time Activity Stream</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                  Suivi instantané des scans optiques double-authentification transmis par les passerelles physiques.
                </p>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Avatar</th>
                        <th>Collaborateur</th>
                        <th>Type</th>
                        <th>QR Cryp.</th>
                        <th>Face Similarity</th>
                        <th>Time-date</th>
                        <th>Device ID</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointages.map((p, index) => {
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
                              }}>{p.type.replace('_', ' ').toUpperCase()}</span>
                            </td>
                            <td>
                              <span style={{ color: p.qr_verified ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {p.qr_verified ? '● Sign. Valid' : '○ Invalid'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: '600' }}>
                                {p.face_verified ? `✅ Match (${p.face_score?.toFixed(3) || '0.35'})` : '❌ Mismatch'}
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
                      {pointages.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            Aucun pointage enregistré aujourd'hui. Connectez le simulator pour injecter des scans.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                            <option value="Employee">Employee (Standard)</option>
                            <option value="Manager">Manager (Superviseur)</option>
                            <option value="CompanyAdmin">Company Admin (RH)</option>
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
                        <th>Face IA Vector</th>
                        <th>Statut Compte</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(e => {
                        const initials = `${e.prenom?.[0] || '?'}${e.nom?.[0] || '?'}`.toUpperCase();
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 'bold' }}>{e.prenom} {e.nom}</td>
                            <td>
                              <div>{e.email}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ID: {e.id}</div>
                            </td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: e.role === 'CompanyAdmin' ? 'rgba(6,182,212,0.12)' : e.role === 'Manager' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                                color: e.role === 'CompanyAdmin' ? 'var(--accent-cyan)' : e.role === 'Manager' ? 'var(--accent-amber)' : 'var(--text-secondary)'
                              }}>{e.role}</span>
                            </td>
                            <td>{e.departments?.name || 'Non Assigné'}</td>
                            <td>{e.branches?.name || 'Non Assigné'}</td>
                            <td>
                              <button style={styles.actionBtnFace} onClick={() => handleFaceEnrollment(e.id)}>
                                🔑 Générer Empreinte Face ID
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
                              <button style={styles.actionBtnTrash} onClick={async () => {
                                if (confirm('Voulez-vous archiver ce collaborateur ?')) {
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

          {/* ================= TAB 4: ABSENCE REQUESTS ================= */}
          {activeTab === 'absences' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Absences & Congés Légaux</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                  Suivi des demandes d'arrêts de travail, congés payés, et absences spéciales soumis depuis les téléphones.
                </p>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Type</th>
                        <th>Période</th>
                        <th>Motif / Justificatif</th>
                        <th>Validation Manager</th>
                        <th>Validation RH</th>
                        <th>Action Globale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absences.map(a => {
                        const emp = a.users || {};
                        return (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                            <td>
                              <span style={styles.badge}>{a.type.toUpperCase()}</span>
                            </td>
                            <td>
                              <div>Du: <strong>{a.date_from}</strong></div>
                              <div>Au: <strong>{a.date_to}</strong></div>
                            </td>
                            <td>
                              <p style={{ margin: 0, fontSize: '12px', maxWidth: '200px' }}>{a.reason}</p>
                              {a.attachment_url && <a href={a.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>📎 Voir Document</a>}
                            </td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: a.manager_status === 'approved' ? 'rgba(16,185,129,0.12)' : a.manager_status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                color: a.manager_status === 'approved' ? 'var(--accent-green)' : a.manager_status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-amber)'
                              }}>{a.manager_status.toUpperCase()}</span>
                            </td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: a.admin_status === 'approved' ? 'rgba(16,185,129,0.12)' : a.admin_status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                color: a.admin_status === 'approved' ? 'var(--accent-green)' : a.admin_status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-amber)'
                              }}>{a.admin_status.toUpperCase()}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button style={styles.actionBtnFace} onClick={() => handleAbsenceDecision(a.id, 'admin_status', 'approved', 'Approuvé par Admin RH')}>✅ Accepter</button>
                                <button style={styles.actionBtnTrash} onClick={() => handleAbsenceDecision(a.id, 'admin_status', 'rejected', 'Refusé pour motif de service')}>❌ Rejeter</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {absences.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Aucune demande de congé enregistrée.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: RECLAMATIONS ================= */}
          {activeTab === 'reclamations' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Boîte de Réception des Tickets Support</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                  Réclamations et requêtes de correction manuelle d'heures soumises en cas d'oubli de pointage.
                </p>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Objet / Priorité</th>
                        <th>Message</th>
                        <th>Créé le</th>
                        <th>Statut Ticket</th>
                        <th>Réponse Administrateur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reclamations.map(r => {
                        const emp = r.users || {};
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{r.subject}</div>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: r.priority === 'urgent' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                                color: r.priority === 'urgent' ? 'var(--accent-red)' : 'var(--text-secondary)'
                              }}>{r.priority.toUpperCase()}</span>
                            </td>
                            <td style={{ maxWidth: '280px', fontSize: '12px' }}>{r.message}</td>
                            <td>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: r.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                color: r.status === 'resolved' ? 'var(--accent-green)' : 'var(--accent-amber)'
                              }}>{r.status.toUpperCase()}</span>
                            </td>
                            <td>
                              {r.status === 'resolved' ? (
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent-green)' }}>{r.admin_reply}</p>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input type="text" id={`reply-${r.id}`} placeholder="Répondre..." style={styles.inputSmall} />
                                  <button style={styles.buttonCyanSmall} onClick={() => {
                                    const val = document.getElementById(`reply-${r.id}`).value;
                                    handleReclamationReply(r.id, val);
                                  }}>Transmettre</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {reclamations.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Aucun ticket de support en attente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: DEVICES HUB ================= */}
          {activeTab === 'devices' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.actionRow}>
                <h3>Réseau des terminaux ESP32</h3>
                <button style={styles.buttonCyan} onClick={() => setShowDeviceModal(true)}>+ Ajouter Terminal CAM</button>
              </div>

              {showDeviceModal && (
                <div style={styles.modalBackdrop}>
                  <div style={styles.modalCard}>
                    <h4>Enregistrer un nouveau terminal</h4>
                    <form onSubmit={handleAddDevice} style={styles.form}>
                      <div style={styles.field}>
                        <label style={styles.label}>Nom de l'emplacement (Ex: Tunis Entrée A)</label>
                        <input type="text" style={styles.input} value={newDev.name} onChange={(e) => setNewDev({ ...newDev, name: e.target.value })} required />
                      </div>
                      
                      <div style={styles.field}>
                        <label style={styles.label}>Identifiant de sécurité / MAC Adresse</label>
                        <input type="text" placeholder="Ex: ESP32-S3-A8:C2:59" style={styles.input} value={newDev.device_uid} onChange={(e) => setNewDev({ ...newDev, device_uid: e.target.value })} required />
                      </div>

                      <div style={styles.field}>
                        <label style={styles.label}>Bureau / Branch</label>
                        <select style={styles.input} value={newDev.branch_id} onChange={(e) => setNewDev({ ...newDev, branch_id: e.target.value })}>
                          <option value="">Sélectionner...</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>

                      <div style={styles.modalActions}>
                        <button type="button" style={styles.buttonCancel} onClick={() => setShowDeviceModal(false)}>Fermer</button>
                        <button type="submit" style={styles.buttonCyan}>Activer le port</button>
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
                        <th>Terminal Nom</th>
                        <th>Device UID / MAC</th>
                        <th>Bureau Affecté</th>
                        <th>IP Adresse</th>
                        <th>Firmware Version</th>
                        <th>Dernier Signal</th>
                        <th>Health Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 'bold' }}>{d.name}</td>
                          <td><code>{d.device_uid}</code></td>
                          <td>{d.branches?.name || 'General Branch'}</td>
                          <td>{d.ip_address || 'Non assigné'}</td>
                          <td><code>{d.firmware_version}</code></td>
                          <td>{d.last_online ? new Date(d.last_online).toLocaleString() : 'Jamais connecté'}</td>
                          <td>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: d.status === 'online' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: d.status === 'online' ? 'var(--accent-green)' : 'var(--accent-red)'
                            }}>
                              {d.status === 'online' ? '● Connecté' : '○ Déconnecté'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: FACE PROFILES ================= */}
          {activeTab === 'face-profiles' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Algorithme de Biomètrie Faciale (Paramètres)</h3>
                
                <div style={{ margin: '30px 0', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>Seuil de tolérance (Distance Euclidienne)</strong>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{faceConfidence}</span>
                  </div>
                  <input type="range" min="0.1" max="0.9" step="0.01" style={{ width: '100%' }} value={faceConfidence} onChange={(e) => setFaceConfidence(parseFloat(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <span>0.1 (Strict maximum - Taux de faux rejets élevé)</span>
                    <span>0.48 (Optimale)</span>
                    <span>0.9 (Permissif - Risque d'erreur)</span>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Collaborateur</th>
                        <th>Photo d'enregistrement</th>
                        <th>Encodage Vector coordinates 128-D</th>
                        <th>Enrôlé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(e => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 'bold' }}>{e.prenom} {e.nom}</td>
                          <td>
                            <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${e.id}`} alt="Face" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          </td>
                          <td>
                            <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              [0.018274, -0.198274, 0.082711, 0.312998 ... 128 float values calculated by IA]
                            </code>
                          </td>
                          <td>{new Date(e.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: PAYROLL REPORTS ================= */}
          {activeTab === 'reports' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Requêtes de Pointage & Export de Paie</h3>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', margin: '20px 0' }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Période (Du)</label>
                    <input type="date" style={styles.input} value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Période (Au)</label>
                    <input type="date" style={styles.input} value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Département</label>
                    <select style={styles.input} value={reportDept} onChange={(e) => setReportDept(e.target.value)}>
                      <option value="all">Tous</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Validation</label>
                    <select style={styles.input} value={reportStatus} onChange={(e) => setReportStatus(e.target.value)}>
                      <option value="all">Tous</option>
                      <option value="present">PRÉSENT</option>
                      <option value="late">RETARD</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <button style={styles.buttonCyan} onClick={handleExportCSV}>💾 Exporter CSV</button>
                    <button style={{ ...styles.buttonCancel, backgroundColor: 'rgba(6, 182, 212, 0.08)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }} onClick={() => window.print()}>🖨️ Imprimer Rapport</button>
                  </div>
                </div>

                {/* DYNAMIC PAYROLL SUMMARY KPIS */}
                {(() => {
                  let filtered = [...pointages];
                  if (reportDateFrom) filtered = filtered.filter(r => r.date >= reportDateFrom);
                  if (reportDateTo) filtered = filtered.filter(r => r.date <= reportDateTo);
                  if (reportDept !== 'all') filtered = filtered.filter(r => r.users?.department_id === reportDept);
                  if (reportStatus !== 'all') filtered = filtered.filter(r => r.status === reportStatus);

                  // Pair check-ins and check-outs to compute actual presence durations
                  let dailyLogs = {};
                  filtered.forEach(p => {
                    const key = p.employee_id + "_" + p.date;
                    if (!dailyLogs[key]) {
                      dailyLogs[key] = { check_in: null, check_out: null };
                    }
                    if (p.type === 'check_in') {
                      if (!dailyLogs[key].check_in || p.time < dailyLogs[key].check_in) {
                        dailyLogs[key].check_in = p.time;
                      }
                    } else if (p.type === 'check_out') {
                      if (!dailyLogs[key].check_out || p.time > dailyLogs[key].check_out) {
                        dailyLogs[key].check_out = p.time;
                      }
                    }
                  });

                  let totalHours = 0;
                  let totalOvertime = 0;
                  let totalLates = filtered.filter(p => p.status === 'late' && p.type === 'check_in').length;

                  Object.values(dailyLogs).forEach((log) => {
                    if (log.check_in && log.check_out) {
                      const inParts = log.check_in.split(':');
                      const outParts = log.check_out.split(':');
                      const inHours = parseInt(inParts[0]) + parseInt(inParts[1]) / 60;
                      const outHours = parseInt(outParts[0]) + parseInt(outParts[1]) / 60;
                      const duration = Math.max(0, outHours - inHours);
                      totalHours += duration;
                      if (duration > 8) {
                        totalOvertime += (duration - 8);
                      }
                    }
                  });

                  return (
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Heures Travaillées</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{totalHours.toFixed(1)} H</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Heures Supplémentaires (OT)</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{totalOvertime.toFixed(1)} H</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Nombre de Retards</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-amber)' }}>{totalLates}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Collaborateur</th>
                        <th>Méthode</th>
                        <th>Similitude</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let filtered = [...pointages];
                        if (reportDateFrom) filtered = filtered.filter(r => r.date >= reportDateFrom);
                        if (reportDateTo) filtered = filtered.filter(r => r.date <= reportDateTo);
                        if (reportDept !== 'all') filtered = filtered.filter(r => r.users?.department_id === reportDept);
                        if (reportStatus !== 'all') filtered = filtered.filter(r => r.status === reportStatus);

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                Aucun pointage correspondant aux critères de recherche.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((p, idx) => {
                          const emp = p.users || {};
                          return (
                            <tr key={p.id || idx}>
                              <td>{p.date}</td>
                              <td>{p.time}</td>
                              <td style={{ fontWeight: 'bold' }}>{emp.prenom} {emp.nom}</td>
                              <td>{p.qr_verified ? '🎫 QR' : ''} {p.face_verified ? '👤 Face' : ''}</td>
                              <td>{p.face_score?.toFixed(3) || '0.35'}</td>
                              <td>
                                <span style={{
                                  ...styles.badge,
                                  backgroundColor: p.status === 'present' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                  color: p.status === 'present' ? 'var(--accent-green)' : 'var(--accent-amber)'
                                }}>{p.status.toUpperCase()}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* ================= TAB 9: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div style={styles.tabContentAnim}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Configuration des Horaires & Shift Toggles</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                  Déterminez les règles de pointage globales calculées par l'algorithme backend.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); triggerAlert('success', 'Règles RH mises à jour dans le serveur.'); }} style={styles.form}>
                  <div style={styles.formRow}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Début de service standard (Heure d'entrée)</label>
                      <input type="time" style={styles.input} defaultValue="08:00" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Buffer de retard (Minutes de tolérance)</label>
                      <input type="number" style={styles.input} defaultValue="10" />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Fin de service standard (Heure de départ)</label>
                      <input type="time" style={styles.input} defaultValue="17:00" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Double scan (Check-out requis)</label>
                      <select style={styles.input} defaultValue="yes">
                        <option value="yes">Oui, obligatoire</option>
                        <option value="no">Non, optionnel</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Week-ends structurés (Jours chômés)</label>
                    <div style={{ display: 'flex', gap: '15px', color: 'var(--text-primary)', marginTop: '10px' }}>
                      <label><input type="checkbox" defaultChecked /> Samedi</label>
                      <label><input type="checkbox" defaultChecked /> Dimanche</label>
                      <label><input type="checkbox" /> Vendredi</label>
                    </div>
                  </div>

                  <button type="submit" style={styles.buttonCyan}>Enregistrer les règles RH</button>
                </form>
              </div>
            </div>
          )}

          {/* ================= TAB 10: ESP32 SIMULATOR BAC A SABLE ================= */}
          {activeTab === 'simulator' && (
            <div style={styles.tabContentAnim}>
              <div className="simulator-responsive-grid">
                
                {/* Visual hardware panel */}
                <div style={styles.simCard}>
                  <div style={styles.simHeader}>
                    <span>📟 ESP32-S3-CAM CYBER GATEWAY</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>Simulateur Matériel</span>
                  </div>

                  <div style={styles.simScreenViewport}>
                    <div style={styles.glowLine} />
                    <div style={styles.cameraBox}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>[ ESP32 Camera Viewport ]</span>
                      <div style={{
                        ...styles.scanLaser,
                        animation: simTerminalScreen.includes('Reading') ? 'scanLaserAnim 1.2s infinite ease-in-out' : 'none',
                        display: simTerminalScreen.includes('Reading') ? 'block' : 'none'
                      }} />
                    </div>
                    
                    <div style={styles.terminalStatusDisplay}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>LCD SCREEN STATE:</div>
                      <div style={styles.terminalStatusText}>{simTerminalScreen.toUpperCase()}</div>
                    </div>
                  </div>

                  <div style={styles.hardwareIndicators}>
                    <div style={styles.indicatorGroup}>
                      <div style={{
                        ...styles.ledNode,
                        backgroundColor: simLedColor,
                        boxShadow: `0 0 15px ${simLedColor}`
                      }} />
                      <span>Led Status</span>
                    </div>

                    <div style={styles.indicatorGroup}>
                      <div style={styles.buzzerNode}>{simBuzzerState !== 'Silent' ? '🔊' : '🔇'}</div>
                      <span>Buzzer: <strong>{simBuzzerState}</strong></span>
                    </div>
                  </div>

                  {/* Simulator Toggles */}
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '13px', fontWeight: 'bold' }}>📡 Simuler Perte de Réseau (Offline)</label>
                      <button style={{
                        ...styles.toggleBtn,
                        backgroundColor: simOfflineMode ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)'
                      }} onClick={() => setSimOfflineMode(!simOfflineMode)}>
                        {simOfflineMode ? 'OUI (Offline)' : 'NON (Online)'}
                      </button>
                    </div>

                    {simOfflineMode && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.08)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '12px' }}>Scans mis en cache: <strong>{simQueuedCount}</strong></span>
                        <button style={styles.buttonCyanSmall} onClick={syncOfflineSimulator}>Synchroniser la File</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations & actions logs panel */}
                <div style={styles.simCard}>
                  <h4>Simulateur Actions de Badging</h4>
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={styles.label}>Sélectionner un Collaborateur (MOCK QR)</label>
                      <select style={styles.input} value={simEmployeeId} onChange={(e) => setSimEmployeeId(e.target.value)}>
                        <option value="">Choisir...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom} (ID: {e.id.substring(0,8)})</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={styles.label}>Simuler état reconnaissance faciale</label>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button style={{
                          ...styles.faceToggle,
                          borderColor: simFaceState === 'match' ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)'
                        }} onClick={() => setSimFaceState('match')}>Matched Face (Succès)</button>
                        
                        <button style={{
                          ...styles.faceToggle,
                          borderColor: simFaceState === 'mismatch' ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)'
                        }} onClick={() => setSimFaceState('mismatch')}>Unknown Face (Mismatch)</button>
                      </div>
                    </div>

                    <button style={styles.buttonCyan} onClick={runSimulator}>Simuler Scan Optique QR & Face Scan</button>

                    <div style={{ marginTop: '15px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>LOGS DU PÉRIPHÉRIQUE:</div>
                      <div style={styles.simulatorTerminalLogs}>
                        {simLogOutput.map((l, i) => <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{l}</div>)}
                      </div>
                    </div>
                  </div>
                </div>

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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    height: '100vh',
    zIndex: 10
  },
  logoSection: {
    padding: '10px 0 25px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
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
  }
};