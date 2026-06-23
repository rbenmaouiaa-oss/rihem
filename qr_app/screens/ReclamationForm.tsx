import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

const TYPE_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  Retard: { color: '#f59e0b', icon: 'time-outline', bg: 'rgba(245,158,11,0.12)' },
  Avance: { color: '#06b6d4', icon: 'play-forward-outline', bg: 'rgba(6,182,212,0.12)' },
  Absence: { color: '#ef4444', icon: 'calendar-outline', bg: 'rgba(239,68,68,0.12)' },
}

const FRENCH_LABELS: Record<string, string> = {
  Retard: 'Retard',
  Avance: 'Avance',
  Absence: 'Absence',
}

function getTodayDate(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ReclamationForm({ route, navigation }: any) {
  const { type } = route.params

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState(getTodayDate())
  const [loading, setLoading] = useState(false)

  const meta = TYPE_META[type] ?? { color: '#06b6d4', icon: 'document-outline', bg: 'rgba(6,182,212,0.12)' }
  const label = FRENCH_LABELS[type] ?? type

  useEffect(() => {
    getUserEmail()
  }, [])

  const getUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
    } catch {
      // silently fail
    }
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un message.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('reclamations').insert([
        {
          employee_email: email,
          subject: type,
          message: message.trim(),
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      Alert.alert(
        'Réclamation envoyée',
        'Votre réclamation a été soumise avec succès.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
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
        <Text style={styles.headerTitle}>{label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* TYPE PILL */}
          <View style={[styles.typePill, { backgroundColor: meta.bg, borderColor: meta.color + '55' }]}>
            <View style={[styles.typeIconWrap, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={16} color={meta.color} />
            </View>
            <Text style={[styles.typePillText, { color: meta.color }]}>
              Réclamation · {label}
            </Text>
          </View>

          {/* EMAIL FIELD */}
          <Text style={styles.fieldLabel}>Adresse e-mail</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={16} color="#475569" style={styles.inputIcon} />
            <TextInput
              value={email || 'Chargement...'}
              editable={false}
              style={[styles.input, styles.inputReadOnly]}
              placeholderTextColor="#475569"
              selectTextOnFocus={false}
            />
          </View>

          {/* DATE FIELD */}
          <Text style={styles.fieldLabel}>Date concernée</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={16} color="#06b6d4" style={styles.inputIcon} />
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholderTextColor="#475569"
              placeholder="JJ/MM/AAAA"
            />
          </View>

          {/* MESSAGE FIELD */}
          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            placeholder="Décrivez votre situation en détail..."
            placeholderTextColor="#475569"
            style={styles.textArea}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Soumettre la réclamation</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 48,
  },

  /* TYPE PILL */
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 50,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 28,
    gap: 8,
  },
  typeIconWrap: {
    borderRadius: 12,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* FORM */
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#f1f5f9',
    fontSize: 15,
  },
  inputReadOnly: {
    color: '#475569',
  },
  textArea: {
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 15,
    minHeight: 130,
    marginBottom: 28,
    lineHeight: 22,
  },

  /* SUBMIT */
  submitBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
})