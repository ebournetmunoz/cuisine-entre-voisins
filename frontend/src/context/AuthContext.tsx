import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../services/api';
import { registerForPushNotificationsAsync, savePushToken } from '../services/notifications';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  address?: string;  // Full address for cook (private)
  neighborhood?: string;  // Neighborhood for public display
  location?: { lat: number; lng: number; address?: string };
  is_cook: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Register for push notifications when user is logged in
  useEffect(() => {
    if (user && Platform.OS !== 'web') {
      setupPushNotifications();
    }
  }, [user]);

  const setupPushNotifications = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await savePushToken(pushToken);
      }
    } catch (error) {
      console.log('Push notification setup error:', error);
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        api.setToken(storedToken);
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.log('Auth load error:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    await AsyncStorage.setItem('auth_token', response.token);
    setToken(response.token);
    api.setToken(response.token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const response = await api.register(name, email, password, phone);
    await AsyncStorage.setItem('auth_token', response.token);
    setToken(response.token);
    api.setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    // Remove push token from server
    try {
      await api.savePushToken(''); // Clear token
    } catch (error) {
      console.log('Error clearing push token:', error);
    }
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    api.setToken(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
