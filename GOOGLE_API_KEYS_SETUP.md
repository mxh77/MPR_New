# 🔑 Configuration des Clés API Google (Dev + Prod)

## 📋 Vue d'ensemble

Cette configuration vous permet d'avoir **deux clés API Google distinctes** :
- **Clé de développement** : Sans restrictions, pour les tests locaux
- **Clé de production** : Avec restrictions strictes, pour l'app en release

## 🏗️ Architecture Mise en Place

### 1. Fichiers de Configuration
```
src/config/env.ts    → Logique de sélection automatique des clés
.env                 → Variables d'environnement avec les deux clés
```

### 2. Sélection Automatique
Le système détecte automatiquement l'environnement :
- **Mode Debug (`__DEV__ = true`)** → Utilise `GOOGLE_API_KEY_DEV`
- **Mode Release (`__DEV__ = false`)** → Utilise `GOOGLE_API_KEY_PROD`

## 🔧 Étapes de Configuration

### Étape 1: Créer les Clés dans Google Cloud Console

#### Clé de Développement
1. **Google Cloud Console** > **APIs & Services** > **Credentials**
2. **Create Credentials** > **API Key**
3. **Nom** : "Google Places - Development"
4. **Application restrictions** : **None** (aucune restriction)
5. **API restrictions** : Activez seulement **Places API** et **Maps SDK for Android**
6. **Copiez la clé** : `AIzaSy...`

#### Clé de Production  
1. **Create Credentials** > **API Key**
2. **Nom** : "Google Places - Production"
3. **Application restrictions** : **Android apps**
   - Ajoutez votre empreinte de **release** : `XX:XX:XX:...` 
4. **API restrictions** : Activez seulement **Places API** et **Maps SDK for Android**
5. **Copiez la clé** : `AIzaSy...`

### Étape 2: Mettre à Jour le .env

```properties
# API Keys - Séparées par environnement
# Clé pour le développement (sans restrictions)
EXPO_PUBLIC_GOOGLE_API_KEY_DEV=AIzaSyVOTRE_CLE_DEV_ICI

# Clé pour la production (avec restrictions)  
EXPO_PUBLIC_GOOGLE_API_KEY_PROD=AIzaSyVOTRE_CLE_PROD_ICI
```

### Étape 3: Redémarrer l'Application

```bash
# Redémarrage complet pour recharger la configuration
npx expo start --clear
```

## ✅ Vérification du Fonctionnement

### Logs Attendus

**En Mode Développement :**
```
🔍 GooglePlacesInput - Configuration API: {
  "environment": "development",
  "hasKey": true,
  "isDevelopment": true,
  "keyStart": "AIzaSyVOTR"
}
🧪 Test API résultat: {"status": "OK", "predictionsCount": 5}
```

**En Mode Production :**
```
🔍 GooglePlacesInput - Configuration API: {
  "environment": "production", 
  "hasKey": true,
  "isDevelopment": false,
  "keyStart": "AIzaSyAUTR"
}
```

### Test Fonctionnel
1. **Développement** : Autocomplete fonctionne sans restrictions
2. **Production** : Autocomplete fonctionne avec les restrictions de sécurité

## 🛡️ Sécurité et Bonnes Pratiques

### Restrictions Recommandées

#### Clé de Développement (Permissive)
- **Application restrictions** : None
- **API restrictions** : Places API + Maps SDK uniquement
- **Usage** : Tests locaux, émulateurs, développement

#### Clé de Production (Stricte)
- **Application restrictions** : Android apps avec empreinte de release
- **API restrictions** : Places API + Maps SDK uniquement  
- **Usage** : Application publiée sur Google Play Store

### Avantages de cette Configuration
1. **Sécurité** : Clé de prod protégée, clé de dev libre
2. **Simplicité** : Sélection automatique selon l'environnement
3. **Debugging** : Logs clairs pour identifier quelle clé est utilisée
4. **Maintenance** : Modification facile via .env sans recompilation

## 🚨 Résolution de Problèmes

### Si l'autocomplete ne fonctionne toujours pas :

1. **Vérifiez les logs** : Quelle clé est utilisée ?
2. **Vérifiez le .env** : Les deux clés sont-elles définies ?
3. **Testez séparément** : Copiez une clé dans l'autre variable
4. **Empreinte manquante** : Vérifiez que l'empreinte de release est ajoutée pour la clé de prod

### Debug Avancé
```bash
# Afficher la configuration actuelle
console.log('Config ENV:', ENV);

# Tester directement une clé
https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Paris&key=VOTRE_CLE&language=fr
```

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|--------|
| **Clés API** | 1 clé unique | 2 clés séparées |
| **Sécurité Dev** | Restrictions bloquantes | Aucune restriction |
| **Sécurité Prod** | Potentiellement faible | Restrictions strictes |
| **Configuration** | Manuelle | Automatique |
| **Debug** | Difficile | Logs détaillés |

## 🎯 Prochaines Étapes

1. ✅ Créer les deux clés API dans Google Cloud Console
2. ✅ Mettre à jour le .env avec les nouvelles clés
3. ✅ Tester en mode développement
4. ✅ Tester en mode production/release
5. ✅ Valider que les logs montrent la bonne clé selon l'environnement
