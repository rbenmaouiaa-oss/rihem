import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Equipes() {
  const navigate = useNavigate();
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  async function fetchTeamsData() {
    setLoading(true);
    try {
      const { data: tData, error: errT } = await supabase
        .from('teams')
        .select('*');
      
      if (!errT) setTeamsCount(tData ? tData.length : 0);

      const { data: members, error: errMembers } = await supabase
        .from('team_members')
        .select('*');

      if (!errMembers) {
        setCollaborateurs(members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="Aca ROBOTICS" style={styles.logoImage} onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={styles.logoTextFallback}>Aca ROBOTICS</h1>
        </div>
        
        <nav style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate('/home')}>📊 TABLEAU DE BORD</div>
          <div style={styles.navItem} onClick={() => navigate('/profil')}>👤 MON PROFIL</div>
          <div style={styles.navItem} onClick={() => navigate('/fiche-pointage')}>📅 FICHE DE POINTAGE</div>
          <div style={styles.navItemActive} onClick={() => navigate('/equipes')}>👥 MES ÉQUIPES</div>
          <div style={styles.navItem} onClick={() => navigate('/creer-equipe')}>👥 CRÉER ÉQUIPES</div>
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

      {/* --- MAIN CONTENT --- */}
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

        {/* ONGLETS NAVIGATION */}
        <div style={styles.tabsContainer}>
          <div style={styles.tab}>Moi</div>
          <div style={styles.tabActive}>Mes équipes</div>
        </div>

        <div style={styles.content}>
          {/* CARTES STATS (HAUT) */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <h4 style={styles.statLabel}>MES COLLABORATEURS</h4>
              <div style={styles.statNumber}>{loading ? "..." : collaborateurs.length}</div>
            </div>
            <div style={styles.statCard}>
              <h4 style={styles.statLabel}>MES ÉQUIPES</h4>
              <div style={styles.statNumber}>{loading ? "..." : teamsCount}</div>
            </div>
            <div style={styles.chartCard}>
              <div style={styles.circularBox}>
                <div style={styles.circularProgress}>100%</div>
              </div>
              <div style={styles.legend}>
                <div style={styles.legendItem}><span style={{color: '#90CAF9', marginRight: '8px'}}>●</span> Actifs: <strong>{collaborateurs.length}</strong></div>
                <div style={styles.legendItem}><span style={{color: '#2196F3', marginRight: '8px'}}>●</span> Total: <strong>{collaborateurs.length}</strong></div>
              </div>
            </div>
          </div>

          {/* SECTION GRILLE COLLABORATEURS */}
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>VOS COLLABORATEURS</h3>
            <div style={styles.filter}>Trier par <span style={styles.filterBox}>Tous</span></div>
          </div>

          <div style={styles.grid}>
            {collaborateurs.map((c, i) => (
              <div key={i} style={styles.collabCard}>
                <div style={styles.collabLeft}>
                  <div style={styles.avatarIcon}>👤</div>
                  <div>
                    <div style={styles.collabName}>{c.employee_name}</div>
                    <div style={styles.collabRole}>{c.employee_role}</div>
                  </div>
                </div>
                <div style={styles.collabRight}>
                  <div style={styles.timeRow}>
                    <span style={styles.blueIcon}>➔</span> {c.employee_status}
                  </div>
                  <div style={styles.timeRow}>
                    <span style={styles.blueIcon}>📞</span> {c.employee_phone || "Non renseigné"}
                  </div>
                  <div style={styles.chevron}>›</div>
                </div>
              </div>
            ))}
            {!loading && collaborateurs.length === 0 && (
              <p style={{ gridColumn: 'span 4', textAlign: 'center', color: '#666', marginTop: 20 }}>
                Aucun collaborateur trouvé. Créez des équipes pour commencer !
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
  tabsContainer: { backgroundColor: 'var(--bg-card)', display: 'flex', padding: '0 40px', gap: '30px', borderBottom: '1px solid var(--border)' },
  tab: { padding: '15px 0', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-smooth)' },
  tabActive: { padding: '15px 0', color: 'var(--primary)', fontWeight: '700', borderBottom: '3px solid var(--primary)', fontSize: '14px' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  statsRow: { display: 'flex', gap: '25px', marginBottom: '35px' },
  statCard: { flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '25px 30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' },
  statLabel: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  statNumber: { fontSize: '42px', color: 'var(--primary)', fontWeight: '800', fontFamily: 'var(--font-heading)' },
  chartCard: { flex: 1.2, backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px 30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '25px' },
  circularBox: { width: '80px', height: '80px', borderRadius: '50%', border: '8px solid var(--primary)', borderLeftColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseGlow 2s infinite' },
  circularProgress: { color: 'var(--primary)', fontWeight: '800', fontSize: '15px', fontFamily: 'var(--font-heading)' },
  legend: { fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' },
  legendItem: { display: 'flex', alignItems: 'center' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionTitle: { fontSize: '20px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  filter: { fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' },
  filterBox: { border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  collabCard: { backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: '16px', border: '1px solid var(--border)', borderLeft: '6px solid var(--primary)', display: 'flex', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-bounce)' },
  collabLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatarIcon: { width: '40px', height: '40px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '20px' },
  collabName: { fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' },
  collabRole: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'capitalize' },
  collabRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' },
  timeRow: { fontSize: '12px', color: 'var(--primary)', fontWeight: '700' },
  blueIcon: { marginRight: '5px' },
  chevron: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '20px', height: '20px', borderRadius: '6px', alignSelf: 'flex-end', textAlign: 'center', marginTop: '5px', fontWeight: 'bold' }
};