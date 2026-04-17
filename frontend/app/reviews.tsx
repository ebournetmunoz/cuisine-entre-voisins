import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/services/api';
import { colors } from '../src/theme/colors';

export default function ReviewsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      if (!user?.id) return;

      const data = await api.getCookReviews(user.id);
      setReviews(data);
    } catch (error) {
      console.log('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* HEADER AVEC RETOUR */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Mes avis</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* NOTE GLOBALE */}
        <View style={styles.card}>
          <Ionicons name="star" size={30} color={colors.accent} />
          <Text style={styles.rating}>
            {typeof user?.rating === 'number' ? user.rating.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.count}>
            {user?.reviews_count || 0} avis
          </Text>
        </View>

        {/* LISTE DES AVIS */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : reviews.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Aucun avis pour le moment</Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={{ flexDirection: 'row' }}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color={colors.accent} />
                  ))}
                </View>
                <Text style={styles.reviewRating}>{review.rating}/5</Text>
              </View>

              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },

  // CARDS
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  rating: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },

  count: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },

  // REVIEWS
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  reviewRating: {
    marginLeft: 6,
    fontWeight: '600',
    color: colors.text,
  },

  reviewComment: {
    color: colors.text,
    marginTop: 4,
  },
});