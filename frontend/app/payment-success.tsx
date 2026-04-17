import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { api } from '../src/services/api';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!session_id) {
      setStatus('error');
      return;
    }
    pollPaymentStatus();
  }, [session_id]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }

    try {
      const result = await api.getPaymentStatus(session_id as string);
      if (result.payment_status === 'paid' || result.status === 'paid') {
        setStatus('success');
        setTimeout(() => {
          router.replace('/(tabs)/orders');
        }, 2000);
      } else {
        setAttempts((prev) => prev + 1);
        setTimeout(pollPaymentStatus, pollInterval);
      }
    } catch (error) {
      console.log('Payment status error:', error);
      setAttempts((prev) => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>Vérification du paiement...</Text>
            <Text style={styles.subtitle}>Merci de patienter quelques instants</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            <Text style={styles.title}>Paiement réussi !</Text>
            <Text style={styles.subtitle}>Merci pour votre commande</Text>
            <Text style={styles.info}>Redirection vers vos commandes...</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={80} color={colors.warning} />
            </View>
            <Text style={styles.title}>Statut inconnu</Text>
            <Text style={styles.subtitle}>
              Vérifiez vos commandes pour confirmer le paiement
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 24,
  },
});