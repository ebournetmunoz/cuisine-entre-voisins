import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../src/theme/colors';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

const CATEGORIES = ['Plat principal', 'Entrée', 'Dessert', 'Boisson', 'Autre'];

export default function AddMealScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [portions, setPortions] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [allergens, setAllergens] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [containerProvided, setContainerProvided] = useState(false);
  const [bringContainer, setBringContainer] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const formatDate = (date?: Date | null) => {
    if (!date) return '';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date?: Date | null) => {
    if (!date) return '';

    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddImage = async (useCamera: boolean) => {
    try {
      let permissionResult;

      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.status !== 'granted') {
          if (Platform.OS === 'web') {
            window.alert("Autorisez l'accès à la caméra ou utilisez la galerie");
          } else {
            Alert.alert('Permission requise', "Autorisez l'accès à la caméra");
          }
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];

          if (asset.base64) {
            setImages((currentImages) => [
              ...currentImages,
              `data:image/jpeg;base64,${asset.base64}`,
            ]);
          } else if (asset.uri) {
            setImages((currentImages) => [...currentImages, asset.uri]);
          }
        }
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== 'granted') {
          if (Platform.OS === 'web') {
            window.alert("Autorisez l'accès aux photos");
          } else {
            Alert.alert('Permission requise', "Autorisez l'accès aux photos");
          }
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];

          if (asset.base64) {
            setImages((currentImages) => [
              ...currentImages,
              `data:image/jpeg;base64,${asset.base64}`,
            ]);
          } else if (asset.uri) {
            setImages((currentImages) => [...currentImages, asset.uri]);
          }
        }
      }
    } catch (error) {
      console.log('Image picker error:', error);

      if (Platform.OS === 'web') {
        window.alert("Impossible de sélectionner l'image");
      } else {
        Alert.alert('Erreur', "Impossible de sélectionner l'image");
      }
    }
  };

  const showImageOptions = () => {
    Alert.alert('Ajouter une photo', 'Choisissez une option', [
      {
        text: 'Prendre une photo',
        onPress: () => handleAddImage(true),
      },
      {
        text: 'Choisir dans la galerie',
        onPress: () => handleAddImage(false),
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((currentImages) => currentImages.filter((_, i) => i !== index));
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (date) {
      setSelectedTime(date);
    }
  };

  const handleSubmit = async () => {
    const priceNum = parseFloat(price.replace(',', '.'));
    const portionsNum = parseInt(portions, 10);

    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du plat');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description');
      return;
    }

    if (!category) {
      Alert.alert('Erreur', 'Veuillez choisir une catégorie');
      return;
    }

    if (!isFree && (isNaN(priceNum) || priceNum <= 0)) {
      Alert.alert('Erreur', 'Veuillez renseigner un prix valide');
      return;
    }

    if (!portions.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nombre de portions');
      return;
    }

    if (isNaN(portionsNum) || portionsNum <= 0) {
      Alert.alert('Erreur', 'Nombre de portions invalide');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Erreur', 'Veuillez choisir une date de disponibilité');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Erreur', 'Veuillez choisir une heure de disponibilité');
      return;
    }

    if (!user?.location?.address) {
      Alert.alert(
        'Profil incomplet',
        'Complétez votre adresse dans votre profil pour publier un plat.'
      );
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      
      const availableDate = selectedDate.toLocaleDateString('fr-FR');
      const availableTime = formatTime(selectedTime);

      const mealData = {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : priceNum,
        portions: portionsNum,
        category,
        images,
        available_date: availableDate,
        available_time: availableTime,
        allergens: allergens
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a),
        is_vegetarian: isVegetarian,
        is_vegan: isVegan,
        is_free: isFree,
        container_provided: containerProvided,
        bring_container: bringContainer,
        collection_instructions: collectionInstructions.trim(),
        delivery_available: deliveryAvailable,
      };

      await api.createMeal(mealData);

      setTitle('');
      setDescription('');
      setPrice('');
      setPortions('');
      setCategory('');
      setImages([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setAllergens('');
      setIsVegetarian(false);
      setIsVegan(false);
      setContainerProvided(false);
      setBringContainer(false);
      setDeliveryAvailable(false);
      setCollectionInstructions('');
      setIsFree(false);

      setSuccessMessage('Votre repas a été publié avec succès !');

      setTimeout(() => {
        router.push('/(tabs)');
      }, 1500);
    } catch (error: any) {
      console.log('Submit error:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Publication impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Partager un repas</Text>
            <Text style={styles.subtitle}>Faites découvrir votre cuisine !</Text>
          </View>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos de votre plat</Text>
            <View style={styles.imagesContainer}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 4 && (
                <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                  <Ionicons name="camera-outline" size={28} color={colors.primary} />
                  <Text style={styles.addImageText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nom du plat *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Bœuf bourguignon"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre plat, les ingrédients utilisés..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Prix par portion (€) *</Text>
              <TextInput
                style={[styles.input, isFree && styles.inputDisabled]}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                value={isFree ? '0' : price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                editable={!isFree}
              />
            </View>

            <View style={{ width: 16 }} />

            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Portions *</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                value={portions}
                onChangeText={setPortions}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Plat offert</Text>
            <TouchableOpacity
              onPress={() => {
                const value = !isFree;
                setIsFree(value);
                if (value) {
                  setPrice('0');
                } else {
                  setPrice('');
                }
              }}
              style={[styles.freeButton, isFree && styles.freeButtonActive]}
            >
              <Text style={styles.freeButtonText}>{isFree ? 'Oui (Offert)' : 'Non'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date de disponibilité *</Text>

            {Platform.OS === 'web' ? (
              <View style={styles.webInputContainer}>
                <Ionicons name="calendar" size={22} color={colors.primary} />
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  style={webDateInputStyle}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={22} color={colors.primary} />

                <Text style={[styles.datePickerText, !selectedDate && styles.placeholderText]}>
                  {selectedDate ? formatDate(selectedDate) : 'Choisir une date'}
                </Text>

                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Heure de disponibilité *</Text>

            {Platform.OS === 'web' ? (
              <View style={styles.webInputContainer}>
                <Ionicons name="time" size={22} color={colors.primary} />
                <input
                  type="time"
                  value={
                    selectedTime
                      ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime
                          .getMinutes()
                          .toString()
                          .padStart(2, '0')}`
                      : ''
                  }
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date();
                    newTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                    setSelectedTime(newTime);
                  }}
                  style={webDateInputStyle}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={22} color={colors.primary} />

                <Text style={[styles.datePickerText, !selectedTime && styles.placeholderText]}>
                  {selectedTime ? formatTime(selectedTime) : 'Choisir une heure'}
                </Text>

                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {Platform.OS === 'ios' && showDatePicker && (
            <Modal transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerCancel}>Annuler</Text>
                    </TouchableOpacity>

                    <Text style={styles.pickerTitle}>Choisir la date</Text>

                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>OK</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={selectedDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                      locale="fr-FR"
                      style={styles.picker}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'ios' && showTimePicker && (
            <Modal transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.pickerModal}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.pickerCancel}>Annuler</Text>
                    </TouchableOpacity>

                    <Text style={styles.pickerTitle}>Choisir l'heure</Text>

                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.pickerDone}>OK</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={selectedTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={onTimeChange}
                      locale="fr-FR"
                      style={styles.picker}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={selectedTime || new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
              is24Hour={true}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Allergènes</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : gluten, lactose, fruits à coque..."
              placeholderTextColor={colors.textMuted}
              value={allergens}
              onChangeText={setAllergens}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Régime alimentaire</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, isVegetarian && styles.checkboxActive]}
                onPress={() => setIsVegetarian(!isVegetarian)}
              >
                <Text style={styles.checkboxEmoji}>🌱</Text>
                <Text style={[styles.checkboxText, isVegetarian && styles.checkboxTextActive]}>
                  Végétarien
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkbox, isVegan && styles.checkboxActive]}
                onPress={() => {
                  setIsVegan(!isVegan);
                  if (!isVegan) setIsVegetarian(true);
                }}
              >
                <Text style={styles.checkboxEmoji}>🥬</Text>
                <Text style={[styles.checkboxText, isVegan && styles.checkboxTextActive]}>
                  Végan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Emballages</Text>
            <View style={styles.packagingContainer}>
              <TouchableOpacity
                style={[styles.packagingOption, containerProvided && styles.packagingOptionActive]}
                onPress={() => setContainerProvided(!containerProvided)}
              >
                <Ionicons
                  name={containerProvided ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={containerProvided ? colors.primary : colors.textMuted}
                />
                <View style={styles.packagingTextContainer}>
                  <Text
                    style={[styles.packagingText, containerProvided && styles.packagingTextActive]}
                  >
                    Récipient fourni
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.packagingOption, bringContainer && styles.packagingOptionActive]}
                onPress={() => setBringContainer(!bringContainer)}
              >
                <Ionicons
                  name={bringContainer ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={bringContainer ? colors.accent : colors.textMuted}
                />
                <View style={styles.packagingTextContainer}>
                  <Text style={[styles.packagingText, bringContainer && { color: colors.accent }]}>
                    Apportez votre contenant
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
<View style={styles.section}>
  <Text style={styles.label}>Remise du plat</Text>

  <View style={styles.packagingContainer}>
    <TouchableOpacity
      style={[styles.packagingOption, deliveryAvailable && styles.packagingOptionActive]}
      onPress={() => setDeliveryAvailable(!deliveryAvailable)}
    >
      <Ionicons
        name={deliveryAvailable ? 'checkbox' : 'square-outline'}
        size={22}
        color={deliveryAvailable ? colors.primary : colors.textMuted}
      />

      <View style={styles.packagingTextContainer}>
        <Text
          style={[styles.packagingText, deliveryAvailable && styles.packagingTextActive]}
        >
          Livraison possible à proximité
        </Text>

        <Text style={styles.deliveryHint}>
          À organiser directement avec le cuisinier via le chat.
        </Text>
      </View>
    </TouchableOpacity>
  </View>
</View>
          <View style={styles.section}>
            <Text style={styles.label}>Instructions de collecte</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex : sonnez à l'interphone, je descendrai avec le plat..."
              placeholderTextColor={colors.textMuted}
              value={collectionInstructions}
              onChangeText={setCollectionInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="restaurant" size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>Publier le repas</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const webDateInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  fontSize: '16px',
  border: 'none',
  backgroundColor: 'transparent',
  color: colors.text,
  marginLeft: '12px',
  outline: 'none',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  successText: {
    flex: 1,
    fontSize: 15,
    color: colors.success,
    marginLeft: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: '#eee',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  addImageText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textLight,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressIcon: {
    marginRight: 12,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 14,
  },
  addressHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  addressHintSecure: {
    flex: 1,
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  pickerCancel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  picker: {
    width: 350,
    height: 216,
  },
  webInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxActive: {
    backgroundColor: colors.secondary + '15',
    borderColor: colors.secondary,
  },
  checkboxEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.textLight,
  },
  checkboxTextActive: {
    color: colors.secondary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  freeButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center',
  },
  freeButtonActive: {
    backgroundColor: 'green',
  },
  freeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  packagingContainer: {
    gap: 10,
  },
  packagingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packagingOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '40',
  },
  packagingTextContainer: {
    marginLeft: 12,
  },
  packagingText: {
    fontSize: 15,
    color: colors.textLight,
  },
  packagingTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  deliveryHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});