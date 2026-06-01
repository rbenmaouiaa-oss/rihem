import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const RECLAMATION_TYPES = [
  {
    key: 'Retard',
    label: 'Retard',
    description: 'Signaler une arrivée tardive',
    icon: 'time-outline' as const,
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.35)',
    bgColor: 'rgba(245,158,11,0.12)',
    route: 'ReclamationForm',
  },
  {
    key: 'Avance',
    label: 'Avance',
    description: 'Signaler un départ anticipé',
    icon: 'play-forward-outline' as const,
    color: '#06b6d4',
    borderColor: 'rgba(6,182,212,0.35)',
    bgColor: 'rgba(6,182,212,0.12)',
    route: 'ReclamationForm',
  },
  {
    key: 'Absence',
    label: 'Absence',
    description: 'Justifier une absence',
    icon: 'calendar-outline' as const,
    color: '#ef4444',
    borderColor: 'rgba(239,68,68,0.35)',
    bgColor: 'rgba(239,68,68,0.12)',
    route: 'ReclamationForm',
  },
  {
    key: 'Autre',
    label: 'Autre',
    description: 'Autre type de réclamation',
    icon: 'ellipsis-horizontal-circle-outline' as const,
    color: '#a855f7',
    borderColor: 'rgba(168,85,247,0.35)',
    bgColor: 'rgba(168,85,247,0.12)',
    route: 'OtherForm',
  },
]

export default function ReclamationScreen({ navigation }: any) {
  const handlePress = (item: typeof RECLAMATION_TYPES[0]) => {
    if (item.route === 'OtherForm') {
      navigation.navigate('OtherForm')
    } else {
      navigation.navigate('ReclamationForm', { type: item.key })
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#06b6d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réclamations RH</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* INFO BANNER */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#06b6d4" style={{ marginRight: 8 }} />
          <Text style={styles.infoBannerText}>
            Soumettez une réclamation pour corriger votre pointage.
          </Text>
        </View>

        {/* 2x2 GRID */}
        <View style={styles.grid}>
          {RECLAMATION_TYPES.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.card, { borderColor: item.borderColor }]}
              onPress={() => handlePress(item)}
              activeOpacity={0.75}
            >
              {/* Icon Circle */}
              <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>

              {/* Text */}
              <Text style={[styles.cardTitle, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{item.description}</Text>

              {/* Arrow */}
              <View style={styles.cardArrow}>
                <Ionicons name="chevron-forward" size={14} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

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

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* INFO BANNER */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },

  /* GRID */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },

  /* CARD */
  card: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'flex-start',
    minHeight: 150,
    position: 'relative',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
})