import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>🍲 Des plats faits maison près de chez vous</Text>
          <Text style={styles.welcomeSubtext}>
            Commandez ou proposez facilement des plats entre voisins.
            {'\n'}Sans commission de l’application, paiement direct entre particuliers.
         </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.replace('/' as any)}
          >
            <Ionicons name="search" size={24} color={colors.primary} />
            <Text style={styles.actionTitle}>Voir les plats</Text>
            <Text style={styles.actionSubtitle}>Autour de moi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.secondary + '15' }]}
            onPress={() => router.replace('/add' as any)}
          >
            <Ionicons name="add-circle" size={24} color={colors.secondary} />
            <Text style={styles.actionTitle}>Proposer</Text>
            <Text style={styles.actionSubtitle}>Un plat maison</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>🍲 Plats faits maison</Text>
          <Text style={styles.feature}>📍 Autour de chez vous</Text>
          <Text style={styles.feature}>💸 Sans commission</Text>
        </View>

        <View style={styles.proBox}>
          <Text style={styles.proTitle}>🍽️ Restaurateur ou traiteur ?</Text>
          <Text style={styles.proText}>
            Proposez vos invendus au lieu de les jeter et gagnez en visibilité locale.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/philosophy')}>
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="heart" size={22} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Notre philosophie</Text>
              <Text style={styles.infoSubtitle}>L’esprit de Cuisine entre Voisins</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/hygiene')}>
            <View style={[styles.infoIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Guide d’hygiène</Text>
              <Text style={styles.infoSubtitle}>Règles pour cuisiner en sécurité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem} onPress={() => router.push('/mentions')}>
            <View style={[styles.infoIcon, { backgroundColor: colors.textMuted + '20' }]}>
              <Ionicons name="document-text" size={22} color={colors.textMuted} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Mentions légales</Text>
              <Text style={styles.infoSubtitle}>Informations juridiques</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16 },
  header: { alignItems: 'center', paddingVertical: 18 },
  logoImage: { width: 180, height: 150 },

  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 28,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: colors.textLight,
    marginTop: 10,
    lineHeight: 22,
  },

  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  features: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  feature: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },

  proBox: {
    padding: 16,
    backgroundColor: colors.primary + '12',
    borderRadius: 16,
    marginBottom: 24,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  proText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },

  infoSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  infoSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});