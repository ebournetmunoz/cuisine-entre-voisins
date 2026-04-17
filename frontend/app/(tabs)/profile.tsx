import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { useMealsStore } from '../../src/stores/mealsStore';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [myMeals, setMyMeals] = useState<any[]>([]);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const triggerRefresh = useMealsStore((state) => state.triggerRefresh);

  useEffect(() => {
    loadMyMeals();
  }, []);

  const loadMyMeals = async () => {
    try {
      const meals = await api.getMyMeals();
      setMyMeals(meals);
    } catch (error) {
      console.log('Load meals error:', error);
    }
  };

  const handleDeleteMeal = (mealId: string, mealTitle: string) => {
  Alert.alert(
    'Supprimer le plat',
    `Supprimer "${mealTitle}" ?`,
    [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          setDeletingMealId(mealId);
          api.deleteMeal(mealId)
            .then(() => {
              loadMyMeals();
              triggerRefresh();
            })
            .catch((error: any) => {
              Alert.alert(
                'Erreur',
                error.response?.data?.detail || 'Impossible de supprimer ce plat'
              );
            })
            .finally(() => {
              setDeletingMealId(null);
            });
        },
      },
    ]
  );
};

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
      if (confirmed) {
        await logout();
        window.location.href = '/login';
      }
    } else {
      Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation dans les paramètres');
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      await updateUser({
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      });
      Alert.alert('Succès', 'Position mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer la position');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateUser({ name, bio, phone, address, neighborhood });
      setEditMode(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64 = result.assets[0].base64;

      if (!base64) {
        console.log('No base64 image data found');
        return;
      }

      setLocalAvatar(uri);

      const updatedUser = await api.updateProfile({
        avatar: `data:image/jpeg;base64,${base64}`,
      });

      updateUser(updatedUser);
    }
  } catch (error) {
    console.log('Image picker error:', error);
  }
};

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil</Text>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            <Ionicons
              name={editMode ? 'arrow-back' : 'create-outline'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

<View style={styles.profileCard}>
  <TouchableOpacity style={styles.avatarLarge} onPress={pickImage}>
  {localAvatar ? (
    <Image
      source={{ uri: localAvatar }}
      style={styles.avatarImage}
    />
  ) : user?.avatar ? (
    <Image
      source={{ uri: user.avatar }}
      style={styles.avatarImage}
    />
  ) : (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarText}>
        {getInitials(user?.name || 'U')}
      </Text>
    </View>
  )}
</TouchableOpacity>

  <Text style={styles.avatarHint}>
    Appuyer pour changer la photo
  </Text>

          {editMode ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={name}
                onChangeText={setName}
                placeholder="Nom"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.editInput, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio (parlez de vous, votre cuisine...)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.editInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Téléphone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
              <View style={styles.addressSection}>
                <View style={styles.addressLabelRow}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                  <Text style={styles.addressLabel}>Adresse (pour les cuisiniers)</Text>
                </View>
                <TextInput
                  style={[styles.editInput, styles.addressInput]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ex: 12 rue de la Paix, 66000 Perpignan"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.neighborhoodRow}>
                  <Ionicons name="business-outline" size={18} color={colors.primary} />
                  <Text style={styles.addressLabel}>Quartier (visible publiquement)</Text>
                </View>
                <TextInput
                  style={[styles.editInput, styles.addressInput]}
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="Ex: Centre-ville, Saint-Jacques..."
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.addressHintRow}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                  <Text style={styles.addressHintText}>
                    Seuls la ville et le quartier seront visibles. L'adresse complète sera partagée après confirmation des commandes.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.bio && <Text style={styles.profileBio}>{user.bio}</Text>}

              <View style={styles.statsContainer}>
  <View style={styles.statItem}>
    <Ionicons name="star" size={20} color={colors.accent} />
    <Text style={styles.statValue}>
      {typeof user?.rating === 'number' ? user.rating.toFixed(1) : '0.0'}
    </Text>
    <Text style={styles.statLabel}>Note</Text>
  </View>

  <View style={styles.statDivider} />

  <View style={styles.statItem}>
    <Ionicons name="restaurant" size={20} color={colors.secondary} />
    <Text style={styles.statValue}>{myMeals.length}</Text>
    <Text style={styles.statLabel}>Plats</Text>
  </View>

  <View style={styles.statDivider} />

  <TouchableOpacity
    style={styles.statItem}
    onPress={() => router.push('/reviews' as any)}
  >
    <Ionicons name="chatbubbles" size={20} color={colors.primary} />
    <Text style={styles.statValue}>{user?.reviews_count || 0}</Text>
    <Text style={styles.statLabel}>Avis</Text>
  </TouchableOpacity>
</View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={handleUpdateLocation}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="location-outline" size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.menuItemText}>Ma position</Text>
              <Text style={styles.menuItemSubtext}>
                {user?.location ? 'Position enregistrée' : 'Non définie'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {myMeals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleText}>Mes plats publiés ({myMeals.length})</Text>
            {myMeals.map((meal: any) => (
              <View key={meal.id} style={styles.mealItemWithDelete}>
                <TouchableOpacity
                  style={styles.mealInfo}
                  onPress={() => router.push(`/meal/${meal.id}` as any)}
                >
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <Text style={styles.mealDetails}>
                    {meal.price.toFixed(2)} € • {meal.portions_left} portions
                  </Text>
                  <View style={[styles.mealStatusBadge, { backgroundColor: meal.is_visible ? colors.success + '15' : colors.warning + '15' }]}>
                    <Text style={[styles.mealStatusText, { color: meal.is_visible ? colors.success : colors.warning }]}>
                      {meal.is_visible ? 'En ligne' : 'Masqué / expiré'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteMealButton}
                  onPress={() => handleDeleteMeal(meal.id, meal.title)}
                  disabled={deletingMealId === meal.id}
                  data-testid={`delete-meal-${meal.id}`}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  {deletingMealId === meal.id ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Cuisine entre voisins v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  profileCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarLarge: {
  width: 96,
  height: 96,
  borderRadius: 48,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
  overflow: 'hidden',
  },

  avatarImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
  },

  avatarFallback: {
  width: '100%',
  height: '100%',
  borderRadius: 48,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primary,
  },

  avatarText: {
  fontSize: 30,
  fontWeight: '700',
  color: colors.white,
  },

  avatarHint: {
  fontSize: 12,
  color: colors.textMuted,
  marginTop: 4,
  marginBottom: 12,
  textAlign: 'center',

  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  editForm: {
    width: '100%',
    marginTop: 8,
  },
  editInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  neighborhoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 6,
  },
  addressInput: {
    marginBottom: 6,
  },
  addressHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  addressHintText: {
    flex: 1,
    fontSize: 11,
    color: colors.success,
    marginLeft: 6,
    lineHeight: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  mealItemWithDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  mealDetails: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  mealStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
  },
  mealStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteMealButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '15',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 100,
  },
});