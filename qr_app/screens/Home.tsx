import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

export default function Home({ navigation }: any) {
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('Employé')
  const [showLogout, setShowLogout] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ present: 0, absent: 0, pending: 0 })

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserEmail(user.email || '')

    // Try getting from users table
    const { data: dbUser } = await supabase
      .from('users')
      .select('*, departments(*)')
      .eq('email', user.email)
      .single()

    if (dbUser) {
      setUserName(`${dbUser.prenom} ${dbUser.nom}`)
      setUserRole(dbUser.role || 'Employé')

      // Fetch quick stats
      const today = new Date().toISOString().split('T')[0]
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', dbUser.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      if (logs) {
        const presentDays = new Set(logs.filter(l => l.type === 'check_in').map(l => l.date)).size
        setStats({ present: presentDays, absent: 0, pending: 0 })
      }
    } else {
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur')
    }
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigation.replace('Login')
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const menuItems = [
    {
      id: 'badge',
      icon: 'qr-code',
      label: 'Badge Dynamique',
      sub: 'Générer votre badge sécurisé',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.1)',
      border: 'rgba(6,182,212,0.25)',
      onPress: () => navigation.navigate('GenerateQR')
    },
    {
      id: 'details',
      icon: 'person-circle',
      label: 'Mes Informations',
      sub: 'Profil et données personnelles',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.25)',
      onPress: () => navigation.navigate('EmployeeDetails')
    },
    {
      id: 'reclamation',
      icon: 'chatbubble-ellipses',
      label: 'Réclamations',
      sub: 'Soumettre un ticket RH',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.25)',
      onPress: () => navigation.navigate('Reclamation')
    },
    {
      id: 'notifications',
      icon: 'notifications',
      label: 'Notifications',
      sub: 'Alertes et messages RH',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.25)',
      onPress: () => navigation.navigate('Notifications')
    },
    {
      id: 'reports',
      icon: 'bar-chart',
      label: 'Rapports',
      sub: 'Historique de présence',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.1)',
      border: 'rgba(236,72,153,0.25)',
      onPress: () => navigation.navigate('Reports')
    }
  ]

  if (loading) {
    return (
      <View style={styles.loaderRoot}>
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text style={styles.loaderText}>Chargement du tableau de bord...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* ───── STICKY HEADER ───── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>{getGreeting()},</Text>
          <Text style={styles.headerName}>{userName || 'Utilisateur'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{userRole}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ───── PRESENCE BADGE CARD ───── */}
        <TouchableOpacity style={styles.heroBadge} onPress={() => navigation.navigate('GenerateQR')} activeOpacity={0.85}>
          <View style={styles.heroBadgeLeft}>
            <Text style={styles.heroBadgeTitle}>🎫 Badger ma présence</Text>
            <Text style={styles.heroBadgeSub}>Appuyez pour générer votre QR sécurisé</Text>
            <View style={styles.heroBadgeTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroBadgeTagText}>DOUBLE VÉRIFICATION ACTIVE</Text>
            </View>
          </View>
          <View style={styles.heroBadgeIcon}>
            <Ionicons name="qr-code" size={42} color="#06b6d4" />
          </View>
        </TouchableOpacity>

        {/* ───── QUICK STATS ───── */}
        <Text style={styles.sectionTitle}>Statistiques du mois</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>{stats.present}</Text>
            <Text style={styles.statLabel}>Jours présent</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(239,68,68,0.3)' }]}>
            <Text style={[styles.statNum, { color: '#ef4444' }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absences</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        {/* ───── MENU GRID ───── */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { backgroundColor: item.bg, borderColor: item.border }]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ───── ACCOUNT CARD ───── */}
        <View style={styles.accountCard}>
          <Ionicons name="person-circle-outline" size={32} color="#64748b" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.accountName}>{userName}</Text>
            <Text style={styles.accountEmail}>{userEmail}</Text>
          </View>
          <View style={styles.accountRoleBadge}>
            <Text style={styles.accountRoleText}>{userRole}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ───── LOGOUT MODAL ───── */}
      <Modal visible={showLogout} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={30} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalSub}>Êtes-vous sûr de vouloir vous déconnecter ?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowLogout(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={logout}>
                <Text style={styles.modalConfirmText}>Oui, déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030712' },
  loaderRoot: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#64748b', marginTop: 16, fontSize: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 18, paddingTop: 22,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  headerGreeting: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  headerName: { color: '#f9fafb', fontSize: 20, fontWeight: '900', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rolePill: { backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)' },
  rolePillText: { color: '#06b6d4', fontSize: 11, fontWeight: '800' },
  logoutBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  scroll: { padding: 22, paddingBottom: 40 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(6,182,212,0.06)', borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)', marginBottom: 28
  },
  heroBadgeLeft: { flex: 1 },
  heroBadgeTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  heroBadgeSub: { color: '#64748b', fontSize: 13, marginBottom: 12 },
  heroBadgeTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  heroBadgeTagText: { color: '#10b981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroBadgeIcon: { marginLeft: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16,
    borderWidth: 1, padding: 16, alignItems: 'center'
  },
  statNum: { fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  menuCard: {
    width: '47%', borderRadius: 18, borderWidth: 1,
    padding: 18, alignItems: 'flex-start', minHeight: 130
  },
  menuIconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuLabel: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  menuSub: { color: '#64748b', fontSize: 11, lineHeight: 16 },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 18
  },
  accountName: { color: '#f9fafb', fontSize: 15, fontWeight: '700' },
  accountEmail: { color: '#64748b', fontSize: 12, marginTop: 2 },
  accountRoleBadge: { backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)' },
  accountRoleText: { color: '#06b6d4', fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalCard: { width: '100%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 30, alignItems: 'center' },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  modalTitle: { color: '#f9fafb', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalSub: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalCancelText: { color: '#94a3b8', fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: '800' }
})