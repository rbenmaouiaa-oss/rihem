import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine } from 'recharts';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const PIE_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

export default function EmployeProfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [teamMembership, setTeamMembership] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAllData();
  }, [id]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [userRes, teamRes, attendanceRes, absenceRes] = await Promise.all([
        supabase.from('users').select('*, departments(*), branches(*)').eq('id', id),
        supabase.from('team_members').select('*, teams(*)').eq('user_id', id),
        supabase.from('attendance_logs').select('*').eq('employee_id', id).order('date', { ascending: false }).limit(90),
        supabase.from('absence_requests').select('*').eq('user_id', id)
      ]);

      if (!userRes.error && userRes.data && userRes.data.length > 0) setUserData(userRes.data[0]);
      if (!teamRes.error && teamRes.data && teamRes.data.length > 0) setTeamMembership(teamRes.data[0]);
      if (!attendanceRes.error) setAttendanceLogs(attendanceRes.data || []);
      if (!absenceRes.error) setAbsenceRequests(absenceRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Chargement du profil...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: 'var(--danger)', fontSize: 18 }}>Employé non trouvé.</p>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Retour</button>
      </div>
    );
  }

  const initials = ((userData.prenom?.[0] || '') + (userData.nom?.[0] || '')).toUpperCase() || '?';
  const presences = attendanceLogs.filter(l => l.status === 'present' || l.status === 'late').length;
  const retards = attendanceLogs.filter(l => l.status === 'late').length;
  const conges = absenceRequests.filter(r => r.status === 'approved').length;
  const equipeName = teamMembership?.teams?.name || 'Non assigné';

  const checkIns = attendanceLogs.filter(l => l.type === 'check_in').sort((a, b) => a.date.localeCompare(b.date));
  const uniqueDays = new Set(attendanceLogs.map(l => l.date)).size;
  const attendanceRate = uniqueDays > 0 ? Math.round((presences / (uniqueDays * 2)) * 100) : 0;

  function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTime(t) {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) return t.substring(0, 5);
    return t;
  }

  function parseTimeToDecimal(timeStr) {
    if (!timeStr) return 8;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }

  const monthlyData = (() => {
    const map = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = { month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, present: 0, late: 0, absent: 0 };
    }
    attendanceLogs.forEach(l => {
      const d = new Date(l.date + 'T12:00:00');
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map[key]) {
        if (l.status === 'present') map[key].present++;
        else if (l.status === 'late') map[key].late++;
        else map[key].absent++;
      }
    });
    return Object.values(map);
  })();

  const timeTrendData = (() => {
    return checkIns.slice(-30).map(l => ({
      date: l.date ? l.date.slice(5) : '',
      time: parseTimeToDecimal(l.time),
      status: l.status
    }));
  })();

  const dayOfWeekData = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    attendanceLogs.forEach(l => {
      const d = new Date(l.date + 'T12:00:00');
      counts[d.getDay()]++;
    });
    return DAYS.map((name, i) => ({ name, value: counts[i] }));
  })();

  const weeklyData = (() => {
    const map = {};
    attendanceLogs.forEach(l => {
      const d = new Date(l.date + 'T12:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { week: key.slice(5), present: 0, late: 0 };
      if (l.status === 'present') map[key].present++;
      else if (l.status === 'late') map[key].late++;
    });
    return Object.values(map).slice(-8);
  })();

  const faceScoreData = (() => {
    return attendanceLogs.filter(l => l.face_score != null).slice(-20).reverse().map((l, i) => ({
      index: i + 1,
      date: l.date ? l.date.slice(5) : '',
      score: parseFloat((l.face_score * 100).toFixed(1))
    }));
  })();

  function ChartCard({ title, children, width = '100%', height = 300 }) {
    return (
      <div style={{ ...styles.chartCard, width }}>
        <h4 style={styles.chartTitle}>{title}</h4>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e2e8f0' }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ margin: 0, color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const AttendanceGauge = () => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - attendanceRate / 100);
    return (
      <div style={styles.gaugeCard}>
        <h4 style={styles.chartTitle}>Taux de Présence Global</h4>
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
          <svg width="160" height="160" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke={attendanceRate > 80 ? '#10b981' : attendanceRate > 60 ? '#f59e0b' : '#ef4444'} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="70" y="65" textAnchor="middle" fill="#e2e8f0" fontSize="28" fontWeight="bold">{attendanceRate}%</text>
            <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">PRÉSENCE</text>
          </svg>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>✅ <strong style={{ color: '#10b981' }}>{presences}</strong> prés.</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>⏰ <strong style={{ color: '#f59e0b' }}>{retards}</strong> ret.</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 <strong style={{ color: '#06b6d4' }}>{uniqueDays}</strong> jours</span>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#94a3b8', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>← Retour</button>
          <div></div>
        </header>

        <div style={styles.content}>
          <div style={styles.profileCard}>
            <div style={{ display: 'flex', gap: 20, width: '100%', flexWrap: 'wrap' }}>
              {/* Left column: Photo + Personal Information */}
              <div style={{ flex: '1 1 480px', minWidth: 320, backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {userData.image_url || userData.image || userData.photo_url ? (
                    <img src={userData.image_url || userData.image || userData.photo_url} alt="photo" style={{ width: 88, height: 88, borderRadius: 8, objectFit: 'cover', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }} />
                  ) : (
                    <div style={{ ...styles.avatarCircle, width: 88, height: 88, fontSize: 28 }}>{initials}</div>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{userData.prenom} {userData.nom}</h3>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{userData.email}</p>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>{userData.phone || 'Téléphone non renseigné'}</p>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />

                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: 14, fontWeight: 800 }}>Information personnel</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nom d'utilisateur</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.username || userData.email?.split('@')[0] || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Adresse</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.adresse || userData.address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nom</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.nom || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Téléphone professionnel</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.phone || userData.phone_pro || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Prénom</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.prenom || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Téléphone personnel</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.phone_personal || userData.phone2 || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Date naissance</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.date_naissance ? formatDate(userData.date_naissance) : userData.birthdate ? formatDate(userData.birthdate) : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Email</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.email || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Information public</div>
                    <div style={{ background: 'var(--bg-app)', padding: '12px', minHeight: 80, borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.description || userData.bio || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Right column: Coordonnées / Summary */}
              <div style={{ flex: '1 1 320px', minWidth: 300, backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: 14, fontWeight: 800 }}>Coordonnées</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Adresse</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.adresse || userData.address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Téléphone professionnel</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.phone || userData.phone_pro || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Téléphone personnel</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.phone_personal || userData.phone2 || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Email</div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-main)' }}>{userData.email || '—'}</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button style={{ padding: '10px 14px', backgroundColor: 'var(--primary)', color: 'var(--text-white)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }} onClick={() => { navigate('/admin/employees/edit/' + id); }}>Modifier le profil</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>ANALYTIQUES & TABLEAUX DE BORD</h3>
          </div>

          <div style={styles.chartsGrid}>
            <AttendanceGauge />

            <ChartCard title="Présences par Mois (6 mois)">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="present" name="Présent" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="late" name="Retard" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ChartCard>

            <ChartCard title="Heure d'Arrivée (30 derniers jours)">
              <LineChart data={timeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={[6, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="time" name="Arrivée" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
                <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '08:00', fill: '#ef4444', fontSize: 10 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Répartition par Jour de la Semaine">
              <PieChart>
                <Pie data={dayOfWeekData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {dayOfWeekData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ChartCard>

            <ChartCard title="Tendance Hebdomadaire">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="present" name="Présent" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Retard" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartCard>

            {faceScoreData.length > 0 && (
              <ChartCard title="Score de Reconnaissance Faciale" width="100%">
                <AreaChart data={faceScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" name="Score Face" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                  <Area type="monotone" dataKey="score" fill="url(#faceGrad)" />
                </AreaChart>
              </ChartCard>
            )}
          </div>

          {/* ATTENDANCE HISTORY TABLE */}
          <div style={{ ...styles.sectionHeader, marginTop: 10 }}>
            <h3 style={styles.sectionTitle}>HISTORIQUE DE PRÉSENCE (90 DERNIERS JOURS)</h3>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Heure</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>QR</th>
                  <th style={styles.th}>Face</th>
                  <th style={styles.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.length > 0 ? attendanceLogs.slice(0, 50).map((log, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{formatDate(log.date)}</td>
                    <td style={styles.td}>{formatTime(log.time || log.heure)}</td>
                    <td style={styles.td}><span style={log.type === 'check_in' ? styles.typeCheckIn : styles.typeCheckOut}>{log.type === 'check_in' ? 'Entrée' : 'Sortie'}</span></td>
                    <td style={styles.td}>{log.status}</td>
                    <td style={styles.td}>{log.qr_verified ? '✅' : log.qr_verified === false ? '❌' : '—'}</td>
                    <td style={styles.td}>{log.face_verified ? '✅' : log.face_verified === false ? '❌' : '—'}</td>
                    <td style={styles.td}>{log.face_score != null ? `${(log.face_score * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      Aucun enregistrement de présence pour cet employé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  loadingContainer: { minHeight: '100vh', backgroundColor: 'var(--bg-app)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' },
  header: { height: '70px', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--primary)', letterSpacing: '1.5px', margin: 0 },
  badgeHeader: { padding: '3px 8px', fontSize: '10px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' },
  userAvatar: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  content: { padding: '40px', animation: 'fadeInUp 0.6s ease' },
  profileCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  profileCardLeft: { display: 'flex', alignItems: 'center', gap: '25px' },
  avatarCircle: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'var(--text-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '28px', fontFamily: 'var(--font-heading)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' },
  profileName: { fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: 0 },
  profileEmail: { fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' },
  profilePhone: { fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0' },
  roleBadge: { padding: '4px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px' },
  statusActive: { padding: '4px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '20px' },
  statusArchived: { padding: '4px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fce4ec', color: '#c62828', borderRadius: '20px' },
  profileCardRight: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' },
  infoItem: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' },
  infoLabel: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' },
  infoValue: { fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionTitle: { fontSize: '20px', color: 'var(--text-main)', fontWeight: '700', fontFamily: 'var(--font-heading)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '40px' },
  chartCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chartTitle: { fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', textAlign: 'center', width: '100%' },
  gaugeCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  tableWrapper: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-app)' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'var(--transition-smooth)' },
  td: { padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' },
  typeCheckIn: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#e8f5e9', color: '#2e7d32' },
  typeCheckOut: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fff3e0', color: '#e65100' },
  absenceList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  absenceCard: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  absenceType: { fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', minWidth: '120px' },
  absenceDates: { fontSize: '13px', color: 'var(--text-muted)', flex: 1 },
  absenceStatusApproved: { padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#e8f5e9', color: '#2e7d32' },
  absenceStatusRejected: { padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fce4ec', color: '#c62828' },
  absenceStatusPending: { padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fff8e1', color: '#f57f17' }
};
