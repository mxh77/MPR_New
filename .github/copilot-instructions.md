<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd -->

# Instructions Copilot pour Mon Petit Roadtrip v2

## 📋 Table des Matières
1. [Architecture & Stack](#architecture--stack)
2. [🚨 RÈGLES CRITIQUES](#-règles-critiques)
3. [🔧 SOLUTIONS VALIDÉES](#-solutions-validées)
4. [� DEBUGGING PATTERNS](#-debugging-patterns)

---

## Architecture & Stack

### Stack Technique
- **React Native + Expo SDK 53.x** avec TypeScript strict
- **WatermelonDB** offline-first avec sync MongoDB (ObjectIds 24 chars)
- **React Navigation v7+** pour navigation
- **Context API** pour state management (pas Redux)
- **Google Places API** pour autocomplétion d'adresses

### Structure Critique
```
src/
├── contexts/               # Providers (Theme, Auth, Database, DataRefresh)
├── hooks/                 # Business logic avec cache offline-first
├── services/api/          # Endpoints sans /api/ + validation ObjectIds
├── services/database/     # WatermelonDB models + migrations
└── utils/                 # formatDateWithoutTimezone() obligatoire
```

## 🚨 RÈGLES CRITIQUES

### 1. IDs MongoDB ↔ WatermelonDB
**PROBLÈME** : WatermelonDB génère des IDs courts → "Cast to ObjectId failed"
**SOLUTION** : TOUJOURS préserver ObjectIds MongoDB comme primary keys
```typescript
// ✅ OBLIGATOIRE dans toute création WatermelonDB
step._setRaw('id', apiStep._id); // Première ligne TOUJOURS
```

### 2. Dates et Fuseaux Horaires
**PROBLÈME** : `Intl.DateTimeFormat` applique automatiquement le fuseau local
**SOLUTION** : Utiliser `formatDateWithoutTimezone()` depuis `src/utils/`

### 3. Boucles Infinies useFocusEffect/useEffect
**PROBLÈME** : Double chargement hook + écran
**SOLUTION** : Conditions strictes + dépendances minimales
```typescript
// ✅ Pattern sécurisé
if (!data && !loading && !syncing) { fetchData(); }
```

### 4. Sérialisation JSON WatermelonDB
**PROBLÈME** : Objets complexes stockés directement
**SOLUTION** : TOUJOURS `JSON.stringify()` avant stockage + validation après `JSON.parse()`

### 5. Closure Variables WatermelonDB
**PROBLÈME** : Variables externes dans `database.write()`
**SOLUTION** : Préparer TOUTES les données AVANT la closure + utiliser `_setRaw()`

## 🔧 SOLUTIONS VALIDÉES

### GooglePlacesInput - Autocomplétion d'Adresses
**PROBLÈME** : Saisie manuelle d'adresses sans validation/géolocalisation
**SOLUTION** : Composant GooglePlacesInput avec API Google Places
- `<GooglePlacesInput onPlaceSelected={handlePlaceSelected} />` remplace TextInput classique
- `handlePlaceSelected` récupère automatiquement latitude/longitude via Place Details API
- Stockage coordonnées dans `location: { latitude, longitude, address }`
- Configuration : `EXPO_PUBLIC_GOOGLE_API_KEY` dans .env

### DataRefreshContext - Rafraîchissement Sans Boucles
**PROBLÈME** : Données non rafraîchies après sauvegarde + boucles infinies
**SOLUTION** : Système notification centralisé par timestamp
- `notifyStepUpdate(stepId)` dans EditScreen après sauvegarde
- `useEffect(() => { refresh() }, [lastStepUpdate])` dans écrans d'affichage
- Conditions strictes : `lastStepUpdate > 0 && data && !loading && !syncing`

### Synchronisation Database Robuste
**PROBLÈME** : UNIQUE constraint violations + données corrompues
**SOLUTION** : Pattern update-or-create avec existingMap
- Charger données existantes AVANT création
- Utiliser `find()` pour vérifier existence puis `update()` ou `create()`
- Préserver ObjectIds MongoDB en priorité absolue

### Gestion Erreurs API
**PROBLÈME** : Pas de fallback sur cache en cas d'erreur réseau
**SOLUTION** : Stratégie offline-first systématique
- Cache local → sync conditionnelle en arrière-plan
- Fallback sur données locales si API échoue (sauf 404)
- `shouldSynchronize()` avec validation fraîcheur (5min max)

### Performance Hooks
**PROBLÈME** : Re-renders excessifs + appels API multiples
**SOLUTION** : Optimisations obligatoires
- `useCallback` avec dépendances minimales
- Éviter fonctions internes dans dépendances → intégrer logique directement
- Un seul point d'entrée chargement par écran
- `React.memo` pour composants lourds

## 🎯 DEBUGGING PATTERNS

### Validation IDs Avant Appels API
```typescript
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
if (!isValidObjectId(stepId)) { console.error('❌ ID invalide:', stepId); return; }
```

### Logs Structurés pour Sync
```typescript
console.log('🔧 [Hook] - Phase:', { itemCount: data.length, sampleId: data[0]?._id });
```

### Debug Navigation Paramètres
```typescript
console.log('🎯 Navigation:', { screen, params, hasValidId: isValidObjectId(params.id) });
```

### Vérification Cache vs API
```typescript
console.log('📍 Sync Decision:', { hasLocal: !!localData, isStale: lastSync < fiveMinAgo });
```

---

## Migration & Fix d'Urgence

### Reset Base Corrompue
```bash
npx expo start --clear  # Vide cache + base WatermelonDB
```

### Fix IDs Courts Détectés
1. Identifier hook de sync défaillant
2. Ajouter `step._setRaw('id', apiStep._id)` en première ligne
3. Reset complet avec `--clear`
4. Valider nouveaux ObjectIds dans logs

### Résolution Boucles Infinies
1. Identifier double chargement (hook + écran)
2. Désactiver `useEffect` du hook OU `useFocusEffect` de l'écran
3. Ajouter conditions strictes : `!loading && !syncing`
4. Minimiser dépendances `useCallback`

---

**🎯 PRINCIPE GÉNÉRAL** : Offline-first, ObjectIds préservés, conditions strictes, logs structurés

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

### Erreurs de Sérialisation JSON
- **Objets complexes** : TOUJOURS JSON.stringify avant stockage WatermelonDB
- **Validation après parse** : try/catch + fallback sur valeur par défaut
- **Thumbnails** : Gérer les cas string ET object dans la désérialisation
- **Arrays vides** : `|| []` systématique après JSON.parse

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

### Gestion des Dates et Fuseaux Horaires CRITIQUE
- **JAMAIS utiliser `Intl.DateTimeFormat`** pour l'affichage des dates/heures - il applique automatiquement le fuseau horaire local
- **Utiliser les méthodes UTC** : `getUTCDate()`, `getUTCHours()`, `getUTCMinutes()`, etc. pour afficher l'heure exacte stockée en base
- **Formatage manuel obligatoire** : Créer des fonctions custom utilisant `padStart()` pour le formatage
- **Debug systématique** : Logger `date.toISOString()`, `date.getHours()` vs `date.getUTCHours()` en cas de doute
- **Problème typique** : 14:30 en base devient 16:30 à l'affichage (conversion UTC+2)
- **Fonction utilitaire obligatoire** : Utiliser `formatDateWithoutTimezone()` depuis `src/utils/dateUtils.ts`
- **Import recommandé** : `import { formatDateWithoutTimezone } from '../../utils';`
- **Solution complète** : 
  ```typescript
  // Import de la fonction utilitaire
  import { formatDateWithoutTimezone } from '../../utils';
  
  // Utilisation dans le composant
  <Text>{formatDateWithoutTimezone(item.startDate)}</Text>
  
  // Pour debug uniquement
  import { debugDateTimezone } from '../../utils';
  debugDateTimezone(date, 'Ma date à analyser');
  ```

### ⚠️ GESTION DES IDS MONGODB ↔ WATERMELONDB - RÈGLES CRITIQUES ⚠️

#### Problème Fondamental
- **MongoDB** utilise des ObjectIds de 24 caractères hexadécimaux (ex: `"673abc123def456789012345"`)
- **WatermelonDB** génère automatiquement des IDs courts alphanumériques (ex: `"9KTT5LUsozsPVPeV"`)
- **ERREUR CRITIQUE** : Si WatermelonDB génère ses propres IDs, l'API échoue avec "Cast to ObjectId failed"

#### Règles Obligatoires pour Éviter les Erreurs d'ID

##### 1. TOUJOURS Préserver les ObjectIds MongoDB comme Primary Keys WatermelonDB
```typescript
// ✅ CORRECT - Préserver l'ObjectId MongoDB
await stepsCollection.create((step: StepModel) => {
  // CRITIQUE: Utiliser l'ObjectId MongoDB comme ID primaire WatermelonDB
  step._setRaw('id', apiStep._id);  // apiStep._id = "673abc123def456789012345"
  step._setRaw('name', apiStep.name);
  // ...autres champs
});

// ❌ INCORRECT - Laisser WatermelonDB générer l'ID
await stepsCollection.create((step: StepModel) => {
  // step.id sera auto-généré comme "9KTT5LUsozsPVPeV" → Erreur API
  step._setRaw('name', apiStep.name);
});
```

##### 2. Validation des IDs Avant Appels API
```typescript
// ✅ CORRECT - Vérifier le format ObjectId avant appel API
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Avant navigation ou appel API
if (!isValidObjectId(stepId)) {
  console.error('❌ ID invalide pour API MongoDB:', stepId);
  return; // ou gérer l'erreur
}
```

##### 3. Debug Systématique des IDs
```typescript
// ✅ TOUJOURS logger les IDs pour validation
console.log('🔍 ID Debug:', {
  stepId,
  length: stepId?.length,
  isValidObjectId: /^[0-9a-fA-F]{24}$/.test(stepId),
  type: typeof stepId
});
```

##### 4. Pattern de Synchronisation Obligatoire
```typescript
// ✅ CORRECT - Pattern complet de synchronisation avec préservation ID
await database.write(async () => {
  const collection = database.get<ModelType>('table_name');
  
  // Supprimer les données existantes
  const existing = await collection.query().fetch();
  for (const item of existing) {
    await item.markAsDeleted();
  }
  
  // Recréer avec ObjectIds MongoDB préservés
  for (const apiItem of apiItems) {
    await collection.create((model: ModelType) => {
      // CRITIQUE: Première ligne = préserver l'ObjectId MongoDB
      model._setRaw('id', apiItem._id);
      model._setRaw('field1', apiItem.field1);
      // ...autres champs
    });
  }
});
```

##### 5. Erreurs à Surveiller et Solutions

**Erreur Type**: `Cast to ObjectId failed for value "9KTT5LUsozsPVPeV"`
```typescript
// ✅ SOLUTION: Vérifier le hook/service de synchronisation
// 1. S'assurer que step._setRaw('id', apiStep._id) est présent
// 2. Redémarrer avec --clear pour vider la base WatermelonDB
// 3. Valider que les nouveaux ObjectIds sont préservés
```

**Erreur Type**: Navigation échoue avec stepId court
```typescript
// ✅ SOLUTION: Validation avant navigation
const handleStepPress = (step: Step) => {
  if (!isValidObjectId(step._id)) {
    console.error('❌ Step avec ID invalide détecté:', step._id);
    // Forcer une resynchronisation
    refreshSteps(true);
    return;
  }
  navigation.navigate('StepDetail', { stepId: step._id });
};
```

##### 6. Tests de Régression Obligatoires

Après toute modification de synchronisation, vérifier :
```typescript
// ✅ Checklist obligatoire
// 1. Les IDs en base locale sont des ObjectIds MongoDB (24 chars)
// 2. La navigation step details fonctionne sans erreur 500
// 3. Les appels API utilisent les vrais ObjectIds MongoDB
// 4. Aucun ID court WatermelonDB ne circule vers l'API
```

##### 7. Migration de Fix d'IDs
```typescript
// ✅ Si base corrompue avec IDs courts, migration obligatoire
const fixCorruptedIds = async () => {
  // Option 1: Reset complet (recommandé)
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
  
  // Option 2: Resynchronisation forcée
  await refreshSteps(true); // Force sync depuis API
};
```

#### Règles de Prevention

1. **JAMAIS** créer un modèle WatermelonDB sans `_setRaw('id', apiId)`
2. **TOUJOURS** valider les IDs avant appels API
3. **SYSTÉMATIQUEMENT** tester la navigation après modifications de sync
4. **OBLIGATOIREMENT** redémarrer avec `--clear` après fix d'IDs
5. **IMMÉDIATEMENT** corriger si des IDs courts sont détectés en logs

#### Pattern de Résolution d'Urgence
```bash
# En cas d'erreur "Cast to ObjectId failed"
# 1. Identifier la source (hook de sync)
# 2. Ajouter step._setRaw('id', apiStep._id)
# 3. Reset base locale
npx expo start --clear
# 4. Valider que nouveaux IDs sont corrects
```

## Patterns Spécifiques de Hooks de Synchronisation

### Hook useSteps - Pattern de Référence
```typescript
// ✅ PATTERN CORRECT - Synchronisation avec préservation ObjectId
const refreshSteps = useCallback(async (forceSync: boolean = false) => {
  // ... logique de sync ...
  
  await database.write(async () => {
    const stepsCollection = database.get<StepModel>('steps');
    
    // Supprimer données existantes
    const existingSteps = await stepsCollection
      .query(Q.where('roadtrip_id', roadtripId))
      .fetch();
    for (const step of existingSteps) {
      await step.markAsDeleted();
    }
    
    // Recréer avec ObjectIds préservés
    for (const apiStep of apiSteps) {
      // Préparer TOUTES les données AVANT la closure
      const rawData = {
        user_id: apiStep.userId || 'unknown',
        roadtrip_id: apiStep.roadtripId || roadtripId,
        // ... tous les autres champs
      };
      
      await stepsCollection.create((step: StepModel) => {
        // PREMIÈRE LIGNE = préserver ObjectId MongoDB
        step._setRaw('id', apiStep._id);
        step._setRaw('user_id', rawData.user_id);
        // ... tous les autres champs avec _setRaw()
      });
    }
  });
}, [roadtripId]);
```

### Règles de Pattern pour tous les Hooks de Sync

#### 1. Stratégie Offline-First Obligatoire
```typescript
// ✅ CORRECT - Cache-first puis sync conditionnelle
useEffect(() => {
  const initialize = async () => {
    // 1. TOUJOURS charger d'abord les données locales
    await loadLocalData();
    
    // 2. Vérifier si sync nécessaire
    const shouldSync = await shouldSynchronize();
    if (shouldSync) {
      refresh(false); // Sync en arrière-plan
    }
  };
  initialize();
}, [id]);

// ❌ INCORRECT - API-first
useEffect(() => {
  refresh(); // Bloque l'UI, pas offline-first
}, [id]);
```

#### 2. Préparation des Données Avant Closure
```typescript
// ✅ CORRECT - Toutes les données préparées avant database.write()
const syncData = async (apiItems) => {
  // Préparer TOUTES les données en dehors de la closure
  const preparedData = apiItems.map(item => ({
    id: item._id, // ObjectId MongoDB
    field1: item.field1 || 'default',
    complexField: JSON.stringify(item.complexField || {}),
    timestamp: Date.now()
  }));
  
  await database.write(async () => {
    for (const data of preparedData) {
      await collection.create((model) => {
        // Utiliser seulement les données préparées
        model._setRaw('id', data.id);
        model._setRaw('field1', data.field1);
        // ... etc
      });
    }
  });
};

// ❌ INCORRECT - Traitement dans la closure
await database.write(async () => {
  for (const apiItem of apiItems) {
    // ❌ Traitement/sérialisation dans la closure
    const processed = processApiItem(apiItem);
    await collection.create((model) => {
      model._setRaw('field', processed);
    });
  }
});
```

#### 3. Validation des IDs Systématique
```typescript
// ✅ CORRECT - Validation avant utilisation
const navigateToDetail = (item) => {
  // Validation ObjectId avant navigation
  if (!isValidObjectId(item._id)) {
    console.error('❌ ID invalide détecté:', item._id);
    // Option 1: Forcer resync
    refresh(true);
    return;
    // Option 2: Afficher erreur à l'utilisateur
  }
  
  navigation.navigate('Detail', { itemId: item._id });
};

const isValidObjectId = (id: string): boolean => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};
```

#### 4. Gestion d'Erreurs Robuste
```typescript
// ✅ CORRECT - Fallback sur cache en cas d'erreur API
const refresh = async (forceSync = false) => {
  try {
    const apiData = await fetchFromAPI();
    setData(apiData);
    await saveToLocal(apiData);
  } catch (err) {
    console.error('Erreur API:', err);
    
    // Fallback sur données locales
    if (err.status !== 404) { // 404 = normal si pas de données
      await loadLocalData();
    }
    
    setError('Données en mode hors ligne');
  }
};
```

#### 5. Debug et Logging Standardisés
```typescript
// ✅ CORRECT - Logging structuré pour debug
const debugSync = (phase: string, data: any) => {
  console.log(`🔧 ${hookName} - ${phase}:`, {
    itemCount: Array.isArray(data) ? data.length : 'N/A',
    sampleId: data?.[0]?._id || data?._id,
    idLength: data?.[0]?._id?.length || data?._id?.length,
    timestamp: new Date().toISOString()
  });
};

// Usage
debugSync('API Response', apiData);
debugSync('Local Save', preparedData);
debugSync('UI Update', convertedData);
```

### 8. Patterns de Hooks de Synchronisation Anti-Appels Multiples

#### Hook Pattern de Référence (useRoadtripsWithApi)
```typescript
// ✅ PATTERN CORRECT - Un seul point d'entrée optimisé
export const useDataWithApi = () => {
  // ...existing code...
  
  // ❌ DÉSACTIVÉ: Auto-load pour éviter les doubles appels
  // Le useFocusEffect de l'écran gère le chargement initial
  // useEffect(() => {
  //   if (isReady && database && user && data.length === 0 && !loading && !syncing) {
  //     fetchData();
  //   }
  // }, [isReady, database, user]);
  
  // ✅ CORRECT: fetchData avec dépendances minimales
  const fetchData = useCallback(async (forceSync = false) => {
    if (!isReady || !database || !user) return;
    
    // Intégrer directement la logique au lieu de dépendre d'autres fonctions
    const localData = await database.get('table').query().fetch();
    setData(localData);
    
    // Sync conditionnelle intégrée
    if (shouldSync && !syncing) {
      setSyncing(true);
      // ... logique de sync intégrée
      setSyncing(false);
    }
  }, [isReady, database, user, syncing]); // Dépendances minimales
};
```

#### Pattern d'Écran Optimisé
```typescript
// ✅ PATTERN CORRECT - useFocusEffect avec conditions strictes
export const DataListScreen = () => {
  const { data, loading, syncing, fetchData } = useDataWithApi();
  
  useFocusEffect(
    useCallback(() => {
      // Conditions strictes pour éviter appels multiples
      if (data.length === 0 && !loading && !syncing) {
        console.log('🎯 useFocusEffect: Premier chargement uniquement');
        fetchData();
      } else {
        console.log('🎯 useFocusEffect: Chargement ignoré', {
          hasData: data.length > 0,
          loading,
          syncing,
          reason: 'conditions non remplies'
        });
      }
    }, [data.length, loading, syncing, fetchData])
  );
};
```

#### Anti-Patterns à Éviter ABSOLUMENT
```typescript
// ❌ INCORRECT - Double chargement
const BadScreen = () => {
  const { data, fetchData } = useDataWithApi(); // Hook a déjà un useEffect
  
  useFocusEffect(() => {
    fetchData(); // Double appel garanti !
  }, [fetchData]);
};

// ❌ INCORRECT - Dépendances qui changent constamment
const fetchData = useCallback(async () => {
  await fetchLocalData(); // Fonction qui change à chaque render
  await syncWithApi();    // Fonction qui change à chaque render
}, [fetchLocalData, syncWithApi]); // Nouvelles instances à chaque render

// ❌ INCORRECT - Pas de conditions de protection
useFocusEffect(() => {
  fetchData(); // Se déclenche TOUJOURS, même si data déjà présente
}, [fetchData]);
```

#### Checklist Debug Hooks de Sync
1. ✅ **Un seul useEffect OU useFocusEffect** par type de chargement
2. ✅ **Conditions strictes** : `data.length === 0 && !loading && !syncing`
3. ✅ **Dépendances minimales** dans useCallback
4. ✅ **Logique intégrée** plutôt que dépendances de fonctions
5. ✅ **Logs de debug** avec identifiants uniques
6. ✅ **Test manuel** : navigation multiple sans appels en double

## ⚡ OPTIMISATION PERFORMANCE - RÈGLES CRITIQUES ⚡

### 🚨 PRÉVENTION DES APPELS MULTIPLES - PRIORITÉ ABSOLUE

#### Règles Anti-Duplication d'Appels API/Database
- **JAMAIS** plus d'un `useEffect` ou `useFocusEffect` faisant le même appel dans un composant
- **TOUJOURS vérifier** : si `useEffect` dans hook ET `useFocusEffect` dans écran → **DÉSACTIVER L'UN DES DEUX**
- **PRIORITÉ** : `useFocusEffect` dans l'écran gère le chargement initial, désactiver `useEffect` du hook
- **Conditions strictes** : `if (data.length === 0 && !loading && !syncing)` pour éviter appels en parallèle

#### Optimisation useCallback/useMemo Obligatoire
- **TOUJOURS** utiliser `useCallback` pour les fonctions passées en dépendances
- **MINIMISER** les dépendances dans `useCallback` : retirer les fonctions internes si possible
- **ÉVITER** `fetchLocalData` et `syncWithApi` dans les dépendances → intégrer directement dans la fonction
- **PATTERN OPTIMAL** : 
  ```typescript
  const fetchData = useCallback(async () => {
    // Intégrer directement la logique au lieu de dépendre d'autres fonctions
    const localData = await database.get('table').query().fetch();
    setData(localData);
  }, [database]); // Dépendances minimales seulement
  ```

#### Debug et Monitoring des Performances
- **TOUJOURS** ajouter des logs de debug avec identifiants uniques
- **FORMAT STANDARD** : `🎯 [NomComposant] Action: détails`
- **TRAÇABILITÉ** : Logger les conditions qui déclenchent ou bloquent les appels
- **EXEMPLE** :
  ```typescript
  console.log('🎯 useFocusEffect: Chargement ignoré', {
    hasData: data.length > 0,
    loading,
    syncing,
    reason: 'conditions non remplies'
  });
  ```

#### Patterns de Synchronisation Optimaux
- **Cache-first TOUJOURS** : Charger local immédiatement, sync en arrière-plan si nécessaire
- **Sync conditionnelle** : `shouldSync = isOnline && !syncing && (forceSync || localCount === 0)`
- **Pas d'attente sur sync** : Synchronisation en arrière-plan pour ne pas bloquer l'UI
- **État de loading séparé** : `loading` pour chargement initial, `syncing` pour synchronisation API

#### Checklist Obligatoire Avant Commit
1. ✅ **Un seul point d'entrée** pour le chargement des données par écran
2. ✅ **Logs de debug** avec contexte complet pour traçabilité
3. ✅ **Conditions strictes** dans useFocusEffect/useEffect
4. ✅ **Dépendances minimales** dans useCallback
5. ✅ **Test en dev + release** pour vérifier l'absence d'appels multiples
6. ✅ **Cache offline-first** fonctionnel sans appels API inutiles

### 1. Minimiser les Re-rendus Inutiles
- Utiliser `React.memo` pour les composants fonctionnels lourds
- Implémenter `shouldComponentUpdate` pour les composants de classe
- Éviter les objets/arrays inline dans le rendu, préférer les constantes

### 2. Utilisation Efficace du Contexte
- Limiter la profondeur des consommateurs de contexte
- Éviter de passer des valeurs d'objet complexes directement
- Utiliser des sélecteurs pour ne re-rendre que les parties nécessaires

### 3. Optimisation des Hooks Personnalisés
- Éviter les calculs coûteux ou les appels API dans le corps du hook
- Accepter des dépendances pour permettre une mémorisation efficace
- Retourner des fonctions de nettoyage pour éviter les fuites de mémoire

### 4. Chargement et Synchronisation des Données
- Préférer les chargements en arrière-plan avec des indicateurs de chargement
- Utiliser des requêtes agrégées pour réduire le nombre d'appels API
- Implémenter une logique de pagination ou de chargement infini si nécessaire

### 5. Gestion des Images et Médias
- Utiliser des composants d'image optimisés (ex: `react-native-fast-image`)
- Charger les images en fonction de la visibilité (lazy loading)
- Éviter les redimensionnements d'images coûteux sur le fil d'Ariane

### 6. Profiling et Analyse de Performance
- Utiliser l'outil de profiling React pour identifier les goulets d'étranglement
- Analyser les rapports de performance pour cibler les optimisations
- Tester sur des appareils réels pour des résultats précis

### 7. Bonnes Pratiques Générales
- Garder le code propre et bien organisé pour faciliter les optimisations
- Écrire des tests de performance pour détecter les régressions
- Documenter les décisions d'optimisation pour la maintenance future

## 🔄 SYSTÈME DE RAFRAÎCHISSEMENT COORDONNÉ - SOLUTION VALIDÉE 🔄

### Problème Résolu : Boucles Infinies + Données Non Rafraîchies

**Contexte** : Après sauvegarde dans EditStepScreen, les données n'étaient pas mises à jour dans StepDetailScreen et StepsListScreen. Les tentatives de rafraîchissement automatique créaient des boucles infinies.

**Solution Implémentée** : Système de notification centralisé basé sur un timestamp + conditions strictes pour éviter les boucles infinies.

### Architecture DataRefreshContext ✅

#### 1. Contexte de Notification Centralisé
```typescript
// src/contexts/DataRefreshContext.tsx
interface DataRefreshContextType {
  lastStepUpdate: number;
  notifyStepUpdate: (stepId: string) => void;
}

export const DataRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastStepUpdate, setLastStepUpdate] = useState(0);

  const notifyStepUpdate = useCallback((stepId: string) => {
    console.log('🔔 DataRefreshContext - Notification de mise à jour step:', stepId);
    setLastStepUpdate(Date.now()); // Timestamp unique
  }, []);

  return (
    <DataRefreshContext.Provider value={{ lastStepUpdate, notifyStepUpdate }}>
      {children}
    </DataRefreshContext.Provider>
  );
};
```

#### 2. Intégration dans App.tsx
```typescript
// App.tsx - Provider racine
<DataRefreshProvider>
  <AppNavigator />
</DataRefreshProvider>
```

### Pattern d'Utilisation Standard ✅

#### 1. Écran d'Édition (EditStepScreen)
```typescript
const EditStepScreen = () => {
  const { notifyStepUpdate } = useDataRefresh();
  
  const handleSave = useCallback(async () => {
    // ... logique de sauvegarde ...
    
    if (result) {
      Alert.alert('Succès', 'Les modifications ont été sauvegardées', [{
        text: 'OK',
        onPress: () => {
          // 1. Notifier le système qu'un step a été mis à jour
          notifyStepUpdate(stepId);
          
          // 2. Rafraîchir les détails locaux
          refreshStepDetail(true).then(() => {
            // 3. Retourner à l'écran précédent
            navigation.goBack();
          });
        }
      }]);
    }
  }, [/* dépendances */]);
};
```

#### 2. Écrans d'Affichage (StepDetailScreen + StepsListScreen)
```typescript
const StepDetailScreen = () => {
  const { lastStepUpdate } = useDataRefresh();
  
  // Chargement initial - conditions strictes pour éviter boucles
  useFocusEffect(
    useCallback(() => {
      if (!step && !loading && !syncing) {
        fetchStepDetailRef.current();
      }
    }, [step, loading, syncing])
  );
  
  // Écoute des notifications - SÉCURISÉ par timestamp
  useEffect(() => {
    if (lastStepUpdate > 0 && step && !loading && !syncing) {
      console.log('🔔 StepDetailScreen - Notification reçue, rafraîchissement');
      refreshStepDetail(true);
    }
  }, [lastStepUpdate]); // Dépendance UNIQUEMENT sur le timestamp
};
```

### Règles de Sécurité Anti-Boucles Infinies ✅

#### 1. Conditions Strictes Obligatoires
```typescript
// ✅ CORRECT - Conditions de protection
if (lastStepUpdate > 0 && step && !loading && !syncing) {
  refreshStepDetail(true);
}

// ❌ INCORRECT - Pas de conditions
useEffect(() => {
  refreshStepDetail(true); // Boucle infinie garantie !
}, [lastStepUpdate]);
```

#### 2. Dépendances Minimales
```typescript
// ✅ CORRECT - Une seule dépendance
useEffect(() => {
  // logique de rafraîchissement
}, [lastStepUpdate]); // UNIQUEMENT le timestamp

// ❌ INCORRECT - Dépendances multiples qui changent
useEffect(() => {
  // logique de rafraîchissement
}, [lastStepUpdate, step, refreshFunction]); // refreshFunction change → boucle
```

#### 3. Séparation des Responsabilités
```typescript
// ✅ CORRECT - Responsabilités séparées
// useFocusEffect = chargement initial SEULEMENT
// useEffect(lastStepUpdate) = rafraîchissement sur notification SEULEMENT

// ❌ INCORRECT - Mélanger les responsabilités
useFocusEffect(() => {
  if (lastStepUpdate > 0) {
    refreshData(); // Mélange chargement initial + notification
  }
});
```

### Avantages de cette Solution ✅

#### 1. **Performance Optimisée**
- Rafraîchissement uniquement quand nécessaire
- Pas de polling ou vérifications constantes
- Conditions strictes empêchent les appels multiples

#### 2. **Sécurité Anti-Boucles**
- Timestamp unique comme déclencheur
- Dépendances minimales dans useEffect
- Séparation claire des responsabilités

#### 3. **Scalabilité**
- Réutilisable pour d'autres entités (roadtrips, activities...)
- Extensible : ajout de `notifyRoadtripUpdate()`, `notifyActivityUpdate()`
- Contexte centralisé pour toute l'application

#### 4. **Maintenance**
- Code propre et bien structuré
- Logs de debug pour traçabilité
- Pattern standardisé reproductible

### Cas d'Usage Validés ✅

1. **EditStepScreen** → sauvegarde → **notification** → **StepDetailScreen** + **StepsListScreen** se rafraîchissent automatiquement
2. **Navigation fluide** : EditStep → StepDetail → StepsList sans boucles infinies
3. **Données toujours à jour** : modifications visibles immédiatement après sauvegarde
4. **Performance préservée** : pas de re-renders excessifs ou d'appels API inutiles

### Pattern de Debug Recommandé ✅

```typescript
// Logging standardisé pour traçabilité
console.log('🔔 [Écran] - Notification reçue:', {
  lastStepUpdate,
  hasData: !!data,
  loading,
  syncing,
  action: 'rafraîchissement déclenché'
});
```

### Checklist d'Implémentation ✅

1. ✅ **DataRefreshProvider** ajouté dans App.tsx
2. ✅ **useDataRefresh()** importé dans les écrans concernés
3. ✅ **notifyStepUpdate()** appelé après sauvegarde
4. ✅ **useEffect(lastStepUpdate)** dans les écrans d'affichage
5. ✅ **Conditions strictes** pour éviter boucles infinies
6. ✅ **Dépendances minimales** dans tous les useEffect/useCallback
7. ✅ **Tests de navigation** multiples sans appels en double
8. ✅ **Logs de debug** pour traçabilité

**🎯 RÉSULTAT** : Solution production-ready, scalable et maintenable pour la synchronisation des données sans boucles infinies.
