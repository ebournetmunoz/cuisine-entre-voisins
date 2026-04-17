import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

interface Meal {
  id: string;
  title: string;
  price: number;
  portions_left: number;
  images?: string[];
  category: string;
}

interface PublicProfile {
  id: string;
  name: string;
  bio?: string;
  neighborhood?: string;
  city?: string;
  rating: number;
  reviews_count: number;
  meals_count: number;
  active_meals: Meal[];
  reviews: Review[];
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await api.getPublicUserProfile(id as string);
      setProfile(data);
    } finally {
      setLoading(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text>Profil introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.metaText}>{profile.rating.toFixed(1)} ({profile.reviews_count} avis)</Text>
            </View>
            {!!(profile.neighborhood || profile.city) && (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={styles.metaText}>{profile.neighborhood || profile.city}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plats proposés</Text>
          {profile.active_meals.length === 0 ? (
            <Text style={styles.emptyText}>Aucun plat en ligne pour le moment.</Text>
          ) : (
            profile.active_meals.map((meal) => {
              const img = meal.images && meal.images.length > 0 ? (meal.images[0].startsWith('data:') ? meal.images[0] : `data:image/jpeg;base64,${meal.images[0]}`) : null;
              return (
                <TouchableOpacity key={meal.id} style={styles.mealCard} onPress={() => router.push(`/meal/${meal.id}` as any)}>
                  <View style={styles.mealThumbWrap}>
                    {img ? <Image source={{ uri: img }} style={styles.mealThumb} resizeMode="contain" /> : (
                      <View style={styles.mealThumbPlaceholder}>
                        <Ionicons name="restaurant-outline" size={20} color={colors.textMuted} />
                      </View>
                    )}
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealTitle}>{meal.title}</Text>
                    <Text style={styles.mealSubtitle}>{meal.category} • {meal.price.toFixed(2)} € • {meal.portions_left} dispo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis</Text>
          {profile.reviews.length === 0 ? (
            <Text style={styles.emptyText}>Pas encore d'avis publics.</Text>
          ) : (
            profile.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewer}>{review.reviewer_name}</Text>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={14} color={colors.accent} />
                    ))}
                  </View>
                </View>
                {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: { paddingHorizontal: 16, paddingVertical: 8 },
  backButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center'
  },
  heroCard: {
    marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center'
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  bio: { marginTop: 10, textAlign: 'center', color: colors.textLight, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 16, justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.backgroundDark, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  metaText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  section: { marginTop: 16, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  emptyText: { color: colors.textMuted },
  mealCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  mealThumbWrap: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.backgroundDark, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mealThumb: { width: '100%', height: '100%' },
  mealThumbPlaceholder: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  mealInfo: { flex: 1 },
  mealTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  mealSubtitle: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  reviewCard: { backgroundColor: colors.backgroundDark, borderRadius: 12, padding: 14, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewer: { fontWeight: '600', color: colors.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { color: colors.textLight, marginTop: 8, lineHeight: 19 },
  reviewDate: { color: colors.textMuted, fontSize: 12, marginTop: 8 }
});
