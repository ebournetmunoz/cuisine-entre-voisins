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

export default function LegalScreen() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL('mailto:e.bournetmunoz@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions légales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Ionicons name="document-text" size={48} color={colors.primary} />
          <Text style={styles.heroTitle}>Mentions légales</Text>
          <Text style={styles.heroSubtitle}>Cuisine entre voisins</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Éditeur</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Société :</Text>
            <Text style={styles.value}>Cuisine & Partage – Micro-entrepreneur</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>SIRET :</Text>
            <Text style={styles.value}>En attente d'attribution</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>Rue Édouard Vaillant, 66670 Bages</Text>
          </View>
          <TouchableOpacity style={styles.infoRow} onPress={handleEmailPress}>
            <Text style={styles.label}>Contact :</Text>
            <Text style={[styles.value, styles.link]}>e.bournetmunoz@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet de l'application</Text>
          <Text style={styles.paragraph}>
            Cuisine entre voisins est une application de mise en relation entre particuliers permettant de proposer ou de trouver des plats faits maison à proximité.
          </Text>
          <Text style={styles.paragraph}>
            Les utilisateurs fixent librement leurs prix dans un esprit de partage, de proximité et de convivialité.
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
                S'engagent à respecter les règles d'hygiène, à préparer les plats dans de bonnes conditions et à informer sur les allergènes.
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
                Sont responsables de leurs choix et doivent vérifier les informations fournies avant consommation : composition, allergènes, conservation et conditions de remise.
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
                Cuisine entre voisins agit uniquement comme plateforme de mise en relation. Elle n'intervient pas dans la préparation, la conservation, la remise ou la consommation des plats.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.paragraph}>
            Les échanges et paiements éventuels se font directement entre utilisateurs.
          </Text>
          <Text style={styles.paragraph}>
            L'application ne gère pas les transactions, ne perçoit pas de commission sur les plats et ne garantit pas le bon déroulement des échanges.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données personnelles</Text>
          <Text style={styles.paragraph}>
            Le nom, l'email, la localisation et les informations de profil sont utilisés uniquement pour le fonctionnement de l'application et la mise en relation.
          </Text>
          <Text style={styles.paragraph}>
            Ces données ne sont ni vendues ni transmises à des tiers à des fins commerciales.
          </Text>
          <Text style={styles.paragraph}>
            Vous pouvez demander l'accès, la modification ou la suppression de vos données à :{' '}
            <Text style={styles.link} onPress={handleEmailPress}>
              e.bournetmunoz@gmail.com
            </Text>
          </Text>
        </View>

        <View style={styles.disclaimerSection}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={styles.disclaimerTitle}>Avertissement</Text>
          <Text style={styles.disclaimerText}>
            Chaque utilisateur est responsable de ses actions sur la plateforme. Les plats proposés sont réalisés par des particuliers et ne font pas l'objet de contrôles sanitaires par l'application. Il appartient à chacun de faire preuve de vigilance avant toute consommation.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    width: 80,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
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
  respContent: {
    flex: 1,
  },
  respTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  respText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
    lineHeight: 20,
  },
  disclaimerSection: {
    backgroundColor: colors.warning + '15',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
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
});