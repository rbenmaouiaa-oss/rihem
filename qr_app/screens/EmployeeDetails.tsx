import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

// ─── Palette ────────────────────────────────────────────────────────────────
const BG        = '#030712'
const ACCENT    = '#06b6d4'
const CARD_BG   = 'rgba(15,23,42,0.8)'
const CARD_BORDER = 'rgba(255,255,255,0.07)'
const TEXT_PRI  = '#f9fafb'
const TEXT_SEC  = '#94a3b8'
const TEXT_MUT  = '#64748b'
const GREEN     = '#10b981'
const AMBER     = '#f59e0b'

// ─── Types ───────────────────────────────────────────────────────────────────
type UserProfile = {
  id: string
  nom: string
  prenom: string
  email: string
  phone?: string
  cin?: string
  poste?: string
  role?: string
  department_id?: string
  branch_id?: string
  departments?: { name: string }
  branches?: { name: string }
}

type AttendanceSummary = {
  totalCheckIns: number
  lastCheckIn: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EmployeeDetails({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary>({ totalCheckIns: 0, lastCheckIn: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Fetch user profile with department and branch
      const { data: dbUser } = await supabase
        .from('users')
        .select('*, departments(*), branches(*)')
        .eq('email', user.email)
        .single()

      if (dbUser) {
        setProfile(dbUser)

        // Attendance summary – last 30 days
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('employee_id', dbUser.id)
          .eq('type', 'check_in')
          .gte('date', since)
          .order('created_at', { ascending: false })

        if (logs) {
          setSummary({
            totalCheckIns: logs.length,
            lastCheckIn: logs[0]?.created_at ?? null,
          })
        }
      }
    } catch (e) {
      console.error('fetchAll error', e)
    }
    setLoading(false)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getInitials = (p: UserProfile) =>
    `${(p.prenom?.[0] ?? '').toUpperCase()}${(p.nom?.[0] ?? '').toUpperCase()}`

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  // ── Info rows config ─────────────────────────────────────────────────────
  const infoRows = profile
    ? [
        { icon: 'mail-outline',        label: 'Email',       value: profile.email ?? '—' },
        { icon: 'call-outline',         label: 'Téléphone',   value: profile.phone ?? '—' },
        { icon: 'card-outline',         label: 'CIN',         value: profile.cin ?? '—' },
        { icon: 'briefcase-outline',    label: 'Poste',       value: profile.poste ?? '—' },
        { icon: 'business-outline',     label: 'Département', value: (profile.departments as any)?.name ?? '—' },
        { icon: 'location-outline',     label: 'Agence',      value: (profile.branches as any)?.name ?? '—' },
      ]
    : []

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loaderRoot}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loaderText}>Chargement du profil…</Text>
      </View>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={TEXT_PRI} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Informations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── HERO PROFILE CARD ── */}
        <View style={styles.heroCard}>
          {/* Glow accent top-right */}
          <View style={styles.heroGlow} />

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {profile ? getInitials(profile) : '??'}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.heroName}>
            {profile ? `${profile.prenom} ${profile.nom}` : '—'}
          </Text>

          {/* Role badge */}
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={12} color={ACCENT} style={{ marginRight: 5 }} />
            <Text style={styles.roleBadgeText}>
              {profile?.role ?? 'Employé'}
            </Text>
          </View>

          {/* Department + Branch chips */}
          <View style={styles.chipRow}>
            {(profile?.departments as any)?.name && (
              <View style={styles.chip}>
                <Ionicons name="business-outline" size={12} color={TEXT_SEC} />
                <Text style={styles.chipText}>{(profile.departments as any).name}</Text>
              </View>
            )}
            {(profile?.branches as any)?.name && (
              <View style={styles.chip}>
                <Ionicons name="location-outline" size={12} color={TEXT_SEC} />
                <Text style={styles.chipText}>{(profile.branches as any).name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── INFO SECTION ── */}
        <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>
        <View style={styles.card}>
          {infoRows.map((row, idx) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                idx < infoRows.length - 1 && styles.infoRowBorder,
              ]}
            >
              <View style={styles.infoIconWrap}>
                <Ionicons name={row.icon as any} size={18} color={ACCENT} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── ATTENDANCE SUMMARY ── */}
        <Text style={styles.sectionLabel}>RÉSUMÉ DES PRÉSENCES (30 DERNIERS JOURS)</Text>
        <View style={styles.card}>
          {/* Total check-ins */}
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={GREEN} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Total Pointages</Text>
              <Text style={[styles.infoValue, { color: GREEN, fontWeight: '800' }]}>
                {summary.totalCheckIns} check-in{summary.totalCheckIns !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Last check-in */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Ionicons name="time-outline" size={18} color={AMBER} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Dernier Pointage</Text>
              <Text style={[styles.infoValue, { color: AMBER }]}>
                {summary.lastCheckIn ? formatDateTime(summary.lastCheckIn) : 'Aucun pointage enregistré'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── ACTIVITY INDICATOR DOTS ── */}
        <View style={styles.activityRow}>
          <View style={[styles.dot, { backgroundColor: GREEN }]} />
          <Text style={styles.activityText}>Compte actif et synchronisé</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  loaderRoot: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: TEXT_MUT,
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
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

  // ── Scroll ──
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Hero card ──
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${ACCENT}18`,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: `${ACCENT}50`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: `${ACCENT}10`,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${ACCENT}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: ACCENT,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroName: {
    color: TEXT_PRI,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ACCENT}15`,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
    marginBottom: 16,
  },
  roleBadgeText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  chipText: {
    color: TEXT_SEC,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Section label ──
  sectionLabel: {
    color: TEXT_MUT,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },

  // ── Info card ──
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 24,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: `${ACCENT}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: TEXT_MUT,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    color: TEXT_PRI,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Activity indicator ──
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activityText: {
    color: TEXT_MUT,
    fontSize: 12,
    fontWeight: '500',
  },
})