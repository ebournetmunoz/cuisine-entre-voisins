import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

let Notifications: any = null;
let Device: any = null;

const isExpoGo = Constants.appOwnership === 'expo';

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    console.log('Notifications module not available:', error);
  }
}

if (Platform.OS !== 'web' && Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.log('Notification handler setup skipped:', error);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null;
}

export async function savePushToken(token: string): Promise<void> {
  return;
}

export function addNotificationReceivedListener(callback: (notification: any) => void) {
  return { remove: () => {} };
}

export function addNotificationResponseReceivedListener(callback: (response: any) => void) {
  return { remove: () => {} };
}

export async function schedulePushNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  return;
}