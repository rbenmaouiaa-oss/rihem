import React, { useEffect } from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'

// SCREENS
import Login from './screens/Login'
import Register from './screens/Register'
import Home from './screens/Home'
import ForgotPassword from './screens/ForgotPassword'
import VerifyOTP from './screens/VerifyOTP'
import ResetPassword from './screens/ResetPassword'
import ReclamationForm from './screens/ReclamationForm'
import OtherForm from './screens/OtherForm'

import ReclamationScreen from './screens/ReclamationScreen'
import NotificationsScreen from './screens/NotificationScreen'

// EMPLOYEE DETAILS
import EmployeeDetails from './screens/EmployeeDetails'

// 🔥 REPORTS (ADDED)
import Reports from './screens/Reports'

// 🔥 SECURE DYNAMIC QR SCREEN
import GenerateQR from './screens/GenerateQR'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  VerifyOTP: undefined
  ResetPassword: undefined
  Home: undefined
  Reclamation: undefined
  Notifications: undefined
  ReclamationForm: { type: string }
  OtherForm: undefined
  EmployeeDetails: undefined
  Reports: undefined
  GenerateQR: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>()

export default function App() {

  return (
    <NavigationContainer ref={navigationRef}>

      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* AUTH */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* PASSWORD */}
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTP} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />

        {/* MAIN */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="OtherForm" component={OtherForm} />

        {/* EMPLOYEE */}
        <Stack.Screen name="EmployeeDetails" component={EmployeeDetails} />

        {/* RECLAMATION FLOW */}
        <Stack.Screen name="Reclamation" component={ReclamationScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ReclamationForm" component={ReclamationForm} />

        {/* 🔥 REPORTS ADDED */}
        <Stack.Screen name="Reports" component={Reports} />

        {/* 🔥 SECURE DYNAMIC QR SCREEN ADDED */}
        <Stack.Screen name="GenerateQR" component={GenerateQR} />

      </Stack.Navigator>

    </NavigationContainer>
  )
}