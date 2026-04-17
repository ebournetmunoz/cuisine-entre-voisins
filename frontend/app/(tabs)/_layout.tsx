import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Check for unread messages
  useEffect(() => {
    if (!user) return;
    
    const checkUnreadMessages = async () => {
      try {
        const conversations = await api.getConversations();
        const total = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(total);
      } catch (error) {
        console.log('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Check for pending orders (orders needing action)
  useEffect(() => {
    if (!user) return;
    
    const checkPendingOrders = async () => {
      try {
        const orders = await api.getOrders();
        let pendingCount = 0;
        
        orders.forEach((order: any) => {
          // For cooks: count orders waiting for confirmation
          if (order.cook_id === user.id && order.status === 'pending') {
            pendingCount++;
          }
          // For customers: count orders that are ready for pickup
          if (order.user_id === user.id && order.status === 'ready') {
            pendingCount++;
          }
        });
        
        setPendingOrdersCount(pendingCount);
      } catch (error) {
        console.log('Error checking pending orders:', error);
      }
    };

    checkPendingOrders();
    const interval = setInterval(checkPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const bottomPadding = Platform.OS === 'ios' ? 24 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Publier',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.addIcon, focused && styles.addIconActive]}>
              <Ionicons name="add" size={20} color={colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="bag-outline" size={22} color={color} />
              {pendingOrdersCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubble-outline" size={22} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconActive: {
    backgroundColor: colors.primaryDark,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});
