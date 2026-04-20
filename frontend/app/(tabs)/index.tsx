import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useMealsStore } from '../../src/stores/mealsStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = ['Tous', 'Plat principal', 'Entrée', 'Dessert', 'Boisson', 'Autre'];
const RADIUS_OPTIONS = [5, 10, 20, 30, 50, 100];

interface Meal {
  is_free?: boolean;
  id: string;
  cook_id: string;
  cook_name: string;
  cook_avatar?: string;
  cook_rating: number;
  title: string;
  description: string;
  price: number;
  portions_left: number;
  category: string;
  images: string[];
  available_date: string;
  available_time: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  distance?: number;
  city?: string;
  neighborhood?: string;
}

export default function ExploreScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedRadius, setSelectedRadius] = useState(10); // Default 30km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const refreshCounter = useMealsStore((state) => state.refreshCounter);

  const loadLocation = async () => {
    // First, check if user has location in profile
    if (user?.location?.lat && user?.location?.lng) {
      setUserLocation({
        lat: user.location.lat,
        lng: user.location.lng,
      });
      setLocationLoaded(true);
      return;
    }
    
    // Otherwise, request browser location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Location error:', error);
    }
    setLocationLoaded(true);
  };

  const loadMeals = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'Tous') {
        params.category = selectedCategory;
      }
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.max_distance = selectedRadius; // Send the selected radius to backend
      }
      const data = await api.getMeals(params);
      setMeals(data);
    } catch (error) {
      console.log('Load meals error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, [user]);

  useEffect(() => {
    loadMeals();
  }, [selectedCategory, userLocation, refreshCounter, selectedRadius]); // Added selectedRadius dependency

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeals();
  }, [selectedCategory, userLocation]);

  // Memoize search query to prevent re-renders
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Debounce search to avoid re-renders while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  const filteredMeals = meals.filter((meal) => {
    // Filter by search query
    const matchesSearch = meal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.cook_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by radius if user has location and meal has distance
    const matchesRadius = !userLocation || !meal.distance || meal.distance <= selectedRadius;
    
    return matchesSearch && matchesRadius;
  });

  const renderMealCard = ({ item }: { item: Meal }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/meal/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
  {item.images && item.images.length > 0 ? (
    <Image
      source={{
        uri: item.images[0].startsWith('data:')
          ? item.images[0]
          : `data:image/jpeg;base64,${item.images[0]}`
      }}
      style={styles.cardImage}
      resizeMode="contain"
    />
  ) : (
    <View style={styles.placeholderImage}>
      <Ionicons name="restaurant-outline" size={40} color={colors.textMuted} />
    </View>
  )}

  {item.is_vegetarian && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>🌱</Text>
    </View>
  )}
</View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cookName} numberOfLines={1}>{item.cook_name}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={styles.rating}>{item.cook_rating.toFixed(1)}</Text>
          {/* Display location: neighborhood takes priority, then city, then distance */}
          {(item.neighborhood || (item.distance !== null && item.distance !== undefined)) && (
            <>
              <Text style={styles.separator}>•</Text>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={styles.locationText}>
                {item.neighborhood || ''}
                {(item.distance !== null && item.distance !== undefined) ? `${item.neighborhood ? ' • ' : ''}${item.distance} km` : ''}
              </Text>
            </>
          )}
        </View>
        <View style={styles.cardFooter}>
          {item.is_free ? (
  <Text style={[styles.price, { color: 'green', fontWeight: 'bold' }]}>
    Offert
  </Text>
) : (
  <Text style={styles.price}>
    {item.price.toFixed(2)} €
  </Text>
)}
          <Text style={styles.portions}>{item.portions_left} dispo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.greeting}>Bonjour{user ? `, ${user.name.split(' ')[0]}` : ''} !</Text>
          <Text style={styles.title}>Qu'est-ce qui vous fait envie ?</Text>
        </View>
      </View>

      {/* Location status banner */}
      {!userLocation && (
        <TouchableOpacity style={styles.locationBanner} onPress={loadLocation}>
          <Ionicons name="location-outline" size={18} color={colors.warning} />
          <Text style={styles.locationBannerText}>
            Activez la localisation pour voir les plats près de chez vous
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}

      {userLocation && (
        <View style={styles.locationActiveBanner}>
          <Ionicons name="location" size={16} color={colors.success} />
          <Text style={styles.locationActiveText}>
            Plats à moins de {selectedRadius} km de vous
          </Text>
        </View>
      )}

      {/* Radius Selector */}
      {userLocation && (
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>Rayon de recherche :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  selectedRadius === radius && styles.radiusButtonActive,
                ]}
                onPress={() => setSelectedRadius(radius)}
              >
                <Text
                  style={[
                    styles.radiusText,
                    selectedRadius === radius && styles.radiusTextActive,
                  ]}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat ou un cuisinier..."
          placeholderTextColor={colors.textMuted}
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {localSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setLocalSearchQuery(''); setSearchQuery(''); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoriesContainer}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des repas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header - Outside FlatList to prevent re-renders */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.title}>Qu'est-ce qui vous fait envie ?</Text>
          </View>
        </View>

        {!userLocation && (
          <TouchableOpacity style={styles.locationBanner} onPress={loadLocation}>
            <Ionicons name="location-outline" size={18} color={colors.warning} />
            <Text style={styles.locationBannerText}>
              Activez la localisation pour voir les plats près de chez vous
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.warning} />
          </TouchableOpacity>
        )}

        {userLocation && (
          <View style={styles.locationActiveBanner}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={styles.locationActiveText}>
              Plats à moins de {selectedRadius} km de vous
            </Text>
          </View>
        )}

        {/* Radius Selector */}
        {userLocation && (
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusLabel}>Rayon de recherche :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusOptions}>
              {RADIUS_OPTIONS.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusButton,
                    selectedRadius === radius && styles.radiusButtonActive,
                  ]}
                  onPress={() => setSelectedRadius(radius)}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      selectedRadius === radius && styles.radiusTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Search Bar - Fixed, won't re-render */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un plat ou un cuisinier..."
            placeholderTextColor={colors.textMuted}
            value={localSearchQuery}
            onChangeText={setLocalSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {localSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setLocalSearchQuery(''); setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meals List - Separate from search */}
      <FlatList
        data={filteredMeals}
        renderItem={renderMealCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun repas disponible</Text>
            <Text style={styles.emptyText}>
              Soyez le premier à partager votre cuisine !
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedHeader: {
    backgroundColor: colors.background,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  locationBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    marginLeft: 10,
    fontWeight: '500',
  },
  locationActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  locationActiveText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoriesContainer: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  categoryTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
  width: '100%',
  height: 160,
  backgroundColor: colors.backgroundDark,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
},

cardImage: {
  width: '100%',
  height: 160,
},

placeholderImage: {
  width: '100%',
  height: 160,
  alignItems: 'center',
  justifyContent: 'center',
},
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cookName: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  rating: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  separator: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  distance: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  cityText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  portions: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  radiusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radiusLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  radiusTextActive: {
    color: colors.white,
  },
});
