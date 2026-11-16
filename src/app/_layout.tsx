import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../auth/AuthProvider';
export default function Layout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false }} /></AuthProvider></SafeAreaProvider>;
}
