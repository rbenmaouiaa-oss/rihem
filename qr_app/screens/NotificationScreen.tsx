import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

// ─── Types ──────────────────────────────────────────────────────────────────
type NotificationType = 'success' | 'info' | 'warning' | 'error'

interface AppNotification {
  id: number | string
  title: string
  body: string
  type: NotificationType
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    title: 'Présence confirmée',
    body: 'Votre pointage du matin a été validé.',
    type: 'success',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Réclamation traitée',
    body: 'Votre réclamation de retard a été approuvée.',
    type: 'info',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Rappel de pointage',
    body: "Vous n'avez pas encore pointé aujourd'hui.",
    type: 'warning',
    created_at: new Date().toISOString(),
  },
]

const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: 'checkmark-circle-outline' },
  info:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  icon: 'information-circle-outline' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'warning-outline' },
  error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: 'alert-circle-outline' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotifications(MOCK_NOTIFICATIONS)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        setNotifications(MOCK_NOTIFICATIONS)
      } else {
        setNotifications(data as AppNotification[])
      }
    } catch {
      setNotifications(MOCK_NOTIFICATIONS)
    } finally {
      setLoading(false)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info
    return (
      <View
        style={[
          styles.card,
          { borderLeftColor: cfg.color },
          index === 0 && { marginTop: 4 },
        ]}
      >
        {/* Left Icon */}
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-off-outline" size={48} color="#334155" />
      </View>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptySubtitle}>Vous êtes à jour ! Revenez plus tard.</Text>
    </View>
  )

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#06b6d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={[styles.badgeWrap]}>
          {notifications.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notifications.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loaderText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#030712',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(6,182,212,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.3,
  },
  badgeWrap: {
    width: 40,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* LIST */
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  /* NOTIFICATION CARD */
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderLeftWidth: 3,
    padding: 14,
    gap: 12,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  cardText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '500',
  },

  /* EMPTY STATE */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
  },

  /* LOADER */
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loaderText: {
    color: '#475569',
    fontSize: 14,
  },
})