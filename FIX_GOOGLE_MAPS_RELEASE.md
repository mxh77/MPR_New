# 🗺️ Guide de Configuration Google Maps API

## 🚨 Problème Identifié

Votre clé API Google Maps n'est pas configurée correctement, ce qui cause :
- **Loader permanent** : La carte ne peut pas se charger
- **Mode release uniquement** : Restrictions de sécurité plus strictes
- **Configuration manquante** : Placeholders au lieu de vraies clés

## 📋 Étapes pour Résoudre

### 1. Obtenir une clé API Google Maps

1. **Aller sur Google Cloud Console** : https://console.cloud.google.com/
2. **Créer/Sélectionner un projet**
3. **Activer les APIs nécessaires** :
   - Maps SDK for Android
   - Places API
   - Geocoding API (optionnel)

4. **Créer une clé API** :
   - Aller dans "APIs & Services" > "Credentials" 
   - Cliquer "Create Credentials" > "API Key"
   - Copier la clé générée

### 2. Configurer les Restrictions (IMPORTANT pour release)

Dans Google Cloud Console, cliquez sur votre clé API et configurez :

#### Restrictions d'API
- ✅ Maps SDK for Android
- ✅ Places API
- ❌ Décocher les autres pour la sécurité

#### Restrictions d'Application (Android)
- Sélectionner "Android apps"
- Ajouter votre package name : `com.maxime.heron.monpetitroadtrip2`
- Ajouter le SHA-1 fingerprint de votre keystore

### 3. Obtenir le SHA-1 Fingerprint

Pour l'APK de release, exécutez :
```bash
cd android
./gradlew signingReport
```

Ou avec keytool :
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 4. Configuration Automatique

Utilisez le script fourni :
```bash
node scripts/setup-google-maps.js VOTRE_CLE_API_ICI
```

### 5. Configuration Manuelle

Si vous préférez configurer manuellement :

#### Fichier .env
```bash
EXPO_PUBLIC_GOOGLE_API_KEY=VOTRE_CLE_API_ICI
```

#### android/app/src/main/res/values/strings.xml
```xml
<string name="google_maps_api_key">VOTRE_CLE_API_ICI</string>
```

### 6. Reconstruction et Test

```bash
# Nettoyer le cache
npx expo start --clear

# Reconstruire l'APK release
cd android
./gradlew clean
./gradlew assembleRelease
```

## 🔍 Vérifications

### Test de Configuration
```javascript
// Dans votre composant, ajouter temporairement :
console.log('Google API Key configuré:', ENV.GOOGLE_API_KEY ? '✅' : '❌');
```

### Test Google Maps
1. Ouvrir l'écran avec une carte
2. Vérifier que le loader disparaît
3. Vérifier l'interaction avec la carte

### Logs à Surveiller
```bash
# Si clé manquante
GooglePlacesInput: GOOGLE_API_KEY manquante

# Si clé invalide
Places API Error: REQUEST_DENIED

# Si restrictions incorrectes
Places API Error: API_KEY_INVALID
```

## ⚠️ Problèmes Courants

### "REQUEST_DENIED"
- Clé API invalide
- API non activée dans Google Cloud
- Restrictions trop strictes

### "API_KEY_INVALID"  
- SHA-1 fingerprint incorrect
- Package name incorrect
- Clé expirée ou révoquée

### Carte blanche/loader permanent
- Clé API manquante dans .env
- strings.xml non mis à jour
- APK non reconstruit après modification

## 🔐 Bonnes Pratiques Sécurité

1. **Restrictions d'API** : Limiter aux APIs nécessaires
2. **Restrictions d'App** : Configurer SHA-1 et package name
3. **Quotas** : Définir des limites de requêtes/jour
4. **Monitoring** : Surveiller l'usage dans Google Cloud Console

## 📞 Support

Si le problème persiste après configuration :
1. Vérifiez les logs de l'application
2. Testez d'abord en mode debug
3. Vérifiez la configuration Google Cloud Console
4. Attendez quelques minutes après modification (propagation)

## 🎯 Checklist Final

- [ ] Clé API créée dans Google Cloud Console
- [ ] APIs activées (Maps Android SDK + Places API)  
- [ ] Restrictions configurées (API + Application)
- [ ] SHA-1 fingerprint ajouté
- [ ] .env mis à jour avec la vraie clé
- [ ] strings.xml mis à jour
- [ ] APK release reconstruit
- [ ] Test effectué sur device/émulateur
