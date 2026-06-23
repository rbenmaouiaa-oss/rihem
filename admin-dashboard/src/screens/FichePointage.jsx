import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';
export default function FichePointage() {
  const navigate = useNavigate();

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

      // Récupérer les noms des employés
      const ids = [...new Set(data.map(d => d.employee_id))];
      let userMap = {};
      if (ids.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, nom, prenom')
          .in('id', ids);
        if (users) {
          users.forEach(u => { userMap[u.id] = u; });
        }
      }

      // Formatage
      const formattedData = data.map(item => {
        const user = userMap[item.employee_id] || {};
        return {
          ...item,
          nom_prenom: `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Inconnu',
          heure: item.time || "",
          qr_valide: item.qr_verified ? "Validé" : "Non",
          dateAffichage: new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
          })
        };
      });

      // Filtre de recherche général
      if (searchFilters.texte) {
        const txt = searchFilters.texte.toLowerCase();
        const localFiltered = formattedData.filter(log => 
          log.nom_prenom.toLowerCase().includes(txt) ||
          log.heure.includes(txt)
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
      <Sidebar />

      {/* CONTENU */}
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
              <label style={styles.filterLabel}>FILTRER PAR NOM</label>
              <input 
                style={styles.input} 
                type="text" 
                placeholder="Tapez un nom ou prénom..." 
                value={filtreTexte} 
                onChange={(e) => setFiltreTexte(e.target.value)} 
              />
            </div>
            <button style={styles.searchBtn} onClick={handleSearch}>🔍 Filtrer</button>
          </div>

          {/* TABLEAU (Nom & Prénom, Date, Heure, QR) */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <div style={styles.cellNom}>COLLABORATEUR</div>
              <div style={styles.cellDate}>DATE</div>
              <div style={styles.cellHeure}>HEURE</div>
              <div style={styles.cellType}>TYPE</div>
              <div style={styles.cellQr}>QR CODE</div>
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
                  <div style={styles.cellHeureText}>{log.heure}</div>
                  <div style={styles.cellTypeText}>{log.type === "check_in" ? "Entrée" : "Sortie"}</div>
                  <div style={styles.cellQrText}>{log.qr_valide}</div>
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
  cellHeure: { flex: 1.5, textAlign: 'center' },
  cellType: { flex: 1, textAlign: 'center' },
  cellQr: { flex: 1, textAlign: 'center' },
  cellNomText: { flex: 2.5, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  avatarBubble: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  cellDateText: { flex: 2, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' },
  cellHeureText: { flex: 1.5, fontSize: '13px', color: 'var(--text-main)', fontWeight: '600', textAlign: 'center' },
  cellTypeText: { flex: 1, fontSize: '13px', color: 'var(--primary)', fontWeight: '700', textAlign: 'center' },
  cellQrText: { flex: 1, fontSize: '13px', color: '#16a34a', fontWeight: '700', textAlign: 'center' },
  noResult: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }
};