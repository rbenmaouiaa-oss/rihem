import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Sidebar from '../Sidebar';

export default function CreerPlanning() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [workingDays, setWorkingDays] = useState([
    "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"
  ]);
  const [loading, setLoading] = useState(false);

  const daysList = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSavePlanning = async () => {
    if (!name.trim()) {
      alert("Veuillez saisir un nom pour le planning !");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('plannings')
        .insert([
          {
            name: name.trim(),
            description: description.trim(),
            start_time: startTime,
            end_time: endTime,
            working_days: workingDays
          }
        ]);

      if (error) throw error;

      alert("Le planning a été enregistré avec succès !");
      setName("");
      setDescription("");
      setStartTime("08:00");
      setEndTime("17:00");
      setWorkingDays(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]);
      navigate('/home');

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde du planning : " + err.message);
    } finally {
      setLoading(false);
    }
  };

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

          <div style={styles.card}>
            <div style={styles.field}>
              <label style={styles.label}>Nom du planning *</label>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            <div style={styles.timeRow}>
              <div style={styles.field}>
                <label style={styles.label}>Heure de début *</label>
                <input
                  style={styles.input}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Heure de fin *</label>
                <input
                  style={styles.input}
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <label style={styles.label}>Jours travaillés</label>
            <div style={styles.daysGrid}>
              {daysList.map((day) => {
                const isSelected = workingDays.includes(day);
                return (
                  <div
                    key={day}
                    style={{
                      ...styles.dayChip,
                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--text-white)' : 'var(--text-main)',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)'
                    }}
                    onClick={() => toggleDay(day)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDay(day)}
                      style={{ display: 'none' }}
                    />
                    {day}
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
  timeRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  daysGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' },
  dayChip: { padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)', userSelect: 'none' },
  saveBtn: { backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)', fontSize: '13.5px' }
};
