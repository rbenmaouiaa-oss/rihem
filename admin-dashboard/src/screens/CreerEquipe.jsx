import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function CreerEquipe() {
  const navigate = useNavigate();

  // Form states
  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("Rihem Ben Maouia");
  const [description, setDescription] = useState("");
  
  // Custom member states (to add to list before saving)
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("collaborateur");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberGender, setMemberGender] = useState("Homme");
  const [membersList, setMembersList] = useState([]);
  
  const [loading, setLoading] = useState(false);

  // Add a member locally to the list before committing to DB
  function handleAddMemberLocally() {
    if (!memberName.trim()) {
      alert("Veuillez saisir le nom du collaborateur !");
      return;
    }
    const newMember = {
      employee_name: memberName.trim(),
      employee_username: memberName.trim().toLowerCase().replace(/\s+/g, '.'),
      employee_role: memberRole,
      employee_gender: memberGender,
      employee_phone: memberPhone.trim() || "+216 -- --- ---",
      employee_status: "Présent"
    };
    setMembersList([...membersList, newMember]);
    setMemberName("");
    setMemberPhone("");
  }

  // Remove a member locally
  function handleRemoveLocalMember(index) {
    const updated = membersList.filter((_, idx) => idx !== index);
    setMembersList(updated);
  }

  // Save everything to Supabase
  async function handleSaveTeam() {
    if (!teamName.trim()) {
      alert("Veuillez saisir le nom de l'équipe !");
      return;
    }

    setLoading(true);
    try {
      // 1. Insert team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: teamName.trim(),
          manager: managerName,
          description: description.trim()
        }])
        .select();

      if (teamError) throw teamError;
      const createdTeam = teamData[0];

      // 2. Insert team members if any
      if (membersList.length > 0) {
        const membersToInsert = membersList.map(m => ({
          team_id: createdTeam.id,
          employee_name: m.employee_name,
          employee_username: m.employee_username,
          employee_role: m.employee_role,
          employee_gender: m.employee_gender,
          employee_phone: m.employee_phone,
          employee_status: m.employee_status
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(membersToInsert);

        if (membersError) throw membersError;
      }

      alert("L'équipe et ses membres ont été créés avec succès ! 🎉");
      setTeamName("");
      setDescription("");
      setMembersList([]);
      navigate('/equipes');

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'équipe ❌: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR GAUCHE FIXE */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="Aca ROBOTICS" style={styles.logoImage} onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={styles.logoTextFallback}>Aca ROBOTICS</h1>
        </div>
        <nav style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate('/home')}>📊 TABLEAU DE BORD</div>
          <div style={styles.navItem} onClick={() => navigate('/profil')}>👤 MON PROFIL</div>
          <div style={styles.navItem} onClick={() => navigate('/fiche-pointage')}>📅 FICHE DE POINTAGE</div>
          <div style={styles.navItem} onClick={() => navigate('/equipes')}>👥 MES ÉQUIPES</div>
          <div style={styles.navItemActive} onClick={() => navigate('/creer-equipe')}>👥 CRÉER ÉQUIPES</div>
          <div style={styles.navItem} onClick={() => navigate('/creer-planning')}>🗓️ MON PLANNING</div>
          
          <div style={styles.navDivider}>SIMULATEURS DE TERMINAL</div>
          <div style={styles.navItemSim} onClick={() => navigate('/scanner-facial')}>👤 Simuler Scan Facial</div>
          <div style={styles.navItemSim} onClick={() => navigate('/scanner-qr')}>🎫 Simuler Scan QR</div>
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.logout} onClick={() => navigate('/')}>🚪 DÉCONNEXION</div>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>ECOSYSTEM ADMIN</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur ▾</span>
          </div>
        </header>

        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Crée une nouvelle équipe</h2>
          <div style={styles.divider}></div>

          {/* SECTION FORMULAIRE */}
          <div style={styles.formGrid}>
            <div style={styles.formLeft}>
              <div style={styles.field}>
                <label style={styles.label}>Nom de l'équipe *</label>
                <input 
                  style={styles.input} 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  placeholder="ex: R&D Robotics"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Manager de l'équipe</label>
                <input 
                  style={styles.input} 
                  type="text" 
                  value={managerName} 
                  onChange={(e) => setManagerName(e.target.value)} 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description de l'équipe</label>
                <textarea 
                  style={styles.textarea} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectifs et tâches de l'équipe..."
                ></textarea>
              </div>
            </div>

            <div style={styles.formRight}>
              <h4 style={{ color: '#2196F3', margin: '0 0 15px 0', fontSize: '14px' }}>Ajouter un membre</h4>
              <div style={styles.field}>
                <label style={styles.label}>Nom & Prénom</label>
                <input 
                  style={styles.input} 
                  type="text" 
                  value={memberName} 
                  onChange={(e) => setMemberName(e.target.value)} 
                  placeholder="Nom de l'employé"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Rôle</label>
                <select 
                  style={styles.input} 
                  value={memberRole} 
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="administrateur">administrateur</option>
                  <option value="collaborateur">collaborateur</option>
                  <option value="manager">manager</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>Genre</label>
                  <select 
                    style={styles.input} 
                    value={memberGender} 
                    onChange={(e) => setMemberGender(e.target.value)}
                  >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div style={{ ...styles.field, flex: 2.2 }}>
                  <label style={styles.label}>Téléphone</label>
                  <input 
                    style={styles.input} 
                    type="text" 
                    value={memberPhone} 
                    onChange={(e) => setMemberPhone(e.target.value)} 
                    placeholder="+216 -- --- ---"
                  />
                </div>
              </div>
              <button style={{ ...styles.addBtn, marginTop: 15 }} onClick={handleAddMemberLocally}>
                AJOUTER LE MEMBRE À LA LISTE
              </button>
            </div>
          </div>

          {/* SECTION LISTE DES MEMBRES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Liste des membres à enregistrer ({membersList.length})</h3>
            <button 
              style={{ ...styles.addBtn, width: '200px', backgroundColor: '#4CAF50' }} 
              onClick={handleSaveTeam}
              disabled={loading}
            >
              {loading ? "Création..." : "💾 CRÉER L'ÉQUIPE"}
            </button>
          </div>
          
          <div style={styles.tableContainer}>
            {membersList.map((m, i) => (
              <div key={i} style={styles.tableRow}>
                <div style={styles.cellAvatar}><div style={styles.avatarIcon}>👤</div></div>
                <div style={styles.cellMain}>{m.employee_name}</div>
                <div style={styles.cell}>{m.employee_username}</div>
                <div style={styles.cell}>{m.employee_role}</div>
                <div style={styles.cell}>{m.employee_gender}</div>
                <div style={styles.cell}>{m.employee_phone}</div>
                <div style={styles.cellStatus}>
                   <span style={styles.statusDot}>●</span> {m.employee_status}
                </div>
                <div 
                  style={{ ...styles.cellAction, color: 'red', fontWeight: 'bold' }} 
                  onClick={() => handleRemoveLocalMember(i)}
                >
                  ✕
                </div>
              </div>
            ))}
            {membersList.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px', backgroundColor: 'white', borderRadius: 8 }}>
                Aucun collaborateur ajouté à cette équipe pour le moment.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  sidebar: { width: '280px', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10, padding: '15px' },
  logoSection: { padding: '20px', textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)' },
  logoImage: { width: '180px', maxHeight: '50px', objectFit: 'contain' },
  logoTextFallback: { fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' },
  navDivider: { padding: '15px 20px 5px 20px', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' },
  navItemSim: { padding: '10px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '10px', transition: 'var(--transition-smooth)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', marginLeft: '10px', marginRight: '10px', marginBottom: '5px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { padding: '14px 20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '10px', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '12px' },
  navItemActive: { padding: '14px 20px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--primary)', color: 'var(--text-white)', cursor: 'pointer', borderRadius: '10px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '12px' },
  sidebarFooter: { padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' },
  logout: { fontSize: '13px', fontWeight: '600', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' },
  backBtn: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 'bold', transition: 'var(--transition-smooth)' },
  main: { flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1.5px', margin: 0 },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  pageTitle: { fontSize: '22px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 40px 0' },
  formGrid: { display: 'flex', gap: '40px', marginBottom: '40px' },
  formLeft: { flex: 1.2, display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  formRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--bg-app)', outline: 'none', color: 'var(--text-main)', fontSize: '14px', transition: 'var(--transition-smooth)' },
  textarea: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', height: '120px', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', outline: 'none', resize: 'none', fontSize: '14px', transition: 'var(--transition-smooth)' },
  addBtn: { backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)' },
  sectionTitle: { fontSize: '18px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)' },
  tableContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' },
  tableRow: { backgroundColor: 'var(--bg-card)', padding: '16px 20px', display: 'flex', alignItems: 'center', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)' },
  cellAvatar: { width: '50px' },
  avatarIcon: { width: '35px', height: '35px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '16px' },
  cellMain: { flex: 1.5, fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' },
  cell: { flex: 1, fontSize: '14px', color: 'var(--text-muted)' },
  cellStatus: { flex: 0.8, color: 'var(--success)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' },
  statusDot: { marginRight: '8px', fontSize: '10px' },
  cellAction: { color: 'var(--danger)', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', width: '30px', textAlign: 'center' }
};