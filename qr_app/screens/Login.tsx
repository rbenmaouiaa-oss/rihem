import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../supabase'
import { Ionicons } from '@expo/vector-icons'

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const saved = await AsyncStorage.getItem('email')
        if (saved) setEmail(saved)
      } catch (e) {}
    })()
  }, [])

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }
    await AsyncStorage.setItem('email', email)
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ───── LOGO AREA ───── */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={42} color="#06b6d4" />
          </View>
          <Text style={styles.brandName}>AttendAI</Text>
          <Text style={styles.brandSub}>Système de Présence Sécurisé</Text>
        </View>

        {/* ───── CARD ───── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSub}>Bienvenue 👋 Entrez vos identifiants</Text>

          {/* Email */}
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <Ionicons name="mail-outline" size={18} color={emailFocused ? '#06b6d4' : '#64748b'} style={styles.inputIcon} />
            <TextInput
              placeholder="Adresse email"
              placeholderTextColor="#475569"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? '#06b6d4' : '#64748b'} style={styles.inputIcon} />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#475569"
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={login} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Se connecter</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerBtn}>
            <Text style={styles.registerText}>Pas encore de compte ? <Text style={styles.registerLink}>Créer un compte</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>🔒 Connexion sécurisée chiffrée</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712'
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#030712'
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f9fafb',
    letterSpacing: 1.5
  },
  brandSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    letterSpacing: 0.5
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 28
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f9fafb',
    marginBottom: 6
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 28
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52
  },
  inputWrapperFocused: {
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6,182,212,0.04)'
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 15,
    paddingVertical: 0
  },
  eyeBtn: {
    padding: 4
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20
  },
  forgotText: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '600'
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#06b6d4',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  dividerText: {
    color: '#475569',
    fontSize: 12,
    marginHorizontal: 14
  },
  registerBtn: {
    alignItems: 'center'
  },
  registerText: {
    color: '#64748b',
    fontSize: 14
  },
  registerLink: {
    color: '#06b6d4',
    fontWeight: '700'
  },
  footer: {
    marginTop: 30,
    color: '#334155',
    fontSize: 12,
    letterSpacing: 0.3
  }
})