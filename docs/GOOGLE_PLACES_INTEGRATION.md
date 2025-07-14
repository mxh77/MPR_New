# 🗺️ Intégration Google Places Autocomplete

## 📋 Composants créés

### 1. `GooglePlacesInput` - Composant de base
Composant d'autocomplétion Google Places avec interface moderne et modal pour les suggestions.

### 2. `AddressInput` - Composant spécialisé
Wrapper du GooglePlacesInput avec label, gestion d'erreurs et icônes personnalisées selon le type d'entité.

## 🚀 Utilisation

### Dans le formulaire de création de roadtrip
```tsx
import { GooglePlacesInput } from '../../components/common';

// Lieu de départ et d'arrivée
<GooglePlacesInput
  value={formData.startLocation}
  onChangeText={(value) => handleLocationSuggestion('startLocation', value)}
  onPlaceSelected={(place) => handlePlaceSelected('startLocation', place)}
  placeholder="Ex: Paris, France"
  icon="location-outline"
/>
```

### Pour les entités (Step, Activity, Accommodation)
```tsx
import { AddressInput } from '../../components/common';

// Pour une étape
<AddressInput
  value={stepData.location.address}
  onChangeText={(address) => updateStepLocation(address)}
  onPlaceSelected={(place) => handlePlaceSelected(place)}
  label="Lieu de l'étape"
  entityType="step"
  required={true}
  error={errors.location}
/>

// Pour une activité
<AddressInput
  value={activityData.location?.address}
  onChangeText={(address) => updateActivityLocation(address)}
  label="Lieu de l'activité"
  entityType="activity"
  placeholder="Rechercher un lieu d'activité..."
/>

// Pour un hébergement
<AddressInput
  value={accommodationData.location.address}
  onChangeText={(address) => updateAccommodationLocation(address)}
  label="Adresse de l'hébergement"
  entityType="accommodation"
  required={true}
/>

// Pour un restaurant
<AddressInput
  value={restaurantData.location?.address}
  onChangeText={(address) => updateRestaurantLocation(address)}
  label="Adresse du restaurant"
  entityType="restaurant"
/>
```

## 🎨 Personnalisation par type d'entité

Le composant `AddressInput` adapte automatiquement :

### Icônes
- **Step** : `map-outline` (bleu info)
- **Activity** : `fitness-outline` (orange warning)
- **Accommodation** : `bed-outline` (vert success)
- **Restaurant** : `restaurant-outline` (gris secondary)
- **Générique** : `location-outline` (bleu primary)

### Placeholders
- **Step** : "Rechercher un lieu d'étape..."
- **Activity** : "Rechercher une activité ou un lieu..."
- **Accommodation** : "Rechercher un hébergement..."
- **Restaurant** : "Rechercher un restaurant..."
- **Générique** : "Rechercher une adresse..."

## 🔧 Configuration

### Variables d'environnement
```bash
EXPO_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here
```

### Clé API Google Places
1. Créer un projet Google Cloud Console
2. Activer l'API Places
3. Créer une clé API
4. Restreindre la clé pour les applications mobiles
5. Ajouter la clé dans `.env`

## 📱 Fonctionnalités

### GooglePlacesInput
- ✅ Autocomplétion en temps réel
- ✅ Debounce pour optimiser les appels API
- ✅ Modal overlay pour les suggestions
- ✅ Support dark/light theme
- ✅ Icônes personnalisables
- ✅ Gestion du focus/blur
- ✅ Callbacks pour sélection de place

### AddressInput
- ✅ Label avec indicateur requis
- ✅ Gestion des erreurs
- ✅ Types d'entités prédéfinis
- ✅ Icônes et couleurs automatiques
- ✅ Placeholders contextuels
- ✅ Support disabled state

## 🐛 Résolution des problèmes z-index

L'implémentation utilise un `Modal` React Native pour afficher les suggestions, ce qui résout les problèmes de z-index couramment rencontrés avec les FlatList et ScrollView imbriqués.

### Avantages de cette approche :
- ✅ Suggestions toujours au premier plan
- ✅ Compatible avec tous les conteneurs
- ✅ Performances optimisées
- ✅ Gestion native du clavier
- ✅ Fermeture automatique lors du scroll

## 🔮 Évolutions futures

1. **Cache des suggestions** : Stocker les résultats fréquents
2. **Géolocalisation** : Suggestions basées sur la position
3. **Historique** : Suggestions des adresses récemment utilisées
4. **Filtres** : Restriction par type d'établissement
5. **Détails enrichis** : Récupération des informations complètes via Place Details API

## 📝 Notes d'implémentation

- La mesure de position utilise `measure()` pour positionner précisément le modal
- Le debounce de 300ms évite les appels API excessifs
- Les styled-components sont typés avec le thème de l'application
- L'interface respecte la charte graphique existante
- Compatible avec TypeScript strict

## 🧪 Tests

Pour tester l'autocomplétion :
1. Saisir au moins 2 caractères
2. Vérifier l'apparition des suggestions
3. Tester la sélection d'une suggestion
4. Vérifier la fermeture automatique du modal
5. Tester les différents types d'entités
