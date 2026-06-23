import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'

export default function OtherForm({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [subjectFocused, setSubjectFocused] = useState(false)
  const [messageFocused, setMessageFocused] = useState(false)

  useEffect(() => { getUserEmail() }, [])

  const getUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) setEmail(user.email)
  }

  const handleSend = async () => {
    if (!subject || !message) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    try {
      await supabase.from('reclamations').insert([{
        employee_email: email,
        subject: subject || 'Autre',
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      Alert.alert('✅ Envoyé !', 'Votre message a été soumis avec succès.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
      setSubject('')
      setMessage('')
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la requête.')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#f9fafb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Autre Requête</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* TYPE BADGE */}
          <View style={styles.typeBadge}>
            <View style={styles.typeIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.typeLabel}>Type de requête</Text>
              <Text style={styles.typeValue}>Autre / Personnalisée</Text>
            </View>
          </View>

          {/* EMAIL (READ-ONLY) */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Votre email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
              <Ionicons name="lock-closed-outline" size={16} color="#475569" style={styles.fieldIcon} />
              <Text style={styles.emailText} numberOfLines={1}>{email || 'Chargement...'}</Text>
            </View>
          </View>

          {/* SUBJECT */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Objet</Text>
            <View style={[styles.inputWrapper, subjectFocused && styles.inputFocused]}>
              <Ionicons name="document-text-outline" size={16} color={subjectFocused ? '#06b6d4' : '#475569'} style={styles.fieldIcon} />
              <TextInput
                placeholder="Ex: Oubli de pointage, correction..."
                placeholderTextColor="#334155"
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                onFocus={() => setSubjectFocused(true)}
                onBlur={() => setSubjectFocused(false)}
              />
            </View>
          </View>

          {/* MESSAGE */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Message détaillé</Text>
            <View style={[styles.inputWrapper, styles.textareaWrapper, messageFocused && styles.inputFocused]}>
              <TextInput
                placeholder="Décrivez votre problème en détail..."
                placeholderTextColor="#334155"
                style={[styles.textInput, styles.textarea]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                onFocus={() => setMessageFocused(true)}
                onBlur={() => setMessageFocused(false)}
              />
            </View>
            <Text style={styles.charCount}>{message.length} caractères</Text>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.submitText}>Soumettre la requête</Text>
              </>
            )}
          </TouchableOpacity>

          {/* INFO */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>
              Votre requête sera examinée par l'équipe RH sous 48h ouvrables.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030712' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  headerTitle: { color: '#f9fafb', fontSize: 17, fontWeight: '800' },
  container: { padding: 20, paddingBottom: 40 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', marginBottom: 28
  },
  typeIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center'
  },
  typeLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  typeValue: { color: '#f9fafb', fontSize: 15, fontWeight: '800', marginTop: 2 },
  section: { marginBottom: 20 },
  fieldLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, height: 52
  },
  inputFocused: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.04)' },
  textareaWrapper: { height: 140, alignItems: 'flex-start', paddingVertical: 14 },
  fieldIcon: { marginRight: 10 },
  emailText: { flex: 1, color: '#475569', fontSize: 14 },
  textInput: { flex: 1, color: '#f9fafb', fontSize: 14, paddingVertical: 0 },
  textarea: { height: 110 },
  charCount: { color: '#334155', fontSize: 11, textAlign: 'right', marginTop: 6 },
  submitBtn: {
    flexDirection: 'row', backgroundColor: '#06b6d4',
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 14, marginTop: 16
  },
  infoText: { color: '#475569', fontSize: 12, flex: 1, lineHeight: 18 }
})