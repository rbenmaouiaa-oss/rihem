import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { supabase } from '../supabase'

export default function ResetPassword({ navigation }: any) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updatePassword = async () => {

    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }

    Alert.alert('Succès', 'Mot de passe mis à jour 🔐')

    // 🔥 يرجع للـ Login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={styles.card}>

        <Text style={styles.title}>Nouveau mot de passe</Text>

        <TextInput
          placeholder="Nouveau mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TextInput
          placeholder="Confirmer le mot de passe"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={updatePassword}>
          <Text style={styles.buttonText}>Valider</Text>
        </TouchableOpacity>

      </View>

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f2f4f7'
  },

  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15
  },

  button: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
})