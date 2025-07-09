import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="personal" />
          <Stack.Screen name="mandatarios" />
          <Stack.Screen name="reportes" />
          <Stack.Screen name="analytics" />
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}