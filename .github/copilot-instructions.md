<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instructions Copilot pour Mon Petit Roadtrip v2

## Contexte du Projet
Application React Native de planification de road trips avec architecture offline-first, utilisant WatermelonDB pour la persistance locale et synchronisation avec backend.

## Architecture et Stack Technique
- **Framework**: React Native + Expo SDK 53.x *(actuellement installé)*
- **Langage**: TypeScript strict exclusivement  
- **Navigation**: React Navigation v7+ avec stack/tabs/material-top-tabs
- **Base de données**: WatermelonDB (offline-first critique)
- **HTTP**: Axios avec intercepteurs auth + retry logic
- **Styling**: Styled-components + palette `src/constants/colors.ts`
- **State**: Context API + useReducer (pas de Redux)

## Structure de Fichiers Critique
```
src/
├── config/index.ts          # ENV_CONFIG, ALGOLIA_CONFIG, DATABASE_CONFIG
├── constants/colors.ts      # Palette complète (primary:#007BFF, hiking:#FF5722)
├── types/index.ts          # Types centralisés (ActivityType, StepType, etc.)
├── services/               # Pattern Repository obligatoire
│   ├── database/          # Setup WatermelonDB + modèles
│   ├── api/               # Client Axios + endpoints sans /api/
│   ├── auth/              # JWT + SecureStore
│   └── sync/              # Queue optimiste + résolution conflits
└── components/             # Composants réutilisables avec JSDoc
```

## Scripts de Développement Essentiels
- `npm run start:clear` - Démarre avec cache vidé
- `npm run android:debug` - Build debug Android natif
- `npm run typecheck` - Validation TypeScript (obligatoire avant commit)
- `npm run sync:database` - Script custom de synchronisation DB

## Patterns d'Architecture Spécifiques

### Configuration Environnement (`src/config/index.ts`)
- `ENV_CONFIG.DEBUG` conditionne API_BASE_URL debug/release
- Feature flags: `ENABLE_CHATBOT`, `ENABLE_OFFLINE_MODE`
- Debug flags: `DEBUG_SYNC`, `DEBUG_WATERMELON` pour troubleshooting

### Types Système (`src/types/index.ts`)  
- `BaseEntity` avec `syncStatus` + `lastSyncAt` sur toutes entités
- `ActivityType`: 'hiking'|'visit'|'restaurant'|'accommodation'|'transport'
- `NotificationType`: 'chatbot_success'|'system'|'sync_error'

### Couleurs Métier (`src/constants/colors.ts`)
- Couleurs par activité: `hiking: '#FF5722'`, `accommodation: '#4CAF50'`
- États sync: `online: '#4CAF50'`, `offline: '#FF5722'`, `syncing: '#FF9800'`

## Règles de Développement Strictes

### Analyse Proactive des Erreurs
- **TOUJOURS analyser les logs d'erreur EN PRIORITÉ** avant de proposer des solutions
- Si un log API est fourni, examiner IMMÉDIATEMENT la structure des données retournées
- Identifier les incompatibilités de types entre API et composants AVANT de coder
- Pour les erreurs React Native Image/URI : vérifier que la source est une string, pas un objet
- Pour les erreurs TypeScript : lire le message d'erreur complet et corriger à la racine

### Structures de Données API Critiques
- **Thumbnails** : Toujours des objets `{ _id, url, type, fileId }` - JAMAIS des strings
- **Dates** : ISO strings nécessitant `new Date()` pour Date objects
- **Géolocalisation** : Structure `{ latitude, longitude, address }` 
- **Sync Status** : `pending|synced|error` avec `lastSyncAt` timestamp

### Debugging Obligatoire
- TOUJOURS ajouter `console.log` pour structures de données inconnues
- Vérifier les types avec `typeof` avant utilisation dans composants
- Utiliser des fonctions utilitaires pour extraire/valider les données (ex: `getImageUri()`
- Ne JAMAIS assumer qu'une propriété API correspond au type interface local

### API Backend
- **JAMAIS de préfixe `/api/`** - routes directes `/roadtrips`, `/steps/:id/activities`
- Bearer token automatique via intercepteurs Axios
- Retry 3x avec backoff exponentiel sur échecs réseau

### Offline-First WatermelonDB  
- Toutes mutations DOIVENT être optimistes (réponse immédiate)
- Queue de sync persistante avec `SyncQueue` model
- Résolution conflits: "serveur gagne" toujours
- BaseRepository pattern pour CRUD + sync uniform

### Performance Obligatoire
- `React.memo()` sur TOUS composants de liste
- `useCallback()` sur fonctions passées en props
- `useMemo()` sur calculs coûteux (>50ms)
- `FlatList` avec `getItemLayout()` quand possible

### Conventions TypeScript
- Interfaces de props suffixées `Props`: `ButtonProps`, `CardProps`
- Hooks custom préfixés `use`: `useAuth()`, `useOfflineStatus()`
- Constants `UPPER_SNAKE_CASE`: `API_TIMEOUT`, `MAX_RETRY_ATTEMPTS`
- Services avec interfaces: `IAuthService`, `IRoadtripRepository`

## Intégrations Externes
- **Algolia Search**: Configuration dans `ALGOLIA_CONFIG` pour recherche randonnées
- **Expo SecureStore**: Stockage JWT tokens
- **Expo Location**: Géolocalisation avec `LOCATION_CONFIG.accuracy = 6`

## GIT
- Toujours commiter en français
