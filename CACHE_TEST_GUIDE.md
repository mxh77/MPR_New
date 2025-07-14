# Guide de Test - Stratégie Cache-First ✅

## Objectif
Valider que l'application utilise bien le cache local WatermelonDB au lieu de faire systématiquement des appels API.

## Logs à Observer

### 🗄️ CACHE - Utilisation des données locales
```
🗄️ CACHE - Chargement steps locaux pour roadtripId: [ID]
🗄️ CACHE - Steps trouvés en local: [NOMBRE]
🗄️ CACHE - Steps finaux après conversion: [NOMBRE]
🗄️ CACHE - ✅ DONNÉES LOCALES UTILISÉES (cache-first)
```

### 🌐 API - Synchronisation avec serveur
```
🌐 API - Début synchronisation pour roadtripId: [ID]
🌐 API - Étapes récupérées: [NOMBRE]
🌐 API - ✅ DONNÉES API UTILISÉES (synchronisation)
```

### 📍 DÉCISION - Choix cache vs API
```
📍 ⚡ DÉCISION: Données pas à jour ou connectivité OK - Synchronisation API
📍 ✅ DÉCISION: Données locales à jour - Pas de synchronisation API
```

## Scénarios de Test

### ✅ Test 1 : Premier accès (cache vide)
**Comportement attendu :**
1. `🗄️ CACHE - Steps trouvés en local: 0`
2. `📍 ⚡ DÉCISION: Données pas à jour` → Sync API
3. `🌐 API - ✅ DONNÉES API UTILISÉES`

### ✅ Test 2 : Accès suivant (cache présent, données récentes)
**Comportement attendu :**
1. `🗄️ CACHE - Steps trouvés en local: [N]`
2. `🗄️ CACHE - ✅ DONNÉES LOCALES UTILISÉES`
3. `📍 ✅ DÉCISION: Données locales à jour - Pas de synchronisation API`
4. **AUCUN appel API**

### ✅ Test 3 : Pull-to-refresh explicite
**Comportement attendu :**
1. `🗄️ CACHE - ✅ DONNÉES LOCALES UTILISÉES` (chargement initial)
2. `🌐 API - ✅ DONNÉES API UTILISÉES` (refresh forcé)

### ✅ Test 4 : Navigation retour (même session)
**Comportement attendu :**
1. `🗄️ CACHE - ✅ DONNÉES LOCALES UTILISÉES`
2. `📍 ✅ DÉCISION: Données locales à jour - Pas de synchronisation API`
3. **AUCUN appel API**

## Instructions de Test

1. **Ouvrir les Developer Tools** et filtrer les logs avec `🗄️|🌐|📍`
2. **Test 1** : Naviguer vers une liste d'étapes pour la première fois
3. **Test 2** : Revenir sur la même liste (attendre >1 minute pour voir le cache en action)
4. **Test 3** : Faire un pull-to-refresh explicite
5. **Test 4** : Naviguer vers le détail d'une étape puis revenir

## Résultats Attendus

### ❌ Comportement INCORRECT (ancien)
- Appel API systématique à chaque navigation
- Logs `🌐 API` à chaque accès à la liste

### ✅ Comportement CORRECT (nouveau)
- Premier accès : Cache vide → Appel API
- Accès suivants : Cache utilisé → Pas d'appel API
- Pull-to-refresh : Cache utilisé + Appel API en background
- Navigation : Cache utilisé → Pas d'appel API

## Points de Validation

1. **Performance** : Chargement instantané des listes (cache)
2. **Réseau** : Moins d'appels API dans les logs
3. **UX** : Pas de loader à chaque navigation
4. **Offline** : Fonctionne sans connexion après première sync

---

**Stratégie Offline-First validée si :**
- Logs `🗄️ CACHE` apparaissent AVANT `🌐 API`
- Logs `📍 ✅ DÉCISION: Données locales à jour` fréquents
- Pas d'appel API systématique lors des navigations
