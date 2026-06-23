import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native'
import { supabase } from '../supabase'

export default function VerifyOTP({ route, navigation }: any) {
  const { email } = route.params
  const [code, setCode] = useState('')

  const verify = async () => {
    const cleanCode = code.trim()

    if (cleanCode.length < 6) {
      Alert.alert('Erreur', 'Veuillez saisir un code valide')
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: cleanCode,
      type: 'email'
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert('Succès', 'Code vérifié 🔐')

    navigation.navigate('ResetPassword')
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Vérification</Text>

      <Text style={styles.subtitle}>
        Saisissez le code envoyé à votre email
      </Text>

      <TextInput
        placeholder="Code à 6 chiffres"
        keyboardType="numeric"
        value={code}
        onChangeText={setCode}
        maxLength={8}   // 🔥 يقبل 6 أو 8
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={verify}>
        <Text style={styles.buttonText}>Vérifier</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },

  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20
  },

  input: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 5,
    marginBottom: 20
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