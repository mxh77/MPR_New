# Mon Petit Roadtrip v2 🗺️

Application mobile React Native pour la planification et gestion de road trips avec architecture **offline-first**.

## 🚀 Fonctionnalités

- **Planification de road trips** avec gestion d'étapes et activités
- **Mode offline-first** avec synchronisation automatique
- **Authentification JWT** avec stockage sécurisé
- **Chatbot IA** pour suggestions d'activités
- **Géolocalisation** et cartes interactives
- **Gestionnaire de tâches** intégré
- **Système de récits** avec photos
- **Recherche de randonnées** via Algolia

## 🏗️ Architecture Technique

- **Framework** : React Native + Expo SDK 53.x
- **Langage** : TypeScript strict
- **Navigation** : React Navigation v7+
- **Base de données** : WatermelonDB (offline-first)
- **HTTP Client** : Axios avec retry logic
- **Authentification** : JWT + Expo SecureStore
- **Styling** : Styled-components
- **État global** : Context API + useReducer

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (pour Android)
- Xcode (pour iOS, macOS uniquement)

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/VOTRE_USERNAME/MPR_New.git
   cd MPR_New
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

4. **Démarrer le projet**
   ```bash
   npm run start
   ```

## 📱 Scripts Disponibles

- `npm run start` - Démarre Expo Dev Server
- `npm run start:clear` - Démarre avec cache vidé
- `npm run android` - Lance sur Android
- `npm run ios` - Lance sur iOS
- `npm run web` - Lance sur navigateur web
- `npm run typecheck` - Vérification TypeScript
- `npm run lint` - Linting du code
- `npm run clean` - Nettoyage des caches

## 🏛️ Structure du Projet

```
src/
├── components/           # Composants réutilisables
│   ├── common/          # Composants UI de base
│   ├── cards/           # Cards spécialisées
│   ├── forms/           # Composants de formulaires
│   ├── modals/          # Modales
│   └── navigation/      # Navigation personnalisée
├── screens/             # Écrans de l'application
├── services/            # Services métier
│   ├── api/             # Client HTTP
│   ├── auth/            # Authentification
│   ├── database/        # WatermelonDB + modèles
│   ├── repositories/    # Pattern Repository
│   └── sync/            # Synchronisation offline
├── hooks/               # Hooks personnalisés
├── contexts/            # Contextes React
├── types/               # Types TypeScript
├── constants/           # Constantes + couleurs
├── config/              # Configuration
└── utils/               # Utilitaires
```

## 🎨 Système de Design

### Palette de couleurs
- **Primary** : #007BFF (Bleu principal)
- **Success** : #28a745 (Vert)
- **Warning** : #ffc107 (Orange)
- **Danger** : #dc3545 (Rouge)

### Couleurs par activité
- **Randonnée** : #FF5722
- **Hébergement** : #4CAF50
- **Transport** : #FF9800
- **Visite** : #2196F3
- **Restaurant** : #9C27B0

## 🔧 Configuration

### Variables d'environnement (.env)
```bash
# API Configuration
API_BASE_URL_DEBUG=http://localhost:3000
API_BASE_URL_RELEASE=https://api.monpetitroadtrip.com

# Algolia
ALGOLIA_APP_ID=your_app_id
ALGOLIA_API_KEY=your_api_key

# Features
ENABLE_CHATBOT=true
ENABLE_OFFLINE_MODE=true
DEBUG_SYNC=false
```

## 📊 Base de Données (WatermelonDB)

### Modèles principaux
- **Roadtrip** - Road trips avec métadonnées
- **Step** - Étapes du voyage
- **Activity** - Activités par étape
- **Accommodation** - Hébergements
- **RoadtripTask** - Tâches de planification
- **Notification** - Notifications in-app
- **SyncQueue** - Queue de synchronisation

## 🔄 Architecture Offline-First

1. **Mutations optimistes** - Réponse immédiate en local
2. **Queue de synchronisation** - Retry automatique
3. **Résolution de conflits** - "Serveur gagne" toujours
4. **Cache intelligent** - TTL configuré par type de données

## 🚀 Déploiement

### Debug Build
```bash
npm run android:debug  # Android
npm run ios:debug      # iOS
```

### Release Build
```bash
npm run build:android  # APK/AAB Android
npm run build:ios      # IPA iOS
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développement** : [Votre nom]
- **Architecture** : Offline-first avec WatermelonDB
- **Backend** : API REST existante

---

**Mon Petit Roadtrip v2** - Planifiez vos aventures en toute simplicité ! 🎒
