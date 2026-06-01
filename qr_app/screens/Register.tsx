import React, { useState } from 'react'
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import { supabase } from '../supabase'
import { Ionicons } from '@expo/vector-icons'

export default function Register({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [phone, setPhone] = useState('')
  const [poste, setPoste] = useState('')
  const [cin, setCin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 2-step form

  const goToStep2 = () => {
    if (!nom || !prenom || !phone || !cin) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.')
      return
    }
    if (!/^[0-9]{8}$/.test(cin)) {
      Alert.alert('CIN invalide', 'Le CIN doit contenir exactement 8 chiffres.')
      return
    }
    setStep(2)
  }

  const register = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setLoading(false)
      Alert.alert('Erreur', error.message)
      return
    }
    const user = data.user
    const { error: dbError } = await supabase.from('employers').insert([{
      id: user?.id, email, nom, prenom, phone, poste, cin
    }])
    setLoading(false)
    if (dbError) {
      Alert.alert('DB Error', dbError.message)
      return
    }
    Alert.alert('Compte créé ! 🎉', 'Votre compte a été créé avec succès.')
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          {step === 2 && (
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#f9fafb" />
            </TouchableOpacity>
          )}
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={34} color="#06b6d4" />
          </View>
          <Text style={styles.brandName}>Créer un compte</Text>
          <Text style={styles.brandSub}>Rejoignez la plateforme de présence</Text>
        </View>

        {/* ───── STEP INDICATOR ───── */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepNum}>2</Text>
          </View>
        </View>

        {/* ───── CARD ───── */}
        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              <Text style={styles.cardSub}>Étape 1 sur 2</Text>

              <Field label="Prénom" icon="person-outline" value={nom} onChange={setNom} placeholder="Votre prénom" />
              <Field label="Nom" icon="person-outline" value={prenom} onChange={setPrenom} placeholder="Votre nom" />
              <Field label="Téléphone" icon="call-outline" value={phone} onChange={setPhone} placeholder="+216 XX XXX XXX" keyboardType="phone-pad" />
              <Field label="Poste / Fonction" icon="briefcase-outline" value={poste} onChange={setPoste} placeholder="Ex: Ingénieur R&D" />
              <Field label="Numéro CIN (8 chiffres)" icon="card-outline" value={cin} onChange={setCin} placeholder="12345678" keyboardType="numeric" maxLength={8} />

              <TouchableOpacity style={styles.button} onPress={goToStep2}>
                <Text style={styles.buttonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Identifiants de connexion</Text>
              <Text style={styles.cardSub}>Étape 2 sur 2</Text>

              <Field label="Adresse email" icon="mail-outline" value={email} onChange={setEmail} placeholder="email@example.com" autoCapitalize="none" keyboardType="email-address" />

              <View style={styles.passWrapper}>
                <Field label="Mot de passe" icon="lock-closed-outline" value={password} onChange={setPassword} placeholder="Min. 8 caractères" secure={!showPassword} />
                <TouchableOpacity style={styles.eyeOverlay} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.passWrapper}>
                <Field label="Confirmer le mot de passe" icon="lock-open-outline" value={confirmPassword} onChange={setConfirmPassword} placeholder="Retapez le mot de passe" secure={!showConfirmPassword} />
                <TouchableOpacity style={styles.eyeOverlay} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={register} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Créer le compte</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
            <Text style={styles.loginText}>Déjà un compte ? <Text style={styles.loginLink}>Se connecter</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>🔒 Vos données sont protégées et chiffrées</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Reusable field component
function Field({ label, icon, value, onChange, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', secure = false, maxLength }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.wrapper, focused && fieldStyles.wrapperFocused]}>
        <Ionicons name={icon} size={17} color={focused ? '#06b6d4' : '#64748b'} style={{ marginRight: 10 }} />
        <TextInput
          style={fieldStyles.input}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secure}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, height: 50
  },
  wrapperFocused: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.04)' },
  input: { flex: 1, color: '#f9fafb', fontSize: 14, paddingVertical: 0 }
})

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030712' },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, backgroundColor: '#030712' },
  header: { alignItems: 'center', marginBottom: 28, width: '100%' },
  backBtn: { position: 'absolute', left: 0, top: 20, padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
  logoCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(6,182,212,0.08)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#f9fafb', letterSpacing: 0.5 },
  brandSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#06b6d4', borderColor: '#06b6d4' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepLine: { width: 80, height: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  stepLineActive: { backgroundColor: '#06b6d4' },
  card: { width: '100%', backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 28 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#f9fafb', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  passWrapper: { position: 'relative' },
  eyeOverlay: { position: 'absolute', right: 14, bottom: 28, padding: 4 },
  button: { flexDirection: 'row', backgroundColor: '#06b6d4', paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loginBtn: { alignItems: 'center', marginTop: 22 },
  loginText: { color: '#64748b', fontSize: 14 },
  loginLink: { color: '#06b6d4', fontWeight: '700' },
  footer: { marginTop: 30, color: '#334155', fontSize: 12 }
})