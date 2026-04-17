# Mon Voisin Cuisine - PRD

## Description
Application mobile de partage de plats faits maison entre voisins. Les cuisiniers proposent leurs plats, les clients commandent et récupèrent à proximité.

## Stack Technique
- **Frontend**: Expo (React Native for Web) avec Expo Router
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Paiements**: Stripe Connect (en attente du numéro SIREN)

## Fonctionnalités Implémentées

### Authentification
- ✅ Inscription / Connexion JWT
- ✅ Profil utilisateur avec adresse et quartier

### Gestion des plats
- ✅ Création de plat avec photo, prix, portions, date/heure de récupération
- ✅ Options d'emballage (récipient fourni, sac fourni, apportez votre contenant)
- ✅ Instructions de collecte personnalisées
- ✅ Suppression de plats depuis le profil
- ✅ Filtrage des plats expirés/vendus
- ✅ Affichage des options d'emballage et instructions sur la page de détail

### Commandes
- ✅ Passer une commande
- ✅ Commission 10% (min 0.50€) calculée automatiquement
- ✅ Gestion des statuts (en attente, confirmé, prêt, terminé, annulé)
- ✅ Suppression des commandes annulées/terminées

### Messagerie
- ✅ Chat entre acheteur et cuisinier
- ✅ Suppression de conversations (utilise window.confirm pour compatibilité web)
- ✅ Badge de messages non lus

### Avis et notes
- ✅ Laisser un avis après commande terminée
- ✅ Notes 1-5 étoiles avec commentaire
- ✅ Affichage des avis sur la fiche du plat
- ✅ Calcul automatique de la note moyenne du cuisinier

### Navigation
- ✅ **Onglet Accueil** - Page d'accueil avec logo, titre, message de bienvenue et liens informatifs
- ✅ Onglet Explorer - Liste des plats disponibles avec recherche
- ✅ Onglet Commandes - Suivi des commandes
- ✅ Onglet Cuisiner - Création de plat
- ✅ Onglet Messages - Conversations
- ✅ Onglet Profil - Paramètres utilisateur et gestion des plats

### Pages informatives (accessibles depuis Accueil)
- ✅ Notre philosophie
- ✅ Guide d'hygiène (règles de sécurité alimentaire)
- ✅ Mentions légales (SIRET, responsabilités, données personnelles)

## Bugs Corrigés (session actuelle)
- ✅ Bug "null km" - La distance ne s'affiche plus quand non disponible
- ✅ Bug suppression - Utilise window.confirm() au lieu de Alert.alert() pour compatibilité web mobile
- ✅ Onglet Accueil terminé - Contenu déplacé depuis le profil
- ✅ Profil nettoyé - Plus de liens vers les pages statiques
- ✅ Code i18n nettoyé - Fichiers de traduction supprimés

## Configuration importante

### Variables d'environnement
- `EXPO_PUBLIC_BACKEND_URL`: URL du backend
- `MONGO_URL`: Connexion MongoDB
- `STRIPE_SECRET_KEY`: Clé Stripe (test pour l'instant)

## Prochaines étapes

### P0 - Critique
- [ ] **Stripe Connect** - Configurer les paiements réels quand le numéro SIREN sera obtenu
- [ ] Tester le flux complet de paiement en production

### P1 - Important
- [ ] **Calcul de distance** - Améliorer pour afficher la vraie distance quand la localisation est disponible
- [ ] Notifications push

### P2 - Améliorations
- [ ] Vue carte avec les plats à proximité
- [ ] Modification des plats existants
- [ ] Filtres de recherche avancés par distance
- [ ] Système de favoris

## Credentials de test
- Email: chef@test.com
- Password: test123

## Liens
- Preview: https://neighbor-eats-2.preview.emergentagent.com

## Contact éditeur
- Email: e.bournetmunoz@gmail.com
- Adresse: Rue Édouard Vaillant, 66670 Bages
