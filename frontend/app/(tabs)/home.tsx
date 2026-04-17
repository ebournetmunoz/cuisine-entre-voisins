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
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Bienvenue{user?.name ? `, ${user.name.split(' ')[0]}` : ''} !
          </Text>
          <Text style={styles.welcomeSubtext}>
            Découvrez les plats de vos voisins ou partagez vos créations culinaires.
          </Text>
        </View>

        {/* Quick Actions */}
<View style={styles.quickActions}>

  <TouchableOpacity 
  style={[styles.actionCard, { backgroundColor: colors.primary + '15' }]}
  onPress={() => {
    console.log('Explorer press');
    router.replace('/' as any);
  }}
>
  <Ionicons name="search" size={24} color={colors.primary} />
  <Text style={styles.actionTitle}>Explorer</Text>
  <Text style={styles.actionSubtitle}>Découvrir les plats</Text>
</TouchableOpacity>

  <TouchableOpacity 
  style={[styles.actionCard, { backgroundColor: colors.secondary + '15' }]}
  onPress={() => router.replace('/add' as any)}
>
  <Ionicons name="add" size={24} color={colors.secondary} />
  <Text style={styles.actionTitle}>Cuisiner</Text>
  <Text style={styles.actionSubtitle}>Proposer un plat</Text>
</TouchableOpacity>

</View>

        {/* Info Links */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => router.push('/philosophy')}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="heart" size={22} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Notre philosophie</Text>
              <Text style={styles.infoSubtitle}>L'esprit de Cuisine entre voisins</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => router.push('/hygiene')}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Guide d'hygiène</Text>
              <Text style={styles.infoSubtitle}>Règles pour cuisiner en sécurité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => router.push('/mentions')}
          >
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoImage: {
    width: 220,
    height: 200,
  },
  logo: {
    fontSize: 72,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 24,
  },
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
  infoContent: {
    flex: 1,
  },
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
