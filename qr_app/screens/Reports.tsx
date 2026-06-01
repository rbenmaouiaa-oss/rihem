import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

// ─── Palette ────────────────────────────────────────────────────────────────
const BG           = '#030712'
const ACCENT       = '#06b6d4'
const CARD_BG      = 'rgba(15,23,42,0.8)'
const CARD_BORDER  = 'rgba(255,255,255,0.07)'
const TEXT_PRI     = '#f9fafb'
const TEXT_SEC     = '#94a3b8'
const TEXT_MUT     = '#64748b'
const GREEN        = '#10b981'
const AMBER        = '#f59e0b'
const RED          = '#ef4444'

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterKey = 'month' | 'week' | 'all'

type LogEntry = {
  id: string
  date: string
  created_at: string
  type: 'check_in' | 'check_out'
  status?: string
  employee_id?: string
}

type KPI = {
  present: number
  late: number
  absent: number
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Reports({ navigation }: any) {
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [kpi, setKpi]           = useState<KPI>({ present: 0, late: 0, absent: 0 })
  const [filter, setFilter]     = useState<FilterKey>('month')
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)

  // ── Resolve logged-in user once ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()
      if (dbUser) setUserId(dbUser.id)
    })()
  }, [])

  // ── Re-fetch whenever filter or userId changes ────────────────────────────
  useEffect(() => {
    if (userId) fetchLogs(userId, filter)
  }, [userId, filter])

  const fetchLogs = async (uid: string, f: FilterKey) => {
    setLoading(true)
    try {
      const now   = new Date()
      let since   = ''

      if (f === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        since = start.toISOString().split('T')[0]
      } else if (f === 'week') {
        const day   = now.getDay()
        const diff  = (day === 0 ? -6 : 1 - day) // Monday
        const start = new Date(now)
        start.setDate(now.getDate() + diff)
        since = start.toISOString().split('T')[0]
      }
      // 'all' → no since filter

      let query = supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', uid)
        .order('created_at', { ascending: false })
        .limit(15)

      if (since) query = query.gte('date', since)

      const { data } = await query

      const allLogs: LogEntry[] = data ?? []
      setLogs(allLogs)

      // ── KPI computation ──────────────────────────────────────────────────
      const checkIns = allLogs.filter(l => l.type === 'check_in')
      const presentDays = new Set(checkIns.map(l => l.date)).size
      const lateDays    = checkIns.filter(l => l.status === 'late').length

      // Working days in period (rough)
      let workingDays = 0
      if (f === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        // Count Mon-Fri
        for (let d = 1; d <= Math.min(now.getDate(), daysInMonth); d++) {
          const day = new Date(now.getFullYear(), now.getMonth(), d).getDay()
          if (day !== 0 && day !== 6) workingDays++
        }
      } else if (f === 'week') {
        workingDays = Math.min(now.getDay() === 0 ? 5 : now.getDay(), 5)
      } else {
        workingDays = presentDays + Math.max(0, presentDays * 0.2)
      }

      const absentDays = Math.max(0, workingDays - presentDays)

      setKpi({ present: presentDays, late: lateDays, absent: Math.round(absentDays) })
    } catch (e) {
      console.error('fetchLogs error', e)
    }
    setLoading(false)
  }

  // ── Format helpers ────────────────────────────────────────────────────────
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  // ── Render a single log row ───────────────────────────────────────────────
  const renderLog = useCallback(({ item, index }: { item: LogEntry; index: number }) => {
    const isCheckIn   = item.type === 'check_in'
    const isLate      = item.status === 'late'
    const typeColor   = isCheckIn ? GREEN : ACCENT
    const typeBg      = isCheckIn ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)'
    const statusColor = isLate ? AMBER : GREEN
    const statusBg    = isLate ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'

    return (
      <View style={[styles.logRow, index % 2 === 1 && styles.logRowAlt]}>
        {/* Left: date+time */}
        <View style={styles.logLeft}>
          <Text style={styles.logDate}>{fmtDate(item.date ?? item.created_at)}</Text>
          <Text style={styles.logTime}>
            <Ionicons name="time-outline" size={11} color={TEXT_MUT} /> {fmtTime(item.created_at)}
          </Text>
        </View>

        {/* Right: badges */}
        <View style={styles.logRight}>
          {/* Type badge */}
          <View style={[styles.badge, { backgroundColor: typeBg, borderColor: `${typeColor}30` }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>
              {isCheckIn ? 'Entrée' : 'Sortie'}
            </Text>
          </View>
          {/* Status badge */}
          <View style={[styles.badge, { backgroundColor: statusBg, borderColor: `${statusColor}30` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {isLate ? 'Retard' : 'Présent'}
            </Text>
          </View>
        </View>
      </View>
    )
  }, [])

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="calendar-outline" size={36} color={TEXT_MUT} />
      </View>
      <Text style={styles.emptyTitle}>Aucun pointage trouvé</Text>
      <Text style={styles.emptySub}>Aucun enregistrement pour cette période.</Text>
    </View>
  )

  // ── Filter pills ──────────────────────────────────────────────────────────
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'month', label: 'Ce Mois' },
    { key: 'week',  label: 'Semaine' },
    { key: 'all',   label: 'Tout'    },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={TEXT_PRI} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rapports de Présence</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── FILTER PILLS ── */}
      <View style={styles.filterRow}>
        {filters.map(f => {
          const active = filter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── KPI CARDS ── */}
      <View style={styles.kpiRow}>
        {/* Présent */}
        <View style={[styles.kpiCard, { borderColor: `${GREEN}30` }]}>
          <View style={[styles.kpiIcon, { backgroundColor: `${GREEN}15` }]}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
          </View>
          <Text style={[styles.kpiNum, { color: GREEN }]}>{kpi.present}</Text>
          <Text style={styles.kpiLabel}>Jours Présent</Text>
        </View>

        {/* Retards */}
        <View style={[styles.kpiCard, { borderColor: `${AMBER}30` }]}>
          <View style={[styles.kpiIcon, { backgroundColor: `${AMBER}15` }]}>
            <Ionicons name="time" size={20} color={AMBER} />
          </View>
          <Text style={[styles.kpiNum, { color: AMBER }]}>{kpi.late}</Text>
          <Text style={styles.kpiLabel}>Retards</Text>
        </View>

        {/* Absences */}
        <View style={[styles.kpiCard, { borderColor: `${RED}30` }]}>
          <View style={[styles.kpiIcon, { backgroundColor: `${RED}15` }]}>
            <Ionicons name="close-circle" size={20} color={RED} />
          </View>
          <Text style={[styles.kpiNum, { color: RED }]}>{kpi.absent}</Text>
          <Text style={styles.kpiLabel}>Absences</Text>
        </View>
      </View>

      {/* ── LOG LIST ── */}
      <Text style={styles.sectionLabel}>HISTORIQUE RÉCENT</Text>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loaderText}>Chargement des données…</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderLog}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            logs.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={[styles.listHeaderCell, { flex: 2 }]}>DATE / HEURE</Text>
                <Text style={[styles.listHeaderCell, { flex: 1, textAlign: 'right' }]}>TYPE / STATUT</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
    backgroundColor: BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT_PRI,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Filter pills ──
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  pill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: `${ACCENT}18`,
    borderColor: `${ACCENT}50`,
  },
  pillText: {
    color: TEXT_MUT,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: ACCENT,
  },

  // ── KPI cards ──
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiNum: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  kpiLabel: {
    color: TEXT_MUT,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ── Section label ──
  sectionLabel: {
    color: TEXT_MUT,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 20,
    marginBottom: 8,
  },

  // ── FlatList ──
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  listHeaderCell: {
    color: TEXT_MUT,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Log row ──
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  logRowAlt: {
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  logLeft: {
    flex: 1,
    gap: 3,
  },
  logDate: {
    color: TEXT_PRI,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  logTime: {
    color: TEXT_MUT,
    fontSize: 12,
    fontWeight: '500',
  },
  logRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Empty state ──
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: TEXT_SEC,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    color: TEXT_MUT,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // ── Loader ──
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    color: TEXT_MUT,
    fontSize: 14,
    fontWeight: '500',
  },
})