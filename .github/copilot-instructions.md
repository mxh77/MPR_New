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

## ⚠️ SCHÉMAS DE DONNÉES - RÈGLES CRITIQUES ⚠️

### Cohérence WatermelonDB ↔ MongoDB
- **TOUJOURS vérifier la correspondance exacte** entre schéma WatermelonDB et API MongoDB
- **Types de données** : Respecter EXACTEMENT les types API (Stage/Stop vs type local)
- **Noms de champs** : snake_case en WatermelonDB vs camelCase en API
- **Structures complexes** : JSON.stringify/parse obligatoire pour objects/arrays
- **Migrations** : JAMAIS modifier une migration existante, toujours créer v+1

### Mapping API ↔ Local OBLIGATOIRE
```typescript
// API Response (MongoDB)     →  WatermelonDB Model
arrivalDateTime              →  arrival_date_time (timestamp)
departureDateTime           →  departure_date_time (timestamp)
travelTimePreviousStep      →  travel_time_previous_step (number)
distancePreviousStep        →  distance_previous_step (number)
travelTimeNote              →  travel_time_note (string)
activities: Array<Object>   →  activities (JSON string)
accommodations: Array<Object> → accommodations (JSON string)
thumbnail: Object           →  thumbnail (JSON string)
```

### Validation Schéma AVANT Développement
1. **Examiner l'API response** avec console.log AVANT de coder
2. **Vérifier le schéma WatermelonDB** dans `src/services/database/schema.ts`
3. **Identifier les incompatibilités** de types/noms/structures
4. **Créer la migration** AVANT de modifier les modèles
5. **Tester la sérialisation/désérialisation** des données complexes

### Règles de Sérialisation JSON
- **Thumbnails** : `JSON.stringify(thumbnail)` → `JSON.parse(thumbnailString)`
- **Arrays d'objets** : Toujours sérialiser en JSON string en WatermelonDB
- **Validation** : Vérifier que `typeof parsed === 'object'` après parse
- **Fallbacks** : Toujours avoir des valeurs par défaut (`|| []`, `|| {}`)

### Debug Schéma Obligatoire
```typescript
// TOUJOURS logger les structures inconnues
console.log('🔍 API Response structure:', response);
console.log('🔍 WatermelonDB raw:', model._raw);
console.log('🔍 Parsed data:', JSON.parse(jsonField));
```

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

### Gestion des Migrations WatermelonDB CRITIQUE
- **JAMAIS modifier une migration existante** même en développement
- **Toujours créer une nouvelle version** de migration (v+1)
- **Changer le nom de DB en développement** pour éviter les conflits
- **Réinitialiser complètement** : `devUtils.resetDatabase()` si nécessaire
- **Tester la migration** AVANT de commiter

### Problèmes de Closure dans WatermelonDB
- **Variables externes dans les closures** : Préparer TOUTES les données AVANT database.write()
- **Éviter les références externes** dans les fonctions de création/modification
- **Sérialiser les objets complexes** en variables locales avant la closure
- **Utiliser _setRaw()** systématiquement pour éviter les validations automatiques

### Gestion des Types API vs Interface
- **Énums de l'API** peuvent différer des interfaces locales (Stage/Stop vs StepType)
- **TOUJOURS mapper les types** : ne pas assumer qu'ils correspondent
- **Valider les types reçus** : `if (!['hiking', 'visit'].includes(apiType))`
- **Logger les types inconnus** pour debugging

### Cache vs API - Stratégie Offline-First
- **Cache-first obligatoire** : charger local PUIS synchroniser si nécessaire
- **Validation de fraîcheur** : 5 minutes max pour données critiques
- **Éviter les appels API inutiles** : shouldSynchronize() logic
- **Gérer les modes déconnectés** : fallback sur cache même ancien

### Erreurs de Sérialisation JSON
- **Objets complexes** : TOUJOURS JSON.stringify avant stockage WatermelonDB
- **Validation après parse** : try/catch + fallback sur valeur par défaut
- **Thumbnails** : Gérer les cas string ET object dans la désérialisation
- **Arrays vides** : `|| []` systématique après JSON.parse
````
