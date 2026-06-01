import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function CreerPlanning() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize schedule data for 7 days
  const [schedule, setSchedule] = useState({
    Lundi: { active: true, entree1: "08:00", sortie1: "12:00", entree2: "14:00", sortie2: "18:00" },
    Mardi: { active: true, entree1: "08:00", sortie1: "12:00", entree2: "14:00", sortie2: "18:00" },
    Mercredi: { active: true, entree1: "08:00", sortie1: "12:00", entree2: "14:00", sortie2: "18:00" },
    Jeudi: { active: true, entree1: "08:00", sortie1: "12:00", entree2: "14:00", sortie2: "18:00" },
    Vendredi: { active: true, entree1: "08:00", sortie1: "12:00", entree2: "14:00", sortie2: "18:00" },
    Samedi: { active: false, entree1: "--:--", sortie1: "--:--", entree2: "--:--", sortie2: "--:--" },
    Dimanche: { active: false, entree1: "--:--", sortie1: "--:--", entree2: "--:--", sortie2: "--:--" }
  });

  const daysList = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  // Toggle active day
  const handleToggleDay = (day) => {
    const isAct = schedule[day].active;
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        active: !isAct,
        entree1: !isAct ? "08:00" : "--:--",
        sortie1: !isAct ? "12:00" : "--:--",
        entree2: !isAct ? "14:00" : "--:--",
        sortie2: !isAct ? "18:00" : "--:--"
      }
    });
  };

  // Handle time updates
  const handleTimeChange = (day, field, val) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: val
      }
    });
  };

  // Submit to Supabase
  const handleSavePlanning = async () => {
    if (!title.trim()) {
      alert("Veuillez saisir un titre pour le planning !");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plannings')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            schedule_data: schedule
          }
        ]);

      if (error) throw error;

      alert("Le planning hebdomadaire a été enregistré avec succès ! 🗓️");
      setTitle("");
      setDescription("");
      navigate('/home');

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde du planning ❌: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR BLEUE FIXE */}
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
          <div style={styles.navItem} onClick={() => navigate('/creer-equipe')}>👥 CRÉER ÉQUIPES</div>
          <div style={styles.navItemActive} onClick={() => navigate('/creer-planning')}>🗓️ MON PLANNING</div>
          
          <div style={styles.navDivider}>SIMULATEURS DE TERMINAL</div>
          <div style={styles.navItemSim} onClick={() => navigate('/scanner-facial')}>👤 Simuler Scan Facial</div>
          <div style={styles.navItemSim} onClick={() => navigate('/scanner-qr')}>🎫 Simuler Scan QR</div>
        </nav>
        <div style={styles.sidebarFooter}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={styles.pageTitle}>Crée un nouveau planning</h2>
            <button 
              style={styles.saveBtn} 
              onClick={handleSavePlanning}
              disabled={loading}
            >
              {loading ? "Sauvegarde..." : "💾 Enregistrer le Planning"}
            </button>
          </div>
          <div style={styles.divider}></div>

          {/* FORMULAIRE HAUT */}
          <div style={styles.card}>
            <div style={styles.field}>
              <label style={styles.label}>Titre du planning *</label>
              <input 
                style={styles.input} 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="ex: Horaires d'Été 2026"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea 
                style={styles.textarea} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spécifications particulières sur ce planning..."
              ></textarea>
            </div>
          </div>

          {/* GRILLE DE PLANNING */}
          <div style={styles.planningContainer}>
            <div style={styles.gridHeader}>
              <div style={{flex: 1.2, fontWeight: '700'}}>Jour de la semaine</div>
              <div style={{flex: 2, textAlign: 'center', color: 'var(--primary)', fontWeight: '700'}}>🌅 Shift Matin (Partie 1)</div>
              <div style={{flex: 2, textAlign: 'center', color: '#8b5cf6', fontWeight: '700'}}>💻 Shift Après-Midi (Partie 2)</div>
            </div>

            <div style={styles.daysListWrapper}>
              {daysList.map((jour) => {
                const isAct = schedule[jour].active;
                return (
                  <div 
                    key={jour} 
                    style={{ 
                      ...styles.gridRow, 
                      backgroundColor: isAct ? 'var(--bg-card)' : 'var(--bg-app)',
                      opacity: isAct ? 1 : 0.6
                    }}
                  >
                    {/* Day name & toggle */}
                    <div style={styles.dayCell}>
                      <label style={styles.checkboxContainer}>
                        <input 
                          type="checkbox" 
                          checked={isAct} 
                          onChange={() => handleToggleDay(jour)} 
                          style={styles.checkbox}
                        />
                        <span style={{ fontWeight: '700', fontSize: '14.5px', color: isAct ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {jour}
                        </span>
                      </label>
                    </div>

                    {/* Shift 1 (Matin) */}
                    <div style={styles.shiftWrapper}>
                      <input 
                        style={styles.timeInput} 
                        value={schedule[jour].entree1} 
                        onChange={(e) => handleTimeChange(jour, 'entree1', e.target.value)}
                        disabled={!isAct}
                        placeholder="08:00"
                      />
                      <span style={{ color: 'var(--text-muted)' }}>à</span>
                      <input 
                        style={styles.timeInput} 
                        value={schedule[jour].sortie1} 
                        onChange={(e) => handleTimeChange(jour, 'sortie1', e.target.value)}
                        disabled={!isAct}
                        placeholder="12:00"
                      />
                    </div>

                    {/* Shift 2 (Après-midi) */}
                    <div style={styles.shiftWrapper}>
                      <input 
                        style={styles.timeInput} 
                        value={schedule[jour].entree2} 
                        onChange={(e) => handleTimeChange(jour, 'entree2', e.target.value)}
                        disabled={!isAct}
                        placeholder="14:00"
                      />
                      <span style={{ color: 'var(--text-muted)' }}>à</span>
                      <input 
                        style={styles.timeInput} 
                        value={schedule[jour].sortie2} 
                        onChange={(e) => handleTimeChange(jour, 'sortie2', e.target.value)}
                        disabled={!isAct}
                        placeholder="18:00"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
  backBtn: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 'bold', transition: 'var(--transition-smooth)' },
  main: { flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1.5px', margin: 0 },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  pageTitle: { fontSize: '22px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 25px 0' },
  card: { backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'var(--transition-smooth)' },
  textarea: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', height: '80px', resize: 'none', outline: 'none', fontSize: '14px', transition: 'var(--transition-smooth)' },
  planningContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  gridHeader: { display: 'flex', padding: '10px 20px', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' },
  daysListWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  gridRow: { display: 'flex', alignItems: 'center', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border)', transition: 'var(--transition-smooth)', boxShadow: 'var(--shadow-sm)' },
  dayCell: { flex: 1.2, display: 'flex', alignItems: 'center' },
  checkboxContainer: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  checkbox: { cursor: 'pointer', accentColor: 'var(--primary)', width: '16px', height: '16px' },
  shiftWrapper: { flex: 2, display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' },
  timeInput: { width: '80px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', textAlign: 'center', transition: 'var(--transition-smooth)', outline: 'none' },
  saveBtn: { backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)', fontSize: '13.5px' }
};