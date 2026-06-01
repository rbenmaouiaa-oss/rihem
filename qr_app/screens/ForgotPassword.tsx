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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    elevation: 5
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10
  },
  description: {
    color: '#666',
    marginBottom: 25
  },
  label: {
    fontWeight: '600',
    marginBottom: 5
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 10,
    padding: 12,
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
  },
  backText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#3b82f6'
  }
})

export default function ForgotPassword({ navigation }: any) {
  const [email, setEmail] = useState('')

  const sendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://192.168.1.5:8081/--/'  // ⚠️ بدّل بالـ IP متاعك
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert('Success', 'Check your email 📩')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>

        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.description}>
          Enter your email and we will send you a reset link.
        </Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          placeholder="example@email.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={sendCode}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>  
  )
}