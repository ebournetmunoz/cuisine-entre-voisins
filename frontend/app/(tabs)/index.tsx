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
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useMealsStore } from '../../src/stores/mealsStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = ['Tous', 'Plat principal', 'Entrée', 'Dessert', 'Boisson', 'Autre'];
const RADIUS_OPTIONS = [5, 10, 20, 30, 50, 100];

const DATE_FILTERS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'all', label: 'Tous' },
] as const;

type DateFilter = typeof DATE_FILTERS[number]['key'];

interface Meal {
  is_free?: boolean;
  id: string;
  cook_id: string;
  cook_name: string;
  cook_avatar?: string;
  cook_rating: number;
  title: string;
  description: string;
  price: number | null;
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

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseMealDate = (value?: string) => {
  if (!value) return null;

  if (value.includes('/')) {
    const [day, month, year] = value.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
};

const isMealInDateFilter = (mealDateValue: string, filter: DateFilter) => {
  if (filter === 'all') return true;

  const mealDate = parseMealDate(mealDateValue);
  if (!mealDate || Number.isNaN(mealDate.getTime())) return true;

  const today = startOfDay(new Date());
  const mealDay = startOfDay(mealDate);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  if (filter === 'today') {
    return mealDay.getTime() === today.getTime();
  }

  if (filter === 'tomorrow') {
    return mealDay.getTime() === tomorrow.getTime();
  }

  if (filter === 'week') {
    return mealDay >= today && mealDay <= endOfWeek;
  }

  return true;
};

export default function ExploreScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const refreshCounter = useMealsStore((state) => state.refreshCounter);

  const loadLocation = async () => {
  if (user?.location?.lat && user?.location?.lng) {
    setUserLocation({
      lat: user.location.lat,
      lng: user.location.lng,
    });
    return;
  }

  if (user?.latitude && user?.longitude) {
    setUserLocation({
      lat: user.latitude,
      lng: user.longitude,
    });
    return;
  }

  setUserLocation(null);
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
        params.max_distance = selectedRadius;
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
  }, [selectedCategory, userLocation, refreshCounter, selectedRadius]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMeals();
  }, [selectedCategory, userLocation, selectedRadius]);

  const filteredMeals = meals.filter((meal) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      meal.title.toLowerCase().includes(search) ||
      meal.cook_name.toLowerCase().includes(search);

    const matchesRadius =
      !userLocation || meal.distance === undefined || meal.distance <= selectedRadius;

    const matchesDate = isMealInDateFilter(meal.available_date, selectedDateFilter);

    return matchesSearch && matchesRadius && matchesDate;
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
                : `data:image/jpeg;base64,${item.images[0]}`,
            }}
            style={styles.cardImage}
            resizeMode="cover"
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
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.cardRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cookName} numberOfLines={1}>
            {item.cook_name}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={styles.rating}>
            {item.cook_rating === null || item.cook_rating === undefined
              ? '0.0'
              : Number(item.cook_rating).toFixed(1)}
          </Text>

          {(item.neighborhood || item.city || item.distance !== undefined) && (
            <>
              <Text style={styles.separator}>•</Text>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={2}>
                {item.neighborhood || item.city || 'Près de vous'}
                {item.distance !== undefined && item.distance !== null
                  ? ` • ${Number(item.distance).toFixed(1)} km`
                  : ''}
              </Text>
            </>
          )}
        </View>

        <View style={styles.cardFooter}>
          {item.is_free || item.price === null || item.price === undefined ? (
            <Text style={styles.freePrice}>Offert</Text>
          ) : (
            <Text style={styles.price}>{Number(item.price).toFixed(2)} €</Text>
          )}

          <Text style={styles.portions}>{item.portions_left} dispo</Text>
        </View>
      </View>
    </TouchableOpacity>
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
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.title}>Qu'est-ce qui vous fait envie ?</Text>
        </View>

        {!userLocation ? (
          <TouchableOpacity style={styles.locationBanner} onPress={loadLocation}>
            <Ionicons name="location-outline" size={18} color={colors.warning} />
            <Text style={styles.locationBannerText}>
              Activez votre position pour voir les plats autour de vous
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.warning} />
          </TouchableOpacity>
        ) : (
          <View style={styles.locationActiveBanner}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={styles.locationActiveText}>
              Plats à moins de {selectedRadius} km de vous
            </Text>
          </View>
        )}

        <View style={styles.compactFiltersRow}>
  <TouchableOpacity
    style={styles.compactFilterButton}
    onPress={() => {
      setShowDateOptions(!showDateOptions);
      setShowRadiusOptions(false);
    }}
  >
    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
    <Text style={styles.compactFilterText}>
      {DATE_FILTERS.find((f) => f.key === selectedDateFilter)?.label}
    </Text>
    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.compactFilterButton}
    onPress={() => {
      setShowRadiusOptions(!showRadiusOptions);
      setShowDateOptions(false);
    }}
  >
    <Ionicons name="navigate-outline" size={16} color={colors.primary} />
    <Text style={styles.compactFilterText}>
      Rayon : {selectedRadius} km
    </Text>
    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
  </TouchableOpacity>
</View>

{showDateOptions && (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.dropdownOptions}
  >
    {DATE_FILTERS.map((filter) => (
      <TouchableOpacity
        key={filter.key}
        style={[
          styles.dropdownChip,
          selectedDateFilter === filter.key && styles.dropdownChipActive,
        ]}
        onPress={() => {
          setSelectedDateFilter(filter.key);
          setShowDateOptions(false);
        }}
      >
        <Text
          style={[
            styles.dropdownChipText,
            selectedDateFilter === filter.key && styles.dropdownChipTextActive,
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
)}

{showRadiusOptions && (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.dropdownOptions}
  >
    {RADIUS_OPTIONS.map((radius) => (
      <TouchableOpacity
        key={radius}
        style={[
          styles.dropdownChip,
          selectedRadius === radius && styles.dropdownChipActive,
        ]}
        onPress={() => {
          setSelectedRadius(radius);
          setShowRadiusOptions(false);
        }}
      >
        <Text
          style={[
            styles.dropdownChipText,
            selectedRadius === radius && styles.dropdownChipTextActive,
          ]}
        >
          {radius} km
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
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
            returnKeyType="search"
          />

          {localSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setLocalSearchQuery('');
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

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

      <FlatList
        data={filteredMeals}
        renderItem={renderMealCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun repas disponible</Text>
            <Text style={styles.emptyText}>
              Aucun plat ne correspond à ce rayon ou à cette date.
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
    marginHorizontal: 16,
    marginBottom: 10,
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
    marginHorizontal: 16,
    marginBottom: 10,
  },
  locationActiveText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    fontWeight: '600',
  },
  filterBlock: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  smallChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  smallChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  smallChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: colors.white,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  dateChipActive: {
    backgroundColor: colors.secondary || colors.primary,
    borderColor: colors.secondary || colors.primary,
  },
  dateChipText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginHorizontal: 16,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 4,
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
    fontWeight: '600',
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
    fontWeight: '700',
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
  locationText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
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
  freePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  portions: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  compactFiltersRow: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  marginBottom: 10,
  gap: 10,
},

compactFilterButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.card,
  borderRadius: 18,
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: colors.border,
},

compactFilterText: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.text,
  marginHorizontal: 6,
},

dropdownOptions: {
  paddingHorizontal: 16,
  paddingBottom: 10,
},

dropdownChip: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 18,
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  marginRight: 8,
},

dropdownChipActive: {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
},

dropdownChipText: {
  fontSize: 13,
  color: colors.textLight,
  fontWeight: '600',
},

dropdownChipTextActive: {
  color: colors.white,
},
});