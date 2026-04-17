import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : Mars 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Bienvenue sur Mon Voisin Cuisine. Nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
        </Text>

        <Text style={styles.sectionTitle}>2. Données collectées</Text>
        <Text style={styles.paragraph}>
          Nous collectons les données suivantes :
        </Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Informations de compte :</Text> nom, email, numéro de téléphone</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Localisation :</Text> adresse et coordonnées GPS (pour afficher les plats à proximité)</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Photos :</Text> images de plats que vous publiez</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Messages :</Text> conversations avec d'autres utilisateurs</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Transactions :</Text> historique des commandes et paiements</Text>

        <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
        <Text style={styles.paragraph}>
          Vos données sont utilisées pour :
        </Text>
        <Text style={styles.listItem}>• Fournir et améliorer nos services</Text>
        <Text style={styles.listItem}>• Permettre les transactions entre utilisateurs</Text>
        <Text style={styles.listItem}>• Afficher les plats disponibles près de chez vous</Text>
        <Text style={styles.listItem}>• Envoyer des notifications sur vos commandes</Text>
        <Text style={styles.listItem}>• Assurer la sécurité de la plateforme</Text>

        <Text style={styles.sectionTitle}>4. Partage des données</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons jamais vos données personnelles. Nous partageons certaines informations avec :
        </Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Autres utilisateurs :</Text> votre nom, photo de profil et quartier sont visibles</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Stripe :</Text> pour le traitement sécurisé des paiements</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Expo :</Text> pour les notifications push</Text>

        <Text style={styles.sectionTitle}>5. Sécurité des données</Text>
        <Text style={styles.paragraph}>
          Nous utilisons des mesures de sécurité techniques et organisationnelles pour protéger vos données :
        </Text>
        <Text style={styles.listItem}>• Chiffrement des mots de passe (bcrypt)</Text>
        <Text style={styles.listItem}>• Connexions sécurisées (HTTPS)</Text>
        <Text style={styles.listItem}>• Tokens JWT pour l'authentification</Text>
        <Text style={styles.listItem}>• Paiements sécurisés via Stripe</Text>

        <Text style={styles.sectionTitle}>6. Vos droits (RGPD)</Text>
        <Text style={styles.paragraph}>
          Conformément au RGPD, vous avez le droit de :
        </Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Accéder</Text> à vos données personnelles</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Rectifier</Text> vos informations</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Supprimer</Text> votre compte et vos données</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Exporter</Text> vos données (portabilité)</Text>
        <Text style={styles.listItem}>• <Text style={styles.bold}>Retirer</Text> votre consentement à tout moment</Text>

        <Text style={styles.sectionTitle}>7. Cookies et traceurs</Text>
        <Text style={styles.paragraph}>
          L'application mobile n'utilise pas de cookies. Nous utilisons AsyncStorage pour stocker localement votre session de connexion sur votre appareil.
        </Text>

        <Text style={styles.sectionTitle}>8. Conservation des données</Text>
        <Text style={styles.paragraph}>
          Vos données sont conservées tant que votre compte est actif. Après suppression de votre compte, vos données sont effacées dans un délai de 30 jours, sauf obligation légale de conservation.
        </Text>

        <Text style={styles.sectionTitle}>9. Mineurs</Text>
        <Text style={styles.paragraph}>
          Notre service est destiné aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs.
        </Text>

        <Text style={styles.sectionTitle}>10. Modifications</Text>
        <Text style={styles.paragraph}>
          Nous pouvons mettre à jour cette politique de confidentialité. Vous serez informé de tout changement significatif via l'application ou par email.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant vos données personnelles, contactez-nous à :
        </Text>
        <Text style={styles.contactEmail}>contact@monvoisincuisine.fr</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 Mon Voisin Cuisine - Tous droits réservés
          </Text>
        </View>
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
    borderRadius: 20,
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
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textLight,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 26,
    color: colors.textLight,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  contactEmail: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    marginTop: 40,
    marginBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
