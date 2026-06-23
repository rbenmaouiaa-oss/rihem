import React, { useState, useEffect, useRef } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"
import Sidebar from '../Sidebar'

const STEPS = { QR: "qr", FACE: "face", DONE: "done" }

export default function SmartTerminal() {
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState(STEPS.QR)
  const [qrOk, setQrOk] = useState(false)
  const [faceOk, setFaceOk] = useState(false)
  const [faceScore, setFaceScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [log, setLog] = useState([])

  useEffect(() => {
    loadEmployees()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  async function loadEmployees() {
    const { data } = await supabase.from("users").select("id,nom,prenom,email,photo_url,department_id").eq("status", "active")
    if (data) setEmployees(data)
  }

  const filtered = employees.filter(e =>
    `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  )

  function addLog(msg, type = "info") {
    setLog(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev])
  }

  async function handleScanQR() {
    if (!selected) { setMessage("Sélectionnez un employé"); return }
    setLoading(true)
    setMessage("Scan du QR code en cours...")

    const deviceUid = "ESP32_TERMINAL_01"
    const payload = {
      employee_id: selected.id,
      timestamp: new Date().toISOString(),
      token: Math.random().toString(36).substring(2, 8).toUpperCase(),
      signature: "simulated"
    }

    try {
      const res = await fetch("http://localhost:5000/api/device/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_uid: deviceUid, qr_payload: JSON.stringify(payload) })
      })
      const data = await res.json()
      if (data.status === "authorized") {
        setQrOk(true)
        addLog("QR validé", "success")
        setMessage("QR valide → Scannez votre visage")
        timerRef.current = setTimeout(() => setStep(STEPS.FACE), 800)
      } else {
        addLog(`QR refusé: ${data.reason}`, "error")
        setMessage(`QR refusé: ${data.reason}`)
      }
    } catch {
      addLog("Serveur hors-ligne, mode simulation", "warning")
      await new Promise(r => setTimeout(r, 1000))
      setQrOk(true)
      addLog("QR validé (simulation)", "success")
      setMessage("QR valide → Scannez votre visage")
      timerRef.current = setTimeout(() => setStep(STEPS.FACE), 800)
    } finally {
      setLoading(false)
    }
  }

  async function recordPointage(score) {
    const now = new Date()
    const { data: user } = await supabase.from("users").select("company_id").eq("id", selected.id).single()
    await supabase.from("attendance_logs").insert({
      company_id: user?.company_id,
      employee_id: selected.id,
      type: "check_in",
      status: "present",
      qr_verified: true,
      face_verified: true,
      face_score: score || 0.35,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("fr-FR"),
      nom: selected.nom,
      prenom: selected.prenom
    }).then(({ error }) => {
      if (error) addLog(`Erreur enregistrement: ${error.message}`, "error")
      else addLog("Pointage enregistré en base", "success")
    })
  }

  async function handleScanFace() {
    if (!selected) return
    setLoading(true)
    setMessage("Capture et analyse du visage...")

    const deviceUid = "ESP32_TERMINAL_01"
    const fakeBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg"

    try {
      const res = await fetch("http://localhost:5000/api/device/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_uid: deviceUid, employee_id: selected.id, face_image_base64: fakeBase64 })
      })
      const data = await res.json()
      if (data.status === "success") {
        setFaceOk(true)
        setFaceScore(data.face_score || 0.35)
        addLog(`Visage reconnu - ${data.message}`, "success")
        setMessage("✅ Pointage enregistré avec succès !")
        setStep(STEPS.DONE)
        await recordPointage(data.face_score || 0.35)
      } else {
        addLog(`Visage refusé: ${data.reason}`, "error")
        if (data.alert) {
          setMessage("⚠️ Visage non reconnu — Alerte envoyée à l'administrateur")
          setStep(STEPS.DONE)
        } else {
          setMessage(`Visage non reconnu: ${data.reason}`)
        }
      }
    } catch {
      addLog("Serveur hors-ligne, mode simulation", "warning")
      const score = parseFloat((Math.random() * 0.15 + 0.2).toFixed(4))
      const ok = score < 0.48
      if (ok) {
        setFaceOk(true)
        setFaceScore(score)
        addLog(`Visage reconnu (simulation, score: ${score})`, "success")
        setMessage("✅ Pointage enregistré avec succès !")
        setStep(STEPS.DONE)
        await recordPointage(score)
      } else {
        addLog("Visage non reconnu (simulation) — alerte simulée", "error")
        setMessage("⚠️ Visage non reconnu — Alerte envoyée à l'administrateur")
        setStep(STEPS.DONE)
      }
    } finally {
      setLoading(false)
    }
  }

  function resetAll() {
    setSelected(null)
    setSearch("")
    setStep(STEPS.QR)
    setQrOk(false)
    setFaceOk(false)
    setFaceScore(null)
    setMessage("")
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>TERMINAL INTELLIGENT</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur</span>
          </div>
        </header>

        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Terminal de Pointage Intelligent</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>
            Double vérification : QR Code + Reconnaissance Faciale
          </p>
          <div style={styles.divider}></div>

          {/* Step indicator */}
          <div style={styles.stepsRow}>
            <div style={{ ...styles.step, borderColor: qrOk ? 'var(--success)' : step === STEPS.QR ? 'var(--primary)' : 'var(--border)', opacity: step === STEPS.QR || qrOk ? 1 : 0.4 }}>
              <span style={styles.stepNum}>1</span>
              <span>Scan QR</span>
              {qrOk && <span style={{ color: 'var(--success)' }}>✓</span>}
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={{ ...styles.step, borderColor: faceOk ? 'var(--success)' : step === STEPS.FACE ? 'var(--primary)' : 'var(--border)', opacity: step === STEPS.FACE || faceOk ? 1 : 0.4 }}>
              <span style={styles.stepNum}>2</span>
              <span>Reconnaissance Faciale</span>
              {faceOk && <span style={{ color: 'var(--success)' }}>✓</span>}
            </div>
            <div style={styles.stepArrow}>→</div>
            <div style={{ ...styles.step, borderColor: step === STEPS.DONE ? 'var(--success)' : 'var(--border)', opacity: step === STEPS.DONE ? 1 : 0.4 }}>
              <span style={styles.stepNum}>3</span>
              <span>Pointage ✓</span>
            </div>
          </div>

          <div style={styles.mainGrid}>
            {/* Left Panel: Employee Selection + Controls */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>SÉLECTION EMPLOYÉ</h3>

              <input
                style={styles.searchInput}
                placeholder="Rechercher un employé..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <div style={styles.empList}>
                {filtered.map(emp => (
                  <div
                    key={emp.id}
                    style={{
                      ...styles.empItem,
                      borderColor: selected?.id === emp.id ? 'var(--primary)' : 'transparent',
                      backgroundColor: selected?.id === emp.id ? 'rgba(6,182,212,0.08)' : 'transparent'
                    }}
                    onClick={() => { setSelected(emp); setSearch("") }}
                  >
                    <div style={styles.empAvatar}>
                      {emp.prenom?.[0]}{emp.nom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{emp.prenom} {emp.nom}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Aucun employé trouvé</p>
                )}
              </div>

              {selected && (
                <div style={styles.selectedCard}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Employé sélectionné</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{selected.prenom} {selected.nom}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected.email}</div>
                </div>
              )}

              <div style={styles.controlsRow}>
                <button
                  style={{ ...styles.actionBtn, opacity: !selected || loading || qrOk ? 0.5 : 1 }}
                  disabled={!selected || loading || qrOk}
                  onClick={handleScanQR}
                >
                  {qrOk ? "✓ QR Validé" : loading && step === STEPS.QR ? "Scan..." : "Scanner QR"}
                </button>
                <button
                  style={{ ...styles.actionBtn, opacity: !qrOk || loading || faceOk ? 0.5 : 1, backgroundColor: 'var(--success)' }}
                  disabled={!qrOk || loading || faceOk}
                  onClick={handleScanFace}
                >
                  {faceOk ? "✓ Visage Reconnu" : loading && step === STEPS.FACE ? "Analyse..." : "Scanner Visage"}
                </button>
              </div>

              {message && (
                <div style={{
                  ...styles.messageBox,
                  backgroundColor: step === STEPS.DONE ? 'rgba(16,185,129,0.1)' : message.includes('refusé') ? 'rgba(239,68,68,0.1)' : 'rgba(6,182,212,0.1)',
                  borderColor: step === STEPS.DONE ? 'var(--success)' : message.includes('refusé') ? 'var(--danger)' : 'var(--primary)',
                  color: step === STEPS.DONE ? 'var(--success)' : message.includes('refusé') ? 'var(--danger)' : 'var(--text-main)'
                }}>
                  {message}
                </div>
              )}

              {step === STEPS.DONE && (
                <button style={styles.resetBtn} onClick={resetAll}>
                  Nouveau Pointage
                </button>
              )}
            </div>

            {/* Right Panel: Visualization + Logs */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>TERMINAL ESP32</h3>

              <div style={styles.viewfinder}>
                {!selected && (
                  <div style={styles.placeholder}>
                    <span style={{ fontSize: '60px' }}>🔲</span>
                    <p>Sélectionnez un employé</p>
                  </div>
                )}

                {selected && !qrOk && step === STEPS.QR && (
                  <div style={styles.placeholder}>
                    <span style={{ fontSize: '60px', animation: 'pulse 2s infinite' }}>📱</span>
                    <p>En attente scan QR...</p>
                    <div style={styles.laserLine} />
                  </div>
                )}

                {selected && qrOk && !faceOk && (
                  <div style={styles.placeholder}>
                    <span style={{ fontSize: '60px', animation: 'pulse 2s infinite' }}>👤</span>
                    <p>Regardez la caméra...</p>
                    <div style={{ ...styles.laserLine, background: 'linear-gradient(to bottom, transparent, var(--success), transparent)' }} />
                  </div>
                )}

                {selected && qrOk && faceOk && (
                  <div style={{ ...styles.placeholder, borderColor: 'var(--success)' }}>
                    <span style={{ fontSize: '70px' }}>🟢</span>
                    <p style={{ color: 'var(--success)', fontWeight: 700 }}>POINTAGE VALIDÉ</p>
                    {faceScore && <p style={{ fontSize: '11px', margin: 0 }}>Score facial: {faceScore.toFixed(4)}</p>}
                  </div>
                )}

                {selected && (
                  <div style={styles.terminalInfo}>
                    <div><span>Employé:</span> <strong>{selected.prenom} {selected.nom}</strong></div>
                    <div><span>QR:</span> <span style={{ color: qrOk ? 'var(--success)' : 'var(--text-muted)' }}>{qrOk ? 'Validé ✓' : 'En attente'}</span></div>
                    <div><span>Visage:</span> <span style={{ color: faceOk ? 'var(--success)' : 'var(--text-muted)' }}>{faceOk ? 'Reconnu ✓' : 'En attente'}</span></div>
                    <div><span>Statut:</span> <span style={{ color: step === STEPS.DONE ? 'var(--success)' : 'var(--text-muted)' }}>{step === STEPS.DONE ? 'Terminé' : step === STEPS.QR ? 'Scan QR' : 'Scan Visage'}</span></div>
                  </div>
                )}
              </div>

              {/* Log Console */}
              <div style={styles.logConsole}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Console</div>
                {log.map((l, i) => (
                  <div key={i} style={styles.logLine}>
                    <span style={styles.logTime}>{l.time}</span>
                    <span style={{
                      ...styles.logBadge,
                      color: l.type === 'success' ? 'var(--success)' : l.type === 'error' ? 'var(--danger)' : l.type === 'warning' ? '#f59e0b' : 'var(--text-muted)'
                    }}>{l.type.toUpperCase()}</span>
                    <span style={{ fontSize: '11px' }}>{l.msg}</span>
                  </div>
                ))}
                {log.length === 0 && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>En attente d'opérations...</p>}
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
  divider: { height: '1px', backgroundColor: 'var(--border)', margin: '20px 0 25px 0' },

  stepsRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' },
  step: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', border: '2px solid', fontSize: '12px', fontWeight: 600, backgroundColor: 'var(--bg-card)', transition: 'all 0.3s' },
  stepNum: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 },
  stepArrow: { color: 'var(--text-muted)', fontSize: '18px', fontWeight: 300 },

  mainGrid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: '340px', backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' },
  panelTitle: { color: 'var(--text-main)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', fontFamily: 'var(--font-heading)' },

  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  empList: { maxHeight: '220px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  empItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  empAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 },

  selectedCard: { padding: '12px', backgroundColor: 'rgba(6,182,212,0.05)', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.15)', marginBottom: '16px' },
  controlsRow: { display: 'flex', gap: '10px', marginBottom: '12px' },
  actionBtn: { flex: 1, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  messageBox: { padding: '10px 14px', borderRadius: '10px', border: '1px solid', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '12px' },
  resetBtn: { width: '100%', padding: '12px', border: '2px solid var(--success)', borderRadius: '10px', backgroundColor: 'transparent', color: 'var(--success)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },

  viewfinder: { position: 'relative', height: '300px', backgroundColor: 'var(--bg-app)', border: '2px solid var(--border)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: '2px dashed var(--border)', borderRadius: '12px', padding: '30px', backgroundColor: 'rgba(0,0,0,0.1)' },
  laserLine: { position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to bottom, transparent, var(--primary), transparent)', animation: 'scan 2.5s linear infinite' },
  terminalInfo: { position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px', fontSize: '11px', color: '#fff' },

  logConsole: { backgroundColor: '#0c1929', borderRadius: '10px', padding: '14px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'monospace' },
  logLine: { display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  logTime: { fontSize: '10px', color: '#64748b', flexShrink: 0 },
  logBadge: { fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }
}
