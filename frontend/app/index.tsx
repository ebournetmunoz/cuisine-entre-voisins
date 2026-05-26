import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
  router.replace('/(tabs)/home' as any);
} else {
  router.replace('/(auth)/login');
}
    }
  }, [loading, user]);

  return (
  <View style={styles.container}>
    <Image
      source={require('../assets/images/logo.png')}
      style={styles.logoImage}
      resizeMode="contain"
    />

    <Text style={styles.subtitle}>
      La cuisine du cœur, près de chez vous
    </Text>

    <ActivityIndicator
      size="large"
      color={colors.primary}
      style={styles.loader}
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoImage: {
  width: 260,
  height: 260,
  marginBottom: -10,
 },
  
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginTop: 24,
  },
});
