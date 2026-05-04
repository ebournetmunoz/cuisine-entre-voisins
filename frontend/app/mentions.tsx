import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';

const CONTACT_EMAIL = 'cuisineentrevoisins@gmail.com';

export default function LegalScreen() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions légales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Ionicons name="document-text" size={48} color={colors.primary} />
          <Text style={styles.heroTitle}>Mentions légales</Text>
          <Text style={styles.heroSubtitle}>Cuisine entre Voisins</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet de l'application</Text>
          <Text style={styles.paragraph}>
            Application permettant de partager des plats faits maison entre personnes proches géographiquement.
            {'\n\n'}
            Les utilisateurs peuvent proposer ou réserver des plats dans un cadre convivial et local. Les montants demandés servent uniquement à couvrir les frais des ingrédients, sans commission prélevée par l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsabilités</Text>

          <View style={styles.responsibilityItem}>
            <View style={[styles.respIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="restaurant" size={18} color={colors.secondary} />
            </View>
            <View style={styles.respContent}>
              <Text style={styles.respTitle}>Cuisiniers</Text>
              <Text style={styles.respText}>
                Sont responsables de la préparation des plats, du respect des règles d'hygiène et de la communication des informations liées aux allergènes.
              </Text>
            </View>
          </View>

          <View style={styles.responsibilityItem}>
            <View style={[styles.respIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <View style={styles.respContent}>
              <Text style={styles.respTitle}>Consommateurs</Text>
              <Text style={styles.respText}>
                Choisissent et consomment les plats sous leur propre responsabilité.
              </Text>
            </View>
          </View>

          <View style={styles.responsibilityItem}>
            <View style={[styles.respIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="phone-portrait" size={18} color={colors.accent} />
            </View>
            <View style={styles.respContent}>
              <Text style={styles.respTitle}>Application</Text>
              <Text style={styles.respText}>
                Agit uniquement comme intermédiaire de mise en relation et ne participe ni à la préparation, ni à la vente, ni au paiement des plats.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données personnelles</Text>
          <Text style={styles.paragraph}>
            Les informations collectées sont utilisées uniquement pour permettre la mise en relation entre les utilisateurs.
            {'\n\n'}
            Elles ne sont ni vendues, ni partagées à des tiers.
          </Text>
        </View>

        <View style={styles.disclaimerSection}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={styles.disclaimerTitle}>Avertissement</Text>
          <Text style={styles.disclaimerText}>
            Chaque utilisateur est responsable des plats qu'il propose, achète ou consomme.
            {'\n\n'}
            Cuisine entre Voisins ne peut être tenue responsable en cas de problème lié à la qualité, à la conservation ou à la consommation des plats.
          </Text>
        </View>

        <View style={styles.editorSmallCard}>
          <Text style={styles.editorSmallTitle}>Éditeur</Text>
          <Text style={styles.editorSmallText}>Cuisine & Partage – Micro-entrepreneur</Text>
          <Text style={styles.editorSmallText}>SIRET : 10243538500012</Text>
          <Text style={styles.editorSmallText}>Adresse : 66670 Bages</Text>

          <TouchableOpacity onPress={handleEmailPress}>
            <Text style={[styles.editorSmallText, styles.link]}>
              Contact : {CONTACT_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1, paddingHorizontal: 16 },
  heroSection: { alignItems: 'center', paddingVertical: 32 },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 8,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  respIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  respContent: { flex: 1 },
  respTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  respText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  disclaimerSection: {
    backgroundColor: colors.warning + '15',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 18,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginTop: 8,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  editorSmallCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    opacity: 0.7,
  },
  editorSmallTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
  },
  editorSmallText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
});