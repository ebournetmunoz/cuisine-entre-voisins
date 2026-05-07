import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    const registerForPushNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission notification refusée');
        return;
      }

      console.log('Notifications autorisées');
    };

    registerForPushNotifications();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meal/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="philosophy" options={{ presentation: 'card' }} />
        <Stack.Screen name="hygiene" options={{ presentation: 'card' }} />
        <Stack.Screen name="mentions" options={{ presentation: 'card' }} />
        <Stack.Screen name="payment-success" />
        <Stack.Screen name="payment-cancel" />
      </Stack>
    </AuthProvider>
  );
}