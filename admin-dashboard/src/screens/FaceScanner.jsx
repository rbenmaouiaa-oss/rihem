import React, { useState } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"
import Sidebar from '../Sidebar'

export default function FaceScanner() {
  const navigate = useNavigate()
  const [faceOk, setFaceOk] = useState(false)
  const [employeeId, setEmployeeId] = useState("EMP001")
  const [nom, setNom] = useState("Ben Maouia")
  const [prenom, setPrenom] = useState("Rihem")
  const [loading, setLoading] = useState(false)

  function detectFace() {
    setFaceOk(true)
    alert("Visage détecté et reconnu ✅ (Simulation)")
  }

  async function handleValidation() {
    if (!faceOk) {
      alert("Veuillez d'abord scanner/détecter le visage ! 👤")
      return
    }

    if (!employeeId || !nom || !prenom) {
      alert("Veuillez remplir tous les champs !")
      return
    }

    setLoading(true)
    const today = new Date().toISOString().split("T")[0]
    const currentHeure = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    })

    try {
      // Chercher log aujourd'hui dans la base de données unifiée
      const { data: existingLogs, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Premier pointage (Entrée matin)
      if (!existingLogs || existingLogs.length === 0) {
        const { error } = await supabase
          .from("attendance_logs")
          .insert([{
            status: "valide",
            nom: nom,
            prenom: prenom,
            employee_id: employeeId,
            status_qr: true,
            status_face: true,
            entree1: currentHeure,
            date: today
          }])

        if (error) throw error
        alert(`Entrée matin enregistrée (${currentHeure}) 🌅`)
      }
      else {
        const log = existingLogs[0]

        // Sortie midi
        if (!log.sortie1) {
          const { error } = await supabase
            .from("attendance_logs")
            .update({
              sortie1: currentHeure
            })
            .eq("id", log.id)

          if (error) throw error
          alert(`Sortie midi enregistrée (${currentHeure}) 🍔`)
        }
        // Reprise après-midi
        else if (!log.entree2) {
          const { error } = await supabase
            .from("attendance_logs")
            .update({
              entree2: currentHeure
            })
            .eq("id", log.id)

          if (error) throw error
          alert(`Entrée après-midi enregistrée (${currentHeure}) 💻`)
        }
        // Fin journée
        else if (!log.sortie2) {
          const { error } = await supabase
            .from("attendance_logs")
            .update({
              sortie2: currentHeure,
              status: "valide"
            })
            .eq("id", log.id)

          if (error) throw error
          alert(`Fin journée enregistrée (${currentHeure}) 🚗`)
        }
        else {
          alert("4 pointages déjà effectués pour aujourd'hui 🛑")
        }
      }

      setFaceOk(false)
    }
    catch (error) {
      console.error(error)
      alert("Erreur lors du pointage ❌ : " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>TERMINAL SCANNER</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur ▾</span>
          </div>
        </header>

        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Portail de Validation Biométrique</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>Simulation de détection de visage connectée à l'écosystème Supabase.</p>
          <div style={styles.divider}></div>

          <div style={styles.mainGrid}>
            
            {/* CYBERNETIC VIEWPANEL */}
            <div style={styles.cameraContainer}>
              <div style={{
                ...styles.cameraViewport,
                borderColor: faceOk ? 'var(--success)' : 'var(--primary)',
                boxShadow: faceOk ? '0 0 25px rgba(16, 185, 129, 0.25)' : '0 0 25px rgba(37, 99, 235, 0.15)'
              }}>
                {/* Cyber Corner brackets */}
                <div style={{...styles.cornerBracket, top: 15, left: 15, borderLeft: '3px solid', borderTop: '3px solid', borderColor: faceOk ? 'var(--success)' : 'var(--primary)'}} />
                <div style={{...styles.cornerBracket, top: 15, right: 15, borderRight: '3px solid', borderTop: '3px solid', borderColor: faceOk ? 'var(--success)' : 'var(--primary)'}} />
                <div style={{...styles.cornerBracket, bottom: 15, left: 15, borderLeft: '3px solid', borderBottom: '3px solid', borderColor: faceOk ? 'var(--success)' : 'var(--primary)'}} />
                <div style={{...styles.cornerBracket, bottom: 15, right: 15, borderRight: '3px solid', borderBottom: '3px solid', borderColor: faceOk ? 'var(--success)' : 'var(--primary)'}} />

                {/* Laser Scanning Line */}
                {!faceOk && <div style={styles.laserScannerLine} />}

                {/* Simulated Camera Feed inside Viewport */}
                {faceOk ? (
                  <div style={styles.activeFacePlaceholder}>
                    <div style={styles.faceBoundingBox}>
                      <span style={styles.boundingText}>VISAGE RECONNU: {prenom} {nom}</span>
                    </div>
                    <span style={{ fontSize: '70px', filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.4))' }}>🟢</span>
                    <strong style={{ color: 'var(--success)', letterSpacing: '1px', marginTop: '10px' }}>LOG BIOMÉTRIQUE CONFIRMÉ</strong>
                  </div>
                ) : (
                  <div style={styles.idleFacePlaceholder}>
                    <span style={{ fontSize: '80px', opacity: 0.6, animation: 'pulse 1.8s infinite' }}>👤</span>
                    <p style={{ margin: '15px 0 0 0', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', color: 'var(--text-muted)' }}>MOTEUR IA EN ATTENTE...</p>
                  </div>
                )}
              </div>
            </div>

            {/* CONTROL PANEL */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>CONFIGURATION DU BADGE</h3>
              
              <div style={styles.field}>
                <label style={styles.label}>ID COLLABORATEUR</label>
                <input 
                  style={styles.input} 
                  value={employeeId} 
                  onChange={(e) => setEmployeeId(e.target.value)} 
                />
              </div>

              <div style={styles.row}>
                <div style={{...styles.field, flex: 1}}>
                  <label style={styles.label}>PRÉNOM</label>
                  <input 
                    style={styles.input} 
                    value={prenom} 
                    onChange={(e) => setPrenom(e.target.value)} 
                  />
                </div>

                <div style={{...styles.field, flex: 1}}>
                  <label style={styles.label}>NOM</label>
                  <input 
                    style={styles.input} 
                    value={nom} 
                    onChange={(e) => setNom(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
                <button style={styles.detectBtn} onClick={detectFace}>
                  📸 Simuler Scan Caméra (Face IA)
                </button>
                <button 
                  style={{ 
                    ...styles.btn, 
                    backgroundColor: faceOk ? 'var(--success)' : 'var(--border)', 
                    color: faceOk ? 'white' : 'var(--text-muted)',
                    cursor: faceOk ? 'pointer' : 'not-allowed',
                    boxShadow: faceOk ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none'
                  }} 
                  onClick={handleValidation}
                  disabled={loading || !faceOk}
                >
                  {loading ? "Enregistrement..." : "💾 Valider & Enregistrer le Pointage"}
                </button>
              </div>

              <div style={styles.statusIndicator}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: faceOk ? 'var(--success)' : 'var(--danger)',
                  boxShadow: faceOk ? '0 0 10px var(--success)' : '0 0 10px var(--danger)'
                }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Statut Biométrie: {faceOk ? "PRÊT À L'ENREGISTREMENT" : "ANALYSE REQUISE"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', marginLeft: '280px' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1.5px', margin: 0 },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  pageTitle: { fontSize: '22px', color: 'var(--text-main)', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: 0, borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 35px 0' },
  
  // Cyber grid
  mainGrid: { display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' },
  cameraContainer: { flex: 1.2, minWidth: '320px' },
  cameraViewport: { position: 'relative', height: '380px', backgroundColor: 'var(--bg-sidebar)', border: '2px solid', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'var(--transition-smooth)' },
  cornerBracket: { position: 'absolute', width: '20px', height: '20px', pointerEvents: 'none' },
  laserScannerLine: { position: 'absolute', width: '100%', height: '4px', background: 'linear-gradient(to bottom, transparent, var(--primary), transparent)', top: 0, left: 0, animation: 'scan 2.5s linear infinite', boxShadow: '0 0 8px var(--primary)', zIndex: 3 },
  idleFacePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  activeFacePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  faceBoundingBox: { position: 'absolute', border: '2px dashed var(--success)', borderRadius: '6px', width: '220px', height: '220px', display: 'flex', justifyContent: 'center', zIndex: 2 },
  boundingText: { position: 'absolute', top: '-24px', backgroundColor: 'var(--success)', color: 'white', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  
  // Controls Card
  card: { flex: 1, minWidth: '300px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' },
  panelTitle: { color: 'var(--text-main)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '25px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', fontFamily: 'var(--font-heading)' },
  row: { display: 'flex', gap: '15px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  label: { color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px', transition: 'var(--transition-smooth)' },
  btn: { width: '100%', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', transition: 'var(--transition-smooth)' },
  detectBtn: { width: '100%', padding: '14px', border: 'none', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'var(--transition-smooth)' },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }
};