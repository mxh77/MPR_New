# Google Places API - Configuration et Utilisation

## 🚀 Configuration Initiale

### 1. Obtenir une clé API Google Places
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API "Places API" et "Places API (New)"
4. Créer une clé API dans "Identifiants"
5. Restreindre la clé aux APIs Places pour la sécurité

### 2. Configuration dans l'Application
Ajouter la clé dans votre fichier `.env` :
```bash
EXPO_PUBLIC_GOOGLE_API_KEY=votre_cle_api_google_ici
```

## 🔧 Utilisation du Composant GooglePlacesInput

### Import et Intégration
```typescript
import { GooglePlacesInput } from '../../components/common';

// Remplacer un TextInput classique
<GooglePlacesInput
  value={formData.address}
  onChangeText={handleAddressChange}
  onPlaceSelected={handlePlaceSelected}
  placeholder="Rechercher une adresse..."
  label="Adresse"
  icon="map"
/>
```

### Gestion de la Sélection
```typescript
const handlePlaceSelected = useCallback(async (place: any) => {
  try {
    // Récupération automatique des coordonnées
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry,formatted_address&key=${ENV.GOOGLE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.result?.geometry?.location) {
      const { lat, lng } = data.result.geometry.location;
      const address = data.result.formatted_address;
      
      // Mise à jour du state avec coordonnées
      setFormData(prev => ({
        ...prev,
        address,
        latitude: lat,
        longitude: lng
      }));
    }
  } catch (error) {
    console.error('Erreur Places API:', error);
    // Fallback sur la description du lieu
    handleAddressChange(place.description);
  }
}, []);
```

## 📊 Stockage des Données

### Structure Location
```typescript
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

// Dans le formData
{
  address: 'Tour Eiffel, Paris, France',
  latitude: 48.8584,
  longitude: 2.2945
}
```

### Sauvegarde avec Coordonnées
```typescript
const updatedData = {
  name: formData.name.trim(),
  address: formData.address.trim(),
  latitude: formData.latitude,
  longitude: formData.longitude,
  // ... autres champs
};
```

## 🎯 Fonctionnalités

### Auto-complétion Intelligente
- Recherche à partir de 2 caractères
- Debounce de 300ms pour optimiser les appels API
- Suggestions en français (`language=fr`)
- **Clavier reste ouvert** pendant la sélection des suggestions
- **Saisie continue** possible après sélection d'une suggestion

### Interface Optimisée
- Suggestions affichées directement sous le champ (sans Modal)
- `keyboardShouldPersistTaps="handled"` pour interaction fluide
- Positionnement absolu pour éviter conflits avec le clavier
- zIndex élevé pour superposition correcte

### Gestion des Erreurs
- Fallback sur description du lieu si API échoue
- Logs détaillés pour debugging
- Validation de la clé API manquante
- **Clavier maintenu ouvert** même en cas d'erreur

### Interface Utilisateur
- Style cohérent avec le design de l'app
- Icônes Ionicons intégrées
- Support du thème dark/light
- Responsive pour toutes tailles d'écran
- **Pas de fermeture intempestive du clavier**
- **Sélection sans interruption de la saisie**

## 🔒 Sécurité et Coûts

### Restrictions Recommandées
```
// Dans Google Cloud Console, restreindre par :
- API : Places API uniquement
- Applications : Bundle ID de votre app
- Quotas : Limiter le nombre de requêtes/jour
```

### Optimisation des Coûts
- Debounce pour réduire les appels
- Fields spécifiques : `geometry,formatted_address`
- Mise en cache des résultats fréquents
- Limitation par IP si nécessaire

## 🐛 Debugging

### Vérifications Courantes
```typescript
// Vérifier la clé API
console.log('Google API Key:', ENV.GOOGLE_API_KEY ? '✅ Configuré' : '❌ Manquant');

// Logger les réponses API
console.log('Places Response:', data.status, data.predictions?.length);

// Valider les coordonnées
console.log('Coordinates:', { lat, lng, isValid: lat && lng });
```

### Erreurs Fréquentes
- `REQUEST_DENIED` : Clé API invalide ou restrictions trop strictes
- `ZERO_RESULTS` : Aucun lieu trouvé pour la requête
- `OVER_QUERY_LIMIT` : Quota dépassé
- Network Error : Problème de connectivité

## � Améliorations UX - Clavier Persistant

### Problème Résolu
**Avant** : Le clavier se fermait dès que les suggestions apparaissaient, interrompant l'expérience utilisateur.

### Solution Implémentée
```typescript
// ✅ AVANT : Modal ferme le clavier
<Modal visible={showSuggestions}>
  <FlatList keyboardShouldPersistTaps="always" />
</Modal>

// ✅ APRÈS : View positionnée maintient le clavier
{showSuggestions && (
  <View style={{ position: 'absolute', zIndex: 9999 }}>
    <FlatList keyboardShouldPersistTaps="handled" />
  </View>
)}
```

### Changements Techniques
1. **Suppression du Modal** → View avec position absolue
2. **Pas de blur automatique** → Clavier reste ouvert après sélection
3. **keyboardShouldPersistTaps="handled"** → Permet tap sur suggestions
4. **zIndex optimal** → Superposition correcte des suggestions

### Résultat
- ✅ Clavier reste ouvert pendant la sélection
- ✅ Possibilité de continuer à taper après sélection
- ✅ Expérience fluide et ininterrompue
- ✅ Performance optimisée (pas de Modal)

## �📱 Exemple Complet - EditStepScreen

Voir `src/screens/steps/EditStepScreen.tsx` pour un exemple complet d'intégration avec :
- Gestion du state avec coordonnées
- Sauvegarde incluant latitude/longitude  
- Interface utilisateur cohérente
- Gestion d'erreurs robuste
