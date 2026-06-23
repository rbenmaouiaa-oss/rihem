import React, { useState, useEffect } from "react"
import { supabase } from "../supabase"
import { useNavigate } from "react-router-dom"
import Sidebar from '../Sidebar'
import { QRCode } from "react-qr-code"

export default function QrBadge() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    const email = localStorage.getItem('email')
    if (!email) return
    const { data: userData } = await supabase.from('users').select('company_id').eq('email', email).single()
    if (!userData) return
    const { data } = await supabase.from('users').select('*').eq('company_id', userData.company_id).eq('status', 'active')
    if (data) setEmployees(data)
  }

  const filtered = employees.filter(e =>
    `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  )

  async function generateQrCode(emp) {
    setLoading(true)
    const qrToken = crypto.randomUUID()
    const { error } = await supabase.from('users').update({ qr_code: qrToken }).eq('id', emp.id)
    if (error) {
      setMessage(`Erreur: ${error.message}`)
    } else {
      setMessage(`QR code généré pour ${emp.prenom} ${emp.nom}`)
      loadEmployees()
      setSelected({ ...emp, qr_code: qrToken })
    }
    setLoading(false)
  }

  async function regenerateQrCode(emp) {
    if (!confirm(`Régénérer le QR code pour ${emp.prenom} ${emp.nom} ? L'ancien badge ne fonctionnera plus.`)) return
    await generateQrCode(emp)
  }

  function printBadge() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Badge ${selected.prenom} ${selected.nom}</title>
<style>
  @page { margin: 0; size: 85mm 54mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
  .badge { width: 85mm; height: 54mm; border: 2px solid #1e293b; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 12px; background: #fff; }
  .qr { flex-shrink: 0; }
  .info { flex: 1; }
  .info h2 { font-size: 16px; margin-bottom: 2px; color: #0f172a; }
  .info .role { font-size: 10px; color: #06b6d4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .info .email { font-size: 9px; color: #64748b; margin-top: 4px; }
  .info .id { font-size: 8px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
  .footer { position: absolute; bottom: 4px; right: 8px; font-size: 7px; color: #cbd5e1; }
</style>
</head>
<body>
  <div class="badge">
    <div class="qr">${document.getElementById('qr-badge-print').innerHTML}</div>
    <div class="info">
      <h2>${selected.prenom} ${selected.nom}</h2>
      <div class="role">${selected.role || 'Employé'}</div>
      <div class="email">${selected.email || ''}</div>
      <div class="id">ID: ${selected.id?.slice(0, 8) || ''}</div>
    </div>
    <div class="footer">Aca Robotics</div>
  </div>
  <script>window.print()</scr` + `ipt>
</body>
</html>`)
    w.document.close()
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={styles.headerTitle}>L'AVANCE</h2>
            <span style={styles.badgeHeader}>BADGES QR</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>A</div>
            <span>Administrateur</span>
          </div>
        </header>

        <div style={styles.content}>
          <h2 style={styles.pageTitle}>Génération de Badges QR</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>
            Créez des badges QR uniques pour vos employés
          </p>
          <div style={styles.divider}></div>

          {message && (
            <div style={{ ...styles.alert, backgroundColor: message.includes('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderColor: message.includes('Erreur') ? 'var(--danger)' : 'var(--success)', color: message.includes('Erreur') ? 'var(--danger)' : 'var(--success)' }}>
              {message}
              <button onClick={() => setMessage("")} style={styles.alertClose}>✕</button>
            </div>
          )}

          <div style={styles.grid}>
            {/* Left: Employee List */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>EMPLOYÉS</h3>
              <input style={styles.searchInput} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={styles.list}>
                {filtered.map(emp => (
                  <div key={emp.id} style={{ ...styles.item, borderColor: selected?.id === emp.id ? 'var(--primary)' : 'transparent', backgroundColor: selected?.id === emp.id ? 'rgba(6,182,212,0.08)' : 'transparent' }}>
                    <div style={{ flex: 1 }} onClick={() => setSelected(emp)}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{emp.prenom} {emp.nom}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                      <div style={{ fontSize: '10px', color: emp.qr_code ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                        {emp.qr_code ? '✓ QR assigné' : '✗ Pas de QR'}
                      </div>
                    </div>
                    <button
                      style={emp.qr_code ? styles.btnSmallOutline : styles.btnSmall}
                      onClick={() => generateQrCode(emp)}
                      disabled={loading}
                    >
                      {emp.qr_code ? 'Régénérer' : 'Générer'}
                    </button>
                  </div>
                ))}
                {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Aucun employé</p>}
              </div>
            </div>

            {/* Right: QR Badge Preview */}
            <div style={styles.card}>
              <h3 style={styles.panelTitle}>APERÇU DU BADGE</h3>
              {selected ? (
                <>
                  {selected.qr_code ? (
                    <div style={styles.badgePreview} id="qr-badge-print">
                      <div style={styles.badgeInner}>
                        <div style={styles.qrContainer}>
                          <QRCode value={selected.qr_code} size={120} level="M" />
                        </div>
                        <div style={styles.badgeInfo}>
                          <h3 style={{ fontSize: '18px', margin: 0 }}>{selected.prenom} {selected.nom}</h3>
                          <div style={styles.badgeRole}>{selected.role || 'Employé'}</div>
                          <div style={styles.badgeEmail}>{selected.email}</div>
                          <div style={styles.badgeId}>ID: {selected.id?.slice(0, 8)}...</div>
                          <div style={styles.badgeToken}>Token: {selected.qr_code?.slice(0, 16)}...</div>
                        </div>
                      </div>
                      <div style={styles.badgeFooter}>Aca Robotics - Pointage Intelligent</div>
                    </div>
                  ) : (
                    <div style={styles.noQr}>
                      <span style={{ fontSize: '48px' }}>📱</span>
                      <p>{selected.prenom} {selected.nom} n'a pas encore de QR code</p>
                      <button style={styles.btnPrimary} onClick={() => generateQrCode(selected)} disabled={loading}>
                        {loading ? 'Génération...' : 'Générer son QR code'}
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                    {selected.qr_code && (
                      <>
                        <button style={styles.btnPrimary} onClick={printBadge}>
                          🖨️ Imprimer
                        </button>
                        <button style={styles.btnPrimary} onClick={() => {
                          const svg = document.querySelector('#qr-badge-print svg');
                          if (!svg) return;
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          const svgData = new XMLSerializer().serializeToString(svg);
                          img.onload = () => {
                            canvas.width = img.width * 2;
                            canvas.height = img.height * 2;
                            ctx.scale(2, 2);
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            const a = document.createElement('a');
                            a.href = canvas.toDataURL('image/png');
                            a.download = `QR_${selected.prenom}_${selected.nom}.png`;
                            a.click();
                          };
                          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                        }}>
                          📥 Télécharger QR
                        </button>
                        <button style={styles.btnOutline} onClick={() => regenerateQrCode(selected)}>
                          🔄 Régénérer
                        </button>
                        <button style={{ ...styles.btnOutline, borderColor: '#ef4444', color: '#ef4444' }} onClick={async () => {
                          if (!confirm(`Supprimer le QR code de ${selected.prenom} ${selected.nom} ?`)) return;
                          const { error } = await supabase.from('users').update({ qr_code: null }).eq('id', selected.id);
                          if (error) { setMessage(`Erreur: ${error.message}`); return; }
                          setMessage(`✓ QR code supprimé pour ${selected.prenom} ${selected.nom}`);
                          setSelected({ ...selected, qr_code: null });
                          loadEmployees();
                        }}>
                          🗑 Supprimer QR
                        </button>
                      </>
                    )}
                  </div>

                  {selected.qr_code && (
                    <div style={styles.tokenBox}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>VALEUR DU QR CODE</div>
                      <code style={styles.tokenValue}>{selected.qr_code}</code>
                      <button style={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(selected.qr_code); alert('Copié!') }}>
                        📋 Copier
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.noQr}>
                  <span style={{ fontSize: '48px' }}>👈</span>
                  <p>Sélectionnez un employé dans la liste</p>
                </div>
              )}
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
  alert: { padding: '10px 14px', borderRadius: '10px', border: '1px solid', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertClose: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' },
  grid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: '340px', backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' },
  panelTitle: { color: 'var(--text-main)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px' },
  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' },
  list: { maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
  item: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid transparent' },
  btnSmall: { padding: '6px 14px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '11px', cursor: 'pointer', flexShrink: 0 },
  btnSmallOutline: { padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', flexShrink: 0 },
  noQr: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', color: 'var(--text-muted)', textAlign: 'center' },
  badgePreview: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '2px solid #e2e8f0', color: '#0f172a' },
  badgeInner: { display: 'flex', gap: '20px', alignItems: 'center' },
  qrContainer: { backgroundColor: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 },
  badgeInfo: { flex: 1 },
  badgeRole: { fontSize: '11px', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' },
  badgeEmail: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  badgeId: { fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' },
  badgeToken: { fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' },
  badgeFooter: { fontSize: '8px', color: '#94a3b8', textAlign: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' },
  btnPrimary: { padding: '10px 20px', border: 'none', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flex: 1 },
  btnOutline: { padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'transparent', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flex: 1 },
  tokenBox: { marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' },
  tokenValue: { fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-main)', wordBreak: 'break-all', flex: 1 },
  copyBtn: { padding: '4px 10px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }
}
