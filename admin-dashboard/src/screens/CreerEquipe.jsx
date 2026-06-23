import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function CreerEquipe() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [membersList, setMembersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const email = localStorage.getItem('email');
        if (!email) {
          navigate('/');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', email);

        if (!userData || userData.length === 0) {
          navigate('/');
          return;
        }

        const currentUserData = userData[0];

        setCurrentUser(currentUserData);

        const { data: employeesData } = await supabase
          .from('users')
          .select('*')
          .eq('company_id', currentUserData.company_id);

        setEmployees(employeesData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [navigate]);

  function handleAddMember() {
    if (!selectedUserId) {
      alert("Veuillez sélectionner un employé !");
      return;
    }
    if (membersList.some(m => m.user_id === selectedUserId)) {
      alert("Ce membre est déjà dans la liste !");
      return;
    }
    const emp = employees.find(e => e.id === selectedUserId);
    if (!emp) return;
    setMembersList([...membersList, { user_id: emp.id, name: `${emp.prenom} ${emp.nom}`, email: emp.email, role: emp.role }]);
    setSelectedUserId("");
  }

  function handleRemoveMember(index) {
    setMembersList(membersList.filter((_, i) => i !== index));
  }

  async function handleSaveTeam() {
    if (!teamName.trim()) {
      alert("Veuillez saisir le nom de l'équipe !");
      return;
    }

    setLoading(true);
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: teamName.trim(),
          description: description.trim(),
          manager_id: currentUser.id
        }])
        .select();

      if (teamError) throw teamError;
      const teamId = teamData[0].id;

      if (membersList.length > 0) {
        const membersToInsert = membersList.map(m => ({
          team_id: teamId,
          user_id: m.user_id
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(membersToInsert);

        if (membersError) throw membersError;
      }

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

  if (fetching) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2 style={styles.headerTitle}>L'AVANCE</h2>
              <span style={styles.badgeHeader}>ADMIN</span>
            </div>
            <div style={styles.userProfile}>
              <div style={styles.userAvatar}>A</div>
              <span>Administrateur ▾</span>
            </div>
          </header>
          <div style={{ ...styles.content, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <p>Chargement...</p>
          </div>
        </main>
      </div>
    );
  }

  const availableEmployees = employees.filter(e => !membersList.some(m => m.user_id === e.id));

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>ADMIN</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur ▾</span>
          </div>
        </header>

        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Crée une nouvelle équipe</h2>
          <div style={styles.divider}></div>

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
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectifs et tâches de l'équipe..."
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Manager</label>
                <input
                  style={styles.input}
                  type="text"
                  value={currentUser?.name || ''}
                  disabled
                />
              </div>
            </div>

            <div style={styles.formRight}>
              <h4 style={{ color: '#2196F3', margin: '0 0 15px 0', fontSize: '14px' }}>Ajouter un membre</h4>
              <div style={styles.field}>
                <label style={styles.label}>Employé</label>
                <select
                  style={styles.input}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Sélectionner un employé --</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <button style={{ ...styles.addBtn, marginTop: 15 }} onClick={handleAddMember}>
                AJOUTER LE MEMBRE
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ ...styles.sectionTitle, margin: 0 }}>Liste des membres ({membersList.length})</h3>
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
                <div style={styles.cellMain}>{m.name}</div>
                <div style={styles.cell}>{m.email}</div>
                <div style={styles.cell}>{m.role}</div>
                <div
                  style={{ ...styles.cellAction, color: 'red', fontWeight: 'bold' }}
                  onClick={() => handleRemoveMember(i)}
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
  cellAction: { color: 'var(--danger)', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', width: '30px', textAlign: 'center' }
};
