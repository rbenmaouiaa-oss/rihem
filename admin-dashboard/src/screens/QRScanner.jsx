import React, { useState } from "react"
import { createPointage } from "../services/pointageService"
import { useNavigate } from "react-router-dom"
import Sidebar from '../Sidebar'

export default function QRScanner() {
  const navigate = useNavigate()
  const [employeeId, setEmployeeId] = useState("EMP001")
  const [nom, setNom] = useState("Ben Maouia")
  const [prenom, setPrenom] = useState("Rihem")
  const [loading, setLoading] = useState(false)

  async function handleValidation() {
    if (!employeeId || !nom || !prenom) {
      alert("Veuillez remplir tous les champs !")
      return
    }

    setLoading(true)
    try {
      await createPointage(employeeId, nom, prenom)
      alert("Pointage QR validé et enregistré dans Supabase ✅")
    } catch (err) {
      console.error(err)
      alert("Erreur de pointage ❌")
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
          <h2 style={styles.pageTitle}>Portail de Scan de Badge QR</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>Simulation de lecture optique connectée en temps réel au registre de pointage.</p>
          <div style={styles.divider}></div>

          <div style={styles.mainGrid}>
            
            {/* FUTURISTIC SCANNER RING PREVIEW */}
            <div style={styles.cameraContainer}>
              <div style={styles.cameraViewport}>
                {/* Cyber Corner brackets */}
                <div style={{...styles.cornerBracket, top: 15, left: 15, borderLeft: '3px solid', borderTop: '3px solid', borderColor: 'var(--success)'}} />
                <div style={{...styles.cornerBracket, top: 15, right: 15, borderRight: '3px solid', borderTop: '3px solid', borderColor: 'var(--success)'}} />
                <div style={{...styles.cornerBracket, bottom: 15, left: 15, borderLeft: '3px solid', borderBottom: '3px solid', borderColor: 'var(--success)'}} />
                <div style={{...styles.cornerBracket, bottom: 15, right: 15, borderRight: '3px solid', borderBottom: '3px solid', borderColor: 'var(--success)'}} />

                {/* Constant barcode scanner laser */}
                <div style={styles.laserScannerLine} />

                <div style={styles.activeFacePlaceholder}>
                  <div style={styles.qrBoundingBox}>
                    {/* Simulated visual grid inside the QR window */}
                    <div style={{ width: '130px', height: '130px', border: '2px solid var(--success)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', animation: 'pulse 2s infinite' }}>
                      <span style={{ fontSize: '60px', opacity: 0.8 }}>🔲</span>
                    </div>
                  </div>
                  <strong style={{ color: 'var(--success)', letterSpacing: '1.5px', marginTop: '160px', fontSize: '12px' }}>TERMINAL QR PRÊT À BALAYER</strong>
                </div>
              </div>
            </div>

            {/* CONTROL PANEL */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>PARAMÈTRES DU SIMULATEUR</h3>
              
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

              <button 
                style={styles.btn} 
                onClick={handleValidation}
                disabled={loading}
              >
                {loading ? "Traitement optique..." : "⚡ Simuler Scan de Badge QR"}
              </button>

              <div style={styles.statusIndicator}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 10px var(--success)'
                }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Lecteur Optique: ACTIF EN LIGNE
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
  cameraViewport: { position: 'relative', height: '380px', backgroundColor: 'var(--bg-sidebar)', border: '2px solid var(--success)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'var(--transition-smooth)', boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)' },
  cornerBracket: { position: 'absolute', width: '20px', height: '20px', pointerEvents: 'none' },
  laserScannerLine: { position: 'absolute', width: '100%', height: '4px', background: 'linear-gradient(to bottom, transparent, var(--success), transparent)', top: 0, left: 0, animation: 'scan 2s linear infinite', boxShadow: '0 0 8px var(--success)', zIndex: 3 },
  activeFacePlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
  qrBoundingBox: { position: 'absolute', borderRadius: '12px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', top: '100px', zIndex: 2 },
  
  // Controls Card
  card: { flex: 1, minWidth: '300px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' },
  panelTitle: { color: 'var(--text-main)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '25px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', fontFamily: 'var(--font-heading)' },
  row: { display: 'flex', gap: '15px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  label: { color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '14px', transition: 'var(--transition-smooth)' },
  btn: { width: '100%', padding: '14px', border: 'none', borderRadius: '10px', backgroundColor: 'var(--success)', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'var(--transition-smooth)' },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)' }
};

