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

export default function HygieneGuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guide d'hygiène</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          <Text style={styles.heroTitle}>Guide express d'hygiène</Text>
          <Text style={styles.heroSubtitle}>Cuisine & Partage</Text>
        </View>

        {/* Section 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="hand-left" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Avant de cuisiner</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Lavez-vous les mains à l'eau chaude et au savon.</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Portez des vêtements propres et couvrez les plaies.</Text>
            </View>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="restaurant" size={20} color={colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Préparation</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Nettoyez les surfaces et ustensiles avant et après usage.</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Évitez le contact entre aliments crus et cuits.</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Indiquez les allergènes et ingrédients principaux.</Text>
            </View>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="flame" size={20} color={colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Cuisson et conservation</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Cuisez correctement viandes, poissons et œufs.</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Conservez les plats frais ({'<'} 4°C) ou maintenez-les chauds (≥ 60°C).</Text>
            </View>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="gift" size={20} color={colors.warning} />
            </View>
            <Text style={styles.sectionTitle}>Service</Text>
          </View>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Utilisez des plats et ustensiles propres.</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ruleText}>Consommez rapidement les plats préparés.</Text>
            </View>
          </View>
        </View>

        {/* Footer message */}
        <View style={styles.footerMessage}>
          <Ionicons name="heart" size={24} color={colors.primary} />
          <Text style={styles.footerText}>
            Respecter ces règles aide à partager vos plats en toute sécurité et à protéger vos consommateurs.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  rulesList: {
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: colors.textLight,
    marginLeft: 10,
    lineHeight: 22,
  },
  footerMessage: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 15,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
});
