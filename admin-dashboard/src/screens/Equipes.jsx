import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function Equipes() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  async function fetchTeamsData() {
    setLoading(true);
    try {
      const storedEmail = localStorage.getItem('email');
      if (storedEmail) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', storedEmail);

        if (userData && userData.length > 0) {
          const currentUser = userData[0];
          let teamsQuery = supabase.from('teams').select('*');
          if (currentUser.role === 'Manager') {
            teamsQuery = teamsQuery.eq('manager_id', currentUser.id);
          }
          const { data: teamsData } = await teamsQuery;

          if (teamsData && currentUser) {
            let memberTotal = 0;
            const teamsWithCount = await Promise.all(
              teamsData.map(async (team) => {
                const { count } = await supabase
                  .from('team_members')
                  .select('*', { count: 'exact', head: true })
                  .eq('team_id', team.id);
                memberTotal += count || 0;
                return { ...team, memberCount: count || 0 };
              })
            );
            setTeams(teamsWithCount);
            setTotalMembers(memberTotal);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

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

        <div style={styles.tabsContainer}>
          <div style={styles.tab}>Moi</div>
          <div style={styles.tabActive}>Mes équipes</div>
        </div>

        <div style={styles.content}>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <h4 style={styles.statLabel}>MES ÉQUIPES</h4>
              <div style={styles.statNumber}>{loading ? "..." : teams.length}</div>
            </div>
            <div style={styles.statCard}>
              <h4 style={styles.statLabel}>MEMBRES TOTAL</h4>
              <div style={styles.statNumber}>{loading ? "..." : totalMembers}</div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>VOS ÉQUIPES</h3>
            <button style={styles.createBtn} onClick={() => navigate('/creer-equipe')}>
              + Créer une équipe
            </button>
          </div>

          <div style={styles.grid}>
            {teams.map((team) => (
              <div
                key={team.id}
                style={styles.teamCard}
                onClick={() => navigate(`/equipes/${team.id}/membres`)}
              >
                <div style={styles.teamCardHeader}>
                  <div style={styles.avatarIcon}>👥</div>
                  <div style={styles.teamName}>{team.name}</div>
                </div>
                <div style={styles.teamDescription}>
                  {team.description || "Aucune description"}
                </div>
                <div style={styles.teamMeta}>
                  <span style={styles.memberBadge}>
                    {team.memberCount} membre{team.memberCount !== 1 ? 's' : ''}
                  </span>
                  <span style={styles.teamDate}>
                    {formatDate(team.created_at)}
                  </span>
                </div>
              </div>
            ))}
            {!loading && teams.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>👥</div>
                <p style={styles.emptyText}>Aucune équipe pour le moment.</p>
                <button style={styles.createEmptyBtn} onClick={() => navigate('/creer-equipe')}>
                  + Créer une équipe
                </button>
              </div>
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
  tabsContainer: { backgroundColor: 'var(--bg-card)', display: 'flex', padding: '0 40px', gap: '30px', borderBottom: '1px solid var(--border)' },
  tab: { padding: '15px 0', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-smooth)' },
  tabActive: { padding: '15px 0', color: 'var(--primary)', fontWeight: '700', borderBottom: '3px solid var(--primary)', fontSize: '14px' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  statsRow: { display: 'flex', gap: '25px', marginBottom: '35px' },
  statCard: { flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '25px 30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' },
  statLabel: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  statNumber: { fontSize: '42px', color: 'var(--primary)', fontWeight: '800', fontFamily: 'var(--font-heading)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionTitle: { fontSize: '20px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  createBtn: { padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  teamCard: { backgroundColor: 'var(--bg-card)', padding: '22px', borderRadius: '16px', border: '1px solid var(--border)', borderLeft: '6px solid var(--primary)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-bounce)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' },
  teamCardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarIcon: { width: '40px', height: '40px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '20px' },
  teamName: { fontWeight: '800', fontSize: '16px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' },
  teamDescription: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.5', flex: 1 },
  teamMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  memberBadge: { padding: '4px 12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', borderRadius: '20px' },
  teamDate: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyText: { fontSize: '16px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '20px' },
  createEmptyBtn: { padding: '12px 28px', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)' },
};
