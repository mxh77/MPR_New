# 🔧 Configuration Google Cloud Console - SHA-1 Debug/Release

## 📋 Informations de votre application

### Package Name
```
com.maxime.heron.monpetitroadtrip2
```

### SHA-1 Fingerprint (Debug ET Release)
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

## 🔧 Étapes Configuration Google Cloud Console

### 1. Accès à la Console
1. Aller sur : https://console.cloud.google.com/
2. Sélectionner votre projet
3. Menu **APIs & Services** → **Credentials**

### 2. Modification de la Clé API
1. Cliquer sur votre clé API : `AIzaSyACdCqr5qD5DMlZafUjOGXAFJe-J1GnIjI`
2. Section **Application restrictions**
3. Sélectionner **Android apps**

### 3. Ajouter l'Application
Cliquer **Add an item** et ajouter :
```
Package name: com.maxime.heron.monpetitroadtrip2
SHA-1 certificate fingerprint: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### 4. APIs Autorisées
Vérifier que ces APIs sont **cochées** :
- ✅ Maps SDK for Android
- ✅ Places API  
- ✅ Geocoding API (optionnel)

### 5. Sauvegarder
Cliquer **Save** et attendre 2-3 minutes pour la propagation.

## 🧪 Test

1. **Rebuilder l'APK release** :
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

2. **Installer et tester** :
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

3. **Vérifier les cartes** dans l'application

## ⚠️ Notes Importantes

- **Same SHA-1** : Votre debug et release utilisent le même keystore (normal en développement)
- **Production** : En production, vous devriez utiliser un keystore de release dédié
- **Délai** : Les changements Google Cloud mettent 2-5 minutes à se propager

## 🔍 Si le problème persiste

1. **Vérifiez les logs** :
```bash
adb logcat | grep -i "google\|maps\|places"
```

2. **API Quotas** : Vérifiez que vous n'avez pas dépassé les quotas
3. **Billing** : Assurez-vous que la facturation est activée (requis pour Google Maps)
