import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('CompanyAdmin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const savedEmail = localStorage.getItem('email');
      if (savedEmail) {
        const { data: dbUsers } = await supabase.from('users').select('role').eq('email', savedEmail);
        if (dbUsers && dbUsers.length > 0) {
          setUserRole(dbUsers[0].role);
          return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  const isManager = userRole === 'Manager';
  const isAdmin = userRole === 'CompanyAdmin' || userRole === 'SuperAdmin';

  const path = location.pathname;
  const search = location.search;
  const activeItem = (() => {
    if (path === '/home' || path === '/') return 'dashboard';
    if (path.startsWith('/equipes')) return 'equipes';
    if (path === '/creer-equipe') return 'creer-equipe';
    if (path === '/creer-planning') return 'creer-planning';
    if (path === '/fiche-pointage') return 'fiche-pointage';
    if (path === '/terminal-intelligent') return 'terminal-intelligent';
    if (path === '/scanner-qr') return 'scanner-qr';
    if (path === '/scanner-facial') return 'scanner-facial';
    if (path === '/badge-qr') return 'badge-qr';
    if (path === '/admin/employees/create') return 'creer-employe';
    if (path === '/profil') return 'profil';
    if (path === '/manager/dashboard') {
      if (search.includes('tab=mon-tableau')) return 'mon-tableau';
      if (search.includes('tab=mon-profil')) return 'mon-profil';
      if (search.includes('tab=ma-fiche')) return 'ma-fiche';
      if (search.includes('tab=mon-planning')) return 'mon-planning';
      if (search.includes('tab=mes-collaborateurs')) return 'mes-collaborateurs';
      if (search.includes('tab=pointage')) return 'pointage';
      if (search.includes('tab=mes-equipes')) return 'mes-equipes';
      return 'mon-tableau';
    }
    return 'dashboard';
  })();

  function handleNav(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20, display: sidebarOpen ? 'block' : 'none' }} onClick={() => setSidebarOpen(false)} />
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <img src="/Logo.png" alt="Aca Robotics" style={{ height: '60px', width: 'auto', objectFit: 'contain', backgroundColor: '#112A6D', padding: '6px', borderRadius: '8px' }} />
          <span style={{ ...styles.roleBadge, color: isManager ? '#f59e0b' : '#06b6d4', backgroundColor: isManager ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)' }}>{({ CompanyAdmin: 'Administrateur', SuperAdmin: 'Admin', Manager: 'Manager', Employee: 'Employé' })[userRole] || userRole}</span>
        </div>

        <nav style={styles.nav}>
          {isManager ? (
            <>
              <div style={activeItem === 'mon-tableau' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=mon-tableau')}>
                <span>📊</span> Mon Tableau de Bord
              </div>
              <div style={activeItem === 'mon-profil' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=mon-profil')}>
                <span>👤</span> Mon Profil
              </div>
              <div style={activeItem === 'ma-fiche' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=ma-fiche')}>
                <span>⏱️</span> Ma Fiche de Pointage
              </div>
              <div style={activeItem === 'mon-planning' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=mon-planning')}>
                <span>📅</span> Mon Planning
              </div>
              <div style={activeItem === 'mes-equipes' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=mes-equipes')}>
                <span>👥</span> Mes Équipes
              </div>
              <div style={activeItem === 'mes-collaborateurs' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/manager/dashboard?tab=mes-collaborateurs')}>
                <span>👤</span> Mes Collaborateurs
              </div>
            </>
          ) : (
            <>
              <div style={activeItem === 'dashboard' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/home')}>
                <span>📊</span> Tableau de Bord
              </div>

              {isAdmin && <div style={styles.divider}>Gestion</div>}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/admin/employees/create')}>
                  <span>➕</span> Créer Employé
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/equipes')}>
                  <span>👥</span> Gérer Équipes
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/creer-equipe')}>
                  <span>📋</span> Créer Équipe
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/creer-planning')}>
                  <span>📅</span> Créer Planning
                </div>
              )}

              {isAdmin && <div style={styles.divider}>Pointage</div>}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/fiche-pointage')}>
                  <span>📄</span> Fiche de Pointage
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/terminal-intelligent')}>
                  <span>⚡</span> Terminal Intelligent
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/scanner-qr')}>
                  <span>📷</span> Scanner QR
                </div>
              )}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/scanner-facial')}>
                  <span>😀</span> Scanner Facial
                </div>
              )}

              {isAdmin && <div style={styles.divider}>Badges</div>}

              {isAdmin && (
                <div style={styles.navItem} onClick={() => handleNav('/badge-qr')}>
                  <span>📱</span> Générer Badges QR
                </div>
              )}

              {isAdmin && <div style={styles.divider}>Recrutement IA</div>}

              {isAdmin && (
                <div style={activeItem === 'recrutement' ? styles.navItemActive : styles.navItem} onClick={() => handleNav('/recrutement')}>
                  <span>🤖</span> Analyse CV (IA)
                </div>
              )}
            </>
          )}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.logout} onClick={() => navigate('/')}>
            <span>🚪</span> Déconnexion
          </div>
        </div>
      </aside>
    </>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#112A6D',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    height: '100vh',
    position: 'fixed',
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
    gap: '12px',
    backgroundColor: '#112A6D'
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
  }
};
