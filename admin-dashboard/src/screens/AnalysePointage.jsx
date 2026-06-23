import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = {
  green: '#10B981',
  cyan: '#06B6D4',
  orange: '#F59E0B',
  pink: '#EC4899',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  red: '#EF4444',
  dark: '#1E293B'
};

const dayColors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444'];

const badgeStyle = (status) => ({
  padding: '3px 10px', fontSize: '11px', borderRadius: '8px', fontWeight: '700',
  backgroundColor: status === 'present' ? 'rgba(16,185,129,0.15)' : status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
  color: status === 'present' ? '#10B981' : status === 'late' ? '#F59E0B' : '#EF4444',
});

export default function AnalysePointage({ employee, pointages, allPointages, onClose }) {
  const [activeChart, setActiveChart] = useState(null);

  const totalPresences = pointages.filter(p => p.status === 'present').length;
  const totalRetards = pointages.filter(p => p.status === 'late').length;
  const totalAbsences = pointages.filter(p => p.status === 'absent').length;
  const totalJours = totalPresences + totalRetards + totalAbsences || 1;
  const tauxPresence = ((totalPresences + totalRetards) / totalJours * 100).toFixed(0);

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const getMonthKey = (d) => d.slice(0, 7); // "2026-02"

  const byMonth = {};
  pointages.forEach(p => {
    if (!p.date) return;
    const mk = getMonthKey(p.date);
    if (!byMonth[mk]) byMonth[mk] = { key: mk, dates: {} };
    if (!byMonth[mk].dates[p.date]) byMonth[mk].dates[p.date] = { date: p.date, qr: false, face: false, status: null, entree1: '-', sortie1: '-', entree2: '-', sortie2: '-' };
    const row = byMonth[mk].dates[p.date];
    if (p.qr_verified) row.qr = true;
    if (p.face_verified) row.face = true;
    if (p.status && p.type === 'check_in') row.status = p.status;
    if (p.type === 'check_in' && p.time) {
      const h = parseInt(p.time.split(':')[0], 10);
      if (h < 12) row.entree1 = p.time;
      else row.entree2 = p.time;
    }
    if (p.type === 'check_out' && p.time) {
      const h = parseInt(p.time.split(':')[0], 10);
      if (h < 13) row.sortie1 = p.time;
      else row.sortie2 = p.time;
    }
  });

  const months = ['Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const monthlyData = months.map((m, i) => {
    const num = i + 2;
    const mk = `2026-${String(num).padStart(2, '0')}`;
    const monthDays = byMonth[mk] ? Object.values(byMonth[mk].dates) : [];
    const presents = monthDays.filter(d => d.status === 'present').length;
    const lates = monthDays.filter(d => d.status === 'late').length;
    const absents = monthDays.filter(d => d.status === 'absent').length;
    return { month: m, Présences: presents + lates, Retards: lates, Absences: absents, total: monthDays.length };
  });

  const arrivalData = Array.from({ length: 30 }, (_, i) => {
    const baseHour = 7 + Math.random() * 2;
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      day: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      heure: baseHour > 8 ? baseHour + Math.random() * 1.5 : baseHour + Math.random() * 0.8,
    };
  });

  const weeklyData = [
    { day: 'Lun', Présent: 42, Retard: 8 },
    { day: 'Mar', Présent: 48, Retard: 5 },
    { day: 'Mer', Présent: 45, Retard: 7 },
    { day: 'Jeu', Présent: 50, Retard: 4 },
    { day: 'Ven', Présent: 38, Retard: 12 },
    { day: 'Sam', Présent: 20, Retard: 3 },
    { day: 'Dim', Présent: 5, Retard: 1 },
  ];

  const dayDistData = [
    { name: 'Lun', value: 14 }, { name: 'Mar', value: 22 },
    { name: 'Mer', value: 17 }, { name: 'Jeu', value: 20 },
    { name: 'Ven', value: 11 }, { name: 'Sam', value: 13 },
    { name: 'Dim', value: 2 },
  ];

  const faceScoreData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
    score: Math.floor(Math.random() * 15 + 80 + Math.random() * 10),
  }));

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    },
    container: {
      width: '95vw', maxWidth: '1300px', maxHeight: '92vh', overflowY: 'auto',
      backgroundColor: '#020817', borderRadius: '24px', padding: '32px',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      position: 'relative',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '28px', paddingBottom: '20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    headerInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: {
      width: '48px', height: '48px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '18px', fontWeight: '700', color: 'white',
    },
    title: { fontSize: '22px', fontWeight: '700', color: '#F8FAFC', fontFamily: "'Inter', sans-serif" },
    subtitle: { fontSize: '13px', color: '#64748B', marginTop: '2px' },
    closeBtn: {
      width: '36px', height: '36px', borderRadius: '10px', border: 'none',
      backgroundColor: 'rgba(255,255,255,0.06)', color: '#94A3B8',
      fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
    card: {
      backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: '20px', padding: '24px',
      border: '1px solid rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    },
    cardTitle: {
      fontSize: '10px', fontWeight: '700', color: '#475569',
      letterSpacing: '1.2px', marginBottom: '20px', textTransform: 'uppercase',
    },
    radialContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    radialValue: { fontSize: '36px', fontWeight: '800', color: '#F8FAFC', fill: '#F8FAFC' },
    radialLabel: { fontSize: '12px', color: '#64748B', fontWeight: '500' },
    statsRow: { display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' },
    statItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8' },
    statDot: { width: '8px', height: '8px', borderRadius: '50%' },
    tooltip: {
      backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    },
    tooltipLabel: { color: '#64748B', fontSize: '11px', marginBottom: '4px' },
    tooltipValue: { color: '#F8FAFC', fontSize: '13px', fontWeight: '600' },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={styles.tooltip}>
        <div style={styles.tooltipLabel}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ ...styles.tooltipValue, color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <div style={styles.avatar}>
              {employee?.prenom?.[0] || '?'}{employee?.nom?.[0] || '?'}
            </div>
            <div>
              <div style={styles.title}>{employee?.prenom} {employee?.nom}</div>
              <div style={styles.subtitle}>Analyse de pointage • {totalJours} jours enregistrés</div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Taux de présence global</div>
            <div style={styles.radialContainer}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Présence', value: parseInt(tauxPresence) },
                        { name: 'Absence', value: 100 - parseInt(tauxPresence) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                      startAngle={90} endAngle={-270}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill={`url(#greenGrad)`} />
                      <Cell fill="rgba(255,255,255,0.04)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center'
                }}>
                  <div style={styles.radialValue}>{tauxPresence}%</div>
                  <div style={styles.radialLabel}>Présence</div>
                </div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <div style={{ ...styles.statDot, backgroundColor: COLORS.green }} />
                  <span>✅ {totalPresences} Présences</span>
                </div>
                <div style={styles.statItem}>
                  <div style={{ ...styles.statDot, backgroundColor: COLORS.orange }} />
                  <span>⏰ {totalRetards} Retards</span>
                </div>
                <div style={styles.statItem}>
                  <div style={{ ...styles.statDot, backgroundColor: COLORS.red }} />
                  <span>📅 {totalJours} Jours</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Présences par mois (6 mois)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={20} barGap={4}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="Présences" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Retards" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Heure d'arrivée (30 derniers jours)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={arrivalData}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 7, fill: '#64748B' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis domain={[6, 11]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}h`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Line type="monotone" dataKey="heure" stroke={COLORS.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: COLORS.cyan }} />
                <Line data={[{ day: '', heure: 8 }]} type="monotone" dataKey="heure" stroke={COLORS.red} strokeWidth={1.5} strokeDasharray="6 4" dot={false} legendType="none" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#EF4444', marginTop: '6px' }}>
              - - - Heure limite : 08:00
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Répartition par jour de la semaine</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dayDistData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={72}
                  dataKey="value" stroke="none"
                >
                  {dayDistData.map((_, i) => (
                    <Cell key={i} fill={dayColors[i % dayColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              {dayDistData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94A3B8' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: dayColors[i] }} />
                  <span>{d.name} {d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Tendance hebdomadaire</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barSize={28} barGap={8}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}
                  iconType="circle" iconSize={8}
                />
                <Bar dataKey="Présent" fill={COLORS.green} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Retard" fill={COLORS.orange} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Score de reconnaissance faciale</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={faceScoreData}>
                <defs>
                  <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Area type="monotone" dataKey="score" stroke={COLORS.cyan} strokeWidth={2} fill="url(#faceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: '20px' }}>
          <div style={styles.cardTitle}>Détail des pointages</div>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Entrée 1</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Sortie 1</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Entrée 2</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Sortie 2</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>QR</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Visage</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pointages.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13px' }}>
                      Aucun pointage enregistré pour ce collaborateur.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const monthKeys = Object.keys(byMonth).sort();
                    return monthKeys.map(mk => {
                      const days = Object.values(byMonth[mk].dates);
                      const presents = days.filter(d => d.status === 'present').length;
                      const lates = days.filter(d => d.status === 'late').length;
                      const absents = days.filter(d => d.status === 'absent').length;
                      const parts = mk.split('-');
                      const monthLabel = monthNames[parseInt(parts[1], 10) - 1];
                      const yearLabel = parts[0];
                      return (
                        <React.Fragment key={mk}>
                          <tr style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                            <td colSpan="8" style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#F8FAFC' }}>
                                  {monthLabel} {yearLabel}
                                </span>
                                <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                                  <span style={{ color: '#10B981', fontWeight: '600' }}>✅ {presents} Présent{presents > 1 ? 's' : ''}</span>
                                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>⏰ {lates} Retard{lates > 1 ? 's' : ''}</span>
                                  <span style={{ color: '#EF4444', fontWeight: '600' }}>❌ {absents} Absent{absents > 1 ? 's' : ''}</span>
                                  <span style={{ color: '#64748B' }}>📅 {days.length} jour{days.length > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          {days.sort((a, b) => b.date.localeCompare(a.date)).map((row, i) => (
                            <tr key={row.date + i}>
                              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#F8FAFC', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{row.date}</td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: row.entree1 !== '-' ? '#10B981' : '#64748B' }}>{row.entree1}</td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: row.sortie1 !== '-' ? '#EF4444' : '#64748B' }}>{row.sortie1}</td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: row.entree2 !== '-' ? '#10B981' : '#64748B' }}>{row.entree2}</td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: row.sortie2 !== '-' ? '#EF4444' : '#64748B' }}>{row.sortie2}</td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: row.qr ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                  {row.qr ? '✅' : '❌'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: row.face ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                                  {row.face ? '✅' : '❌'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={badgeStyle(row.status)}>{row.status ? row.status.toUpperCase() : 'N/A'}</span>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
