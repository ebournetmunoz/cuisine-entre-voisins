import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';

export default function PhilosophyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notre philosophie</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🏡</Text>
          <Text style={styles.heroTitle}>Cuisine entre voisins</Text>
          <Text style={styles.heroSubtitle}>La cuisine du cœur, près de chez vous</Text>
        </View>

        {/* Main Philosophy */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={28} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Partage et convivialité</Text>
          <Text style={styles.paragraph}>
            Cette application permet de partager des repas faits maison entre particuliers.
          </Text>
          <Text style={styles.paragraph}>
            Des personnes qui aiment cuisiner peuvent proposer un plat qu'elles ont préparé chez elles. Les utilisateurs intéressés peuvent réserver ce plat et venir le récupérer directement chez le cuisinier à l'heure indiquée.
          </Text>
        </View>

        {/* Objective */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="people" size={28} color={colors.secondary} />
          </View>
          <Text style={styles.cardTitle}>Notre objectif</Text>
          <Text style={styles.paragraph}>
            L'objectif de cette plateforme est de favoriser la convivialité, la cuisine maison et l'entraide entre voisins.
          </Text>
        </View>

        {/* Spirit */}
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="heart" size={28} color={colors.accent} />
          </View>
          <Text style={styles.cardTitle}>L'esprit de partage</Text>
          <Text style={styles.paragraph}>
            Les cuisiniers ne sont pas présents pour réaliser un bénéfice ou exercer une activité commerciale. Ils peuvent simplement demander une participation aux frais afin de contribuer au coût des ingrédients et à la préparation du plat.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.valuesSection}>
          <Text style={styles.valuesTitle}>Nos valeurs</Text>
          <View style={styles.valuesGrid}>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <Text style={styles.valueText}>Confiance</Text>
            </View>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="gift" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.valueText}>Partage</Text>
            </View>
            <View style={styles.valueItem}>
              <View style={[styles.valueIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="happy" size={24} color={colors.accent} />
              </View>
              <Text style={styles.valueText}>Plaisir</Text>
            </View>
          </View>
        </View>

        {/* Closing */}
        <View style={styles.closingSection}>
          <Text style={styles.closingEmoji}>🍽️</Text>
          <Text style={styles.closingText}>
            L'esprit de cette application repose sur la confiance, le partage et le plaisir de la cuisine faite maison.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 24,
    marginBottom: 12,
  },
  valuesSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  valuesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  valuesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  valueItem: {
    alignItems: 'center',
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  closingSection: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '15',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  closingEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  closingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
});
