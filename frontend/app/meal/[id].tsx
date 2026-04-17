import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useMealsStore } from '../../src/stores/mealsStore';

interface Meal {
  id: string;
  cook_id: string;
  cook_name: string;
  cook_avatar?: string;
  cook_rating: number;
  title: string;
  description: string;
  price: number;
  portions: number;
  portions_left: number;
  category: string;
  images: string[];
  available_date: string;
  available_time: string;
  allergens: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  location?: { lat: number; lng: number };
  city?: string;
  neighborhood?: string;
  address?: string;
  container_provided?: boolean;
  bag_provided?: boolean;
  bring_container?: boolean;
  collection_instructions?: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  quality_rating?: number;
  quantity_rating?: number;
  collection_rating?: number;
  created_at: string;
}

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [portions, setPortions] = useState(1);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const triggerRefresh = useMealsStore((state) => state.triggerRefresh);

  
  useEffect(() => {
    loadMeal();
  }, [id]);

  const loadMeal = async () => {
    try {
      const data = await api.getMeal(id as string);
      setMeal(data);

      if (data.cook_id) {
        try {
          const reviewsData = await api.getCookReviews(data.cook_id);
          setReviews(reviewsData);
        } catch (e) {
          console.log('Could not load reviews');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le repas');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async () => {
  const confirmed =
    Platform.OS === 'web'
      ? window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Supprimer ce plat',
            'Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible.',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

  if (!confirmed) return;

  try {
    console.log('DELETE START', id);
    await api.deleteMeal(id as string);
    triggerRefresh();
    Alert.alert('Succès', 'Plat supprimé');
    router.back();
  } catch (error: any) {
    console.log('DELETE ERROR', error?.response?.data || error);
    Alert.alert(
      'Erreur',
      error.response?.data?.detail || 'Impossible de supprimer ce plat'
    );
  }
};

  const handleOrder = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour commander', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (meal?.cook_id === user.id) {
      Alert.alert('Erreur', 'Vous ne pouvez pas commander votre propre repas');
      return;
    }

    setOrderLoading(true);
    try {
      await api.createOrder({
        meal_id: id as string,
        portions,
        message: message.trim() || undefined,
      });

      setShowOrderModal(false);
      triggerRefresh();
      await loadMeal();

      Alert.alert('Commande envoyée !', 'Le cuisinier va confirmer votre commande', [
        { text: 'Voir mes commandes', onPress: () => router.push('/(tabs)/orders') },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Commande impossible');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleContactCook = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour envoyer un message');
      return;
    }
    router.push(`/chat/${meal?.cook_id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!meal) return null;

  const subtotal = meal.price * portions;
  const firstImage = meal.images && meal.images.length > 0 ? meal.images[0] : null;
  const firstImageUri = firstImage
    ? firstImage.startsWith('data:')
      ? firstImage
      : `data:image/jpeg;base64,${firstImage}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={() => router.push(`/user/${meal?.cook_id}` as any)}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {firstImageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: firstImageUri }} style={styles.mealImage} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.badgesRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{meal.category}</Text>
            </View>
            {meal.is_vegetarian && (
              <View style={[styles.dietBadge, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={styles.dietEmoji}>🌱</Text>
                <Text style={[styles.dietText, { color: colors.secondary }]}>Végétarien</Text>
              </View>
            )}
            {meal.is_vegan && (
              <View style={[styles.dietBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={styles.dietEmoji}>🥬</Text>
                <Text style={[styles.dietText, { color: colors.success }]}>Végan</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{meal.title}</Text>
          <Text style={styles.price}>{meal.price.toFixed(2)} € / portion</Text>

          <TouchableOpacity style={styles.cookCard} onPress={() => router.push(`/user/${meal.cook_id}` as any)}>
            <View style={styles.cookAvatar}>
              <Text style={styles.cookInitials}>
                {meal.cook_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.cookInfo}>
              <Text style={styles.cookName}>{meal.cook_name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={styles.rating}>{meal.cook_rating.toFixed(1)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.publicProfileButton}
            onPress={() => router.push(`/user/${meal.cook_id}` as any)}
          >
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.publicProfileButtonText}>Voir le profil et les avis</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{meal.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilité</Text>
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.availabilityText}>{meal.available_date}</Text>
              </View>
              <View style={styles.availabilityItem}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.availabilityText}>{meal.available_time}</Text>
              </View>
              <View style={styles.availabilityItem}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={styles.availabilityText}>{meal.portions_left} portions</Text>
              </View>
            </View>
          </View>

          {(meal.neighborhood || meal.address) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Localisation</Text>
              {meal.address ? (
                <View style={styles.addressContainer}>
                  <View style={styles.addressFullBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.addressFullLabel}>Adresse complète</Text>
                  </View>
                  <View style={styles.addressItem}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={styles.addressFullText}>{meal.address}</Text>
                  </View>
                </View>
              ) : meal.neighborhood ? (
                <View style={styles.addressContainer}>
                  <View style={styles.addressItem}>
                    <Ionicons name="location-outline" size={20} color={colors.primary} />
                    <Text style={styles.addressCityText}>{meal.neighborhood}</Text>
                  </View>
                  <Text style={styles.addressNote}>
                    Le quartier est visible avant réservation. L'adresse exacte n'apparaît qu'après validation par le cuisinier.
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {(meal.container_provided !== undefined ||
            meal.bag_provided !== undefined ||
            meal.bring_container) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emballages</Text>
              <View style={styles.packagingList}>
                {meal.container_provided && (
                  <View style={styles.packagingItem}>
                    <View style={[styles.packagingIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="cube-outline" size={18} color={colors.success} />
                    </View>
                    <View style={styles.packagingTextWrap}>
                      <Text style={styles.packagingLabel}>Récipient</Text>
                      <Text style={styles.packagingValue}>Fourni</Text>
                    </View>
                  </View>
                )}
                {!meal.container_provided && meal.container_provided !== undefined && (
                  <View style={styles.packagingItem}>
                    <View style={[styles.packagingIcon, { backgroundColor: colors.warning + '20' }]}>
                      <Ionicons name="cube-outline" size={18} color={colors.warning} />
                    </View>
                    <View style={styles.packagingTextWrap}>
                      <Text style={styles.packagingLabel}>Récipient</Text>
                      <Text style={[styles.packagingValue, { color: colors.warning }]}>Non fourni</Text>
                    </View>
                  </View>
                )}
                {meal.bag_provided && (
                  <View style={styles.packagingItem}>
                    <View style={[styles.packagingIcon, { backgroundColor: colors.success + '20' }]}>
                      <Ionicons name="bag-outline" size={18} color={colors.success} />
                    </View>
                    <View style={styles.packagingTextWrap}>
                      <Text style={styles.packagingLabel}>Sac de transport</Text>
                      <Text style={styles.packagingValue}>Fourni</Text>
                    </View>
                  </View>
                )}
                {!meal.bag_provided && meal.bag_provided !== undefined && (
                  <View style={styles.packagingItem}>
                    <View style={[styles.packagingIcon, { backgroundColor: colors.warning + '20' }]}>
                      <Ionicons name="bag-outline" size={18} color={colors.warning} />
                    </View>
                    <View style={styles.packagingTextWrap}>
                      <Text style={styles.packagingLabel}>Sac de transport</Text>
                      <Text style={[styles.packagingValue, { color: colors.warning }]}>Non fourni</Text>
                    </View>
                  </View>
                )}
                {meal.bring_container && (
                  <View style={styles.bringContainerBanner}>
                    <Ionicons name="information-circle" size={20} color={colors.accent} />
                    <Text style={styles.bringContainerText}>
                      Nous vous recommandons d'apporter votre propre contenant
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {meal.collection_instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions de collecte</Text>
              <View style={styles.instructionsBox}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <Text style={styles.instructionsText}>{meal.collection_instructions}</Text>
              </View>
            </View>
          )}

          {meal.allergens && meal.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergènes</Text>
              <View style={styles.allergensContainer}>
                {meal.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenBadge}>
                    <Ionicons name="warning-outline" size={14} color={colors.warning} />
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis sur {meal.cook_name}</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.ratingBadgeText}>
                  {meal.cook_rating?.toFixed(1) || '0.0'} ({reviews.length} avis)
                </Text>
              </View>
            </View>
            {reviews.length === 0 ? (
              <View style={styles.noReviews}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
                <Text style={styles.noReviewsText}>Pas encore d'avis</Text>
                <Text style={styles.noReviewsSubtext}>Soyez le premier à laisser un avis !</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= review.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={star <= review.rating ? colors.accent : colors.textMuted}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ))}
                {reviews.length > 3 && (
  <TouchableOpacity
    onPress={() => router.push(`/user/${meal.cook_id}` as any)}
  >
    <Text style={styles.moreReviews}>
      Voir tous les avis ({reviews.length})
    </Text>
  </TouchableOpacity>
)}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {meal.portions_left > 0 && meal.cook_id !== user?.id && (
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>
              {portions} portion{portions > 1 ? 's' : ''}
            </Text>
            <Text style={styles.totalPrice}>{subtotal.toFixed(2)} €</Text>
            <Text style={styles.pickupHint}>Paiement direct au retrait</Text>
          </View>
          <TouchableOpacity style={styles.orderButton} onPress={() => setShowOrderModal(true)}>
            <Text style={styles.orderButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      )}

      {meal.cook_id === user?.id && (
        <View style={styles.bottomBar}>
          <View style={styles.cookActions}>
            <Text style={styles.cookInfoText}>C'est votre plat</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMeal}>
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Votre commande</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMealTitle}>{meal.title}</Text>

            <View style={styles.portionsContainer}>
              <Text style={styles.portionsLabel}>Nombre de portions</Text>
              <View style={styles.portionsSelector}>
                <TouchableOpacity
                  style={styles.portionButton}
                  onPress={() => setPortions(Math.max(1, portions - 1))}
                  disabled={portions <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={portions <= 1 ? colors.textMuted : colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.portionsValue}>{portions}</Text>
                <TouchableOpacity
                  style={styles.portionButton}
                  onPress={() => setPortions(Math.min(meal.portions_left, portions + 1))}
                  disabled={portions >= meal.portions_left}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={portions >= meal.portions_left ? colors.textMuted : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Message au cuisinier (optionnel)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Précisez vos préférences, allergies..."
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.hybridExplanation}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.hybridExplanationText}>
                Vous envoyez une demande au cuisinier. Le règlement du repas se fait directement entre vous au retrait
                (Wero, espèces ou autre moyen convenu).
              </Text>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.hybridPriceSection}>
                <View style={styles.hybridPriceHeader}>
                  <Ionicons name="cash-outline" size={18} color={colors.success} />
                  <Text style={styles.hybridPriceTitleCook}>À régler au cuisinier</Text>
                </View>
                <Text style={styles.hybridPriceAmountCook}>{subtotal.toFixed(2)} €</Text>
                <Text style={styles.hybridPriceNote}>Paiement en main propre, Wero ou autre accord</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, orderLoading && styles.confirmButtonDisabled]}
              onPress={handleOrder}
              disabled={orderLoading}
            >
              {orderLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
<Text style={styles.confirmButtonText}>Envoyer ma demande</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dietEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  dietText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  publicProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    gap: 8,
  },
  publicProfileButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cookAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  cookInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cookName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
  },
  availabilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  allergensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  allergenText: {
    fontSize: 13,
    color: colors.warning,
    marginLeft: 6,
  },
  addressContainer: {
    gap: 10,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addressFullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  addressFullLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 6,
  },
  addressCityText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  addressFullText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  addressNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  priceContainer: {},
  cookActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookInfoText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  pickupHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  orderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalMealTitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
  },
  portionsContainer: {
    marginBottom: 24,
  },
  portionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  portionsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  portionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    minWidth: 48,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 24,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    height: 80,
    textAlignVertical: 'top',
  },
  priceBreakdown: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 16,
  },
  totalLabelModal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalPriceModal: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  packagingList: {
    gap: 12,
  },
  packagingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    padding: 12,
  },
  packagingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  packagingTextWrap: {
    flex: 1,
  },
  packagingLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  packagingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
    marginTop: 2,
  },
  bringContainerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  bringContainerText: {
    flex: 1,
    fontSize: 14,
    color: colors.accent,
    marginLeft: 10,
    fontWeight: '500',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    padding: 14,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 4,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noReviewsText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 8,
  },
  noReviewsSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  reviewsList: {
    gap: 12,
  },
  reviewItem: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  moreReviews: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
    paddingTop: 8,
  },
  hybridExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  hybridExplanationText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  hybridPriceSection: {
    paddingVertical: 12,
  },
  hybridPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hybridPriceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  hybridPriceTitleCook: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  hybridPriceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  hybridPriceAmountCook: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  hybridPriceNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  hybridPriceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
