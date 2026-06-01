import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
export default function FichePointage() {
  const navigate = useNavigate();
  const location = useLocation();

  // États pour les filtres
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [filtreTexte, setFiltreTexte] = useState("");
  
  // État pour les données de la base
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPointages();
  }, []);

  const fetchPointages = async (searchFilters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance_logs')
        .select('*')
        .order('date', { ascending: false });

      if (searchFilters.debut) {
        query = query.gte('date', searchFilters.debut);
      }
      if (searchFilters.fin) {
        query = query.lte('date', searchFilters.fin);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Formatage de la date (ex: "24 mai 2026")
      const formattedData = data.map(item => ({
        ...item,
        nom_prenom: `${item.prenom} ${item.nom}`,
        entree: item.entree1 || "08:00",
        sortie: item.sortie2 || "17:00",
        dateAffichage: new Date(item.date).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      }));

      // Filtre de recherche général
      if (searchFilters.texte) {
        const txt = searchFilters.texte.toLowerCase();
        const localFiltered = formattedData.filter(log => 
          log.nom_prenom.toLowerCase().includes(txt) ||
          (log.entree && log.entree.includes(txt)) ||
          (log.sortie && log.sortie.includes(txt))
        );
        setLogs(localFiltered);
      } else {
        setLogs(formattedData);
      }

    } catch (error) {
      console.error("Erreur Supabase :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPointages({
      debut: dateDebut.trim(),
      fin: dateFin.trim(),
      texte: filtreTexte.trim()
    });
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="Aca ROBOTICS" style={styles.logoImage} onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={styles.logoTextFallback}>Aca ROBOTICS</h1>
        </div>
        <nav style={styles.nav}>
          <div style={styles.navItem} onClick={() => navigate('/home')}>📊 TABLEAU DE BORD</div>
          <div style={styles.navItem} onClick={() => navigate('/profil')}>👤 MON PROFIL</div>
          <div style={styles.navItemActive} onClick={() => navigate('/fiche-pointage')}>📅 FICHE DE POINTAGE</div>
          <div style={styles.navItem} onClick={() => navigate('/equipes')}>👥 MES ÉQUIPES</div>
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

      {/* CONTENU */}
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
          <h2 style={styles.pageTitle}>Registre Général des Présences</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>Consultez et filtrez l'historique complet des logs de pointage.</p>
          <div style={styles.divider}></div>

          {/* RECHERCHE */}
          <div style={styles.filterBar}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.filterLabel}>DATE DE DÉBUT</label>
              <input 
                style={styles.input} 
                type="text" 
                placeholder="AAAA-MM-JJ" 
                value={dateDebut} 
                onChange={(e) => setDateDebut(e.target.value)} 
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.filterLabel}>DATE DE FIN</label>
              <input 
                style={styles.input} 
                type="text" 
                placeholder="AAAA-MM-JJ" 
                value={dateFin} 
                onChange={(e) => setDateFin(e.target.value)} 
              />
            </div>
            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.filterLabel}>FILTRER PAR NOM / HEURE</label>
              <input 
                style={styles.input} 
                type="text" 
                placeholder="Tapez un nom, un prénom ou une heure..." 
                value={filtreTexte} 
                onChange={(e) => setFiltreTexte(e.target.value)} 
              />
            </div>
            <button style={styles.searchBtn} onClick={handleSearch}>🔍 Filtrer</button>
          </div>

          {/* TABLEAU EXACT (Nom & Prénom, Date, Entrée, Sortie) */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <div style={styles.cellNom}>COLLABORATEUR</div>
              <div style={styles.cellDate}>DATE DU POINTAGE</div>
              <div style={styles.cellHeure}>ENTRÉE MATIN</div>
              <div style={styles.cellHeure}>SORTIE SOIR</div>
              <div style={styles.cellAction}>PROFIL</div>
            </div>
            
            {loading ? (
              <div style={styles.noResult}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>⚡</span>
                Chargement des logs Supabase en cours...
              </div>
            ) : logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={log.id || index} style={styles.tableRow} className="card-animate">
                  <div style={styles.cellNomText}>
                    <div style={styles.avatarBubble}>
                      {log.nom_prenom ? log.nom_prenom.split(' ').map(n=>n[0]).join('').toUpperCase() : '??'}
                    </div>
                    {log.nom_prenom}
                  </div>
                  <div style={styles.cellDateText}>{log.dateAffichage || log.date}</div>
                  <div style={styles.cellHeureText}>🌅 {log.entree}</div>
                  <div style={styles.cellHeureText}>🚗 {log.sortie || "Non pointé"}</div>
                  <div style={styles.cellActionArrow} onClick={() => navigate('/profil')}>›</div>
                </div>
              ))
            ) : (
              <div style={styles.noResult}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '15px' }}>📅</span>
                Aucun log de pointage ne correspond à vos filtres de recherche.
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
  sidebar: { width: '280px', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10, padding: '15px' },
  logoSection: { padding: '20px', textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)' },
  logoImage: { width: '180px', maxHeight: '50px', objectFit: 'contain' },
  logoTextFallback: { fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' },
  navDivider: { padding: '15px 20px 5px 20px', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' },
  navItem: { padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '10px', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '12px' },
  navItemActive: { padding: '12px 20px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--primary)', color: 'var(--text-white)', cursor: 'pointer', borderRadius: '10px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', transition: 'var(--transition-smooth)', display: 'flex', alignItems: 'center', gap: '12px' },
  navItemSim: { padding: '10px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '10px', transition: 'var(--transition-smooth)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', marginLeft: '10px', marginRight: '10px', marginBottom: '5px' },
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
  pageTitle: { fontSize: '22px', color: 'var(--text-main)', fontWeight: '800', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px', margin: 0 },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 30px 0' },
  filterBar: { display: 'flex', gap: '20px', marginBottom: '35px', alignItems: 'flex-end', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  filterLabel: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', backgroundColor: 'var(--bg-app)', fontSize: '13px', color: 'var(--text-main)', transition: 'var(--transition-smooth)' },
  searchBtn: { backgroundColor: 'var(--primary)', color: 'white', border: 'none', height: '46px', padding: '0 30px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)' },
  tableContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tableHeader: { padding: '12px 20px', display: 'flex', color: 'var(--text-muted)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tableRow: { backgroundColor: 'var(--bg-card)', padding: '16px 20px', display: 'flex', alignItems: 'center', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)' },
  cellNom: { flex: 2.5, textAlign: 'left' },
  cellDate: { flex: 2, textAlign: 'center' },
  cellHeure: { flex: 2, textAlign: 'center' },
  cellAction: { width: '40px', textAlign: 'right' },
  cellNomText: { flex: 2.5, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  avatarBubble: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  cellDateText: { flex: 2, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' },
  cellHeureText: { flex: 2, fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', textAlign: 'center' },
  cellActionArrow: { width: '40px', color: 'var(--primary)', fontSize: '22px', textAlign: 'right', fontWeight: 'bold', cursor: 'pointer', transition: 'var(--transition-smooth)' },
  noResult: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }
};