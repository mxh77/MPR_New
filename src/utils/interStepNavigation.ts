/**
 * Utilitaires pour la navigation inter-étapes - VERSION CORRIGÉE
 * Calcul des points de départ/arrivée et ouverture dans Google Maps
 */
import { Alert, Linking, Platform } from 'react-native';
import type { Step } from '../types';

interface LocationPoint {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

/**
 * Obtient la dernière entité (accommodation ou activité) d'un step
 * Version corrigée qui prend en compte endDateTime pour les activités
 */
export const getLastEntityFromStep = (step: Step): LocationPoint | null => {
  const stepWithData = step as any;
  
  // Récupérer toutes les entités avec coordonnées
  const entities: Array<{
    latitude?: number;
    longitude?: number;
    name: string;
    address?: string;
    type: 'accommodation' | 'activity';
    finalDateTime: string; // Date de fin réelle de l'entité
    rawData?: any; // Pour debug
  }> = [];

  // Ajouter les accommodations
  if (Array.isArray(stepWithData.accommodations)) {
    stepWithData.accommodations.forEach((acc: any) => {
      if (acc.latitude && acc.longitude) {
        const finalDateTime = acc.departureDateTime || acc.arrivalDateTime;
        if (finalDateTime) {
          entities.push({
            latitude: acc.latitude,
            longitude: acc.longitude,
            name: acc.name || 'Hébergement',
            address: acc.address,
            type: 'accommodation',
            finalDateTime,
            rawData: { departureDateTime: acc.departureDateTime, arrivalDateTime: acc.arrivalDateTime }
          });
        }
      }
    });
  }

  // Ajouter les activités
  if (Array.isArray(stepWithData.activities)) {
    stepWithData.activities.forEach((act: any) => {
      if (act.latitude && act.longitude) {
        // Pour les activités, prendre endDateTime en priorité, sinon departureDateTime, sinon arrivalDateTime/startDateTime
        const finalDateTime = act.endDateTime || act.departureDateTime || act.arrivalDateTime || act.startDateTime;
        if (finalDateTime) {
          entities.push({
            latitude: act.latitude,
            longitude: act.longitude,
            name: act.name || 'Activité',
            address: act.address,
            type: 'activity',
            finalDateTime,
            rawData: { 
              endDateTime: act.endDateTime, 
              departureDateTime: act.departureDateTime, 
              arrivalDateTime: act.arrivalDateTime,
              startDateTime: act.startDateTime 
            }
          });
        }
      }
    });
  }

  if (entities.length === 0) {
    // Fallback : utiliser les coordonnées du step lui-même
    if (step.location?.latitude && step.location?.longitude) {
      return {
        latitude: step.location.latitude,
        longitude: step.location.longitude,
        name: step.title || 'Étape',
        address: step.location.address,
      };
    }
    return null;
  }

  // Trier par date de fin (la plus tardive en premier)
  const sortedEntities = entities.sort((a, b) => {
    const dateA = new Date(a.finalDateTime).getTime();
    const dateB = new Date(b.finalDateTime).getTime();
    
    // Plus récent en premier (ordre décroissant)
    return dateB - dateA;
  });

  const lastEntity = sortedEntities[0];
  
  console.log('🏁 Point de départ trouvé (dernière entité):', {
    name: lastEntity.name,
    type: lastEntity.type,
    finalDateTime: lastEntity.finalDateTime,
    coordinates: `${lastEntity.latitude}, ${lastEntity.longitude}`,
    rawData: lastEntity.rawData,
    allEntitiesSorted: sortedEntities.map(e => ({
      name: e.name,
      type: e.type,
      finalDateTime: e.finalDateTime
    }))
  });

  return {
    latitude: lastEntity.latitude!,
    longitude: lastEntity.longitude!,
    name: lastEntity.name,
    address: lastEntity.address,
  };
};

/**
 * Obtient la première entité (accommodation ou activité) d'un step
 * Version corrigée qui prend en compte startDateTime pour les activités
 */
export const getFirstEntityFromStep = (step: Step): LocationPoint | null => {
  const stepWithData = step as any;
  
  // Récupérer toutes les entités avec coordonnées
  const entities: Array<{
    latitude?: number;
    longitude?: number;
    name: string;
    address?: string;
    type: 'accommodation' | 'activity';
    startDateTime: string; // Date de début réelle de l'entité
    rawData?: any; // Pour debug
  }> = [];

  // Ajouter les accommodations
  if (Array.isArray(stepWithData.accommodations)) {
    stepWithData.accommodations.forEach((acc: any) => {
      if (acc.latitude && acc.longitude) {
        const startDateTime = acc.arrivalDateTime;
        if (startDateTime) {
          entities.push({
            latitude: acc.latitude,
            longitude: acc.longitude,
            name: acc.name || 'Hébergement',
            address: acc.address,
            type: 'accommodation',
            startDateTime,
            rawData: { arrivalDateTime: acc.arrivalDateTime, departureDateTime: acc.departureDateTime }
          });
        }
      }
    });
  }

  // Ajouter les activités
  if (Array.isArray(stepWithData.activities)) {
    stepWithData.activities.forEach((act: any) => {
      if (act.latitude && act.longitude) {
        // Pour les activités, prendre startDateTime en priorité, sinon arrivalDateTime
        const startDateTime = act.startDateTime || act.arrivalDateTime;
        if (startDateTime) {
          entities.push({
            latitude: act.latitude,
            longitude: act.longitude,
            name: act.name || 'Activité',
            address: act.address,
            type: 'activity',
            startDateTime,
            rawData: { 
              startDateTime: act.startDateTime, 
              arrivalDateTime: act.arrivalDateTime,
              endDateTime: act.endDateTime,
              departureDateTime: act.departureDateTime 
            }
          });
        }
      }
    });
  }

  if (entities.length === 0) {
    // Fallback : utiliser les coordonnées du step lui-même
    if (step.location?.latitude && step.location?.longitude) {
      return {
        latitude: step.location.latitude,
        longitude: step.location.longitude,
        name: step.title || 'Étape',
        address: step.location.address,
      };
    }
    return null;
  }

  // Trier par date de début (la plus ancienne en premier)
  const sortedEntities = entities.sort((a, b) => {
    const dateA = new Date(a.startDateTime).getTime();
    const dateB = new Date(b.startDateTime).getTime();
    
    // Plus ancien en premier (ordre croissant)
    return dateA - dateB;
  });

  const firstEntity = sortedEntities[0];
  
  console.log('🎯 Point d\'arrivée trouvé (première entité):', {
    name: firstEntity.name,
    type: firstEntity.type,
    startDateTime: firstEntity.startDateTime,
    coordinates: `${firstEntity.latitude}, ${firstEntity.longitude}`,
    rawData: firstEntity.rawData,
    allEntitiesSorted: sortedEntities.map(e => ({
      name: e.name,
      type: e.type,
      startDateTime: e.startDateTime
    }))
  });

  return {
    latitude: firstEntity.latitude!,
    longitude: firstEntity.longitude!,
    name: firstEntity.name,
    address: firstEntity.address,
  };
};

/**
 * Ouvre Google Maps avec l'itinéraire entre deux points
 */
export const openGoogleMapsRoute = async (
  fromPoint: LocationPoint,
  toPoint: LocationPoint,
  travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving',
  avoidOptions: ('tolls' | 'highways' | 'ferries')[] = []
): Promise<void> => {
  try {
    // Construire l'URL Google Maps pour directions
    const fromCoords = `${fromPoint.latitude},${fromPoint.longitude}`;
    const toCoords = `${toPoint.latitude},${toPoint.longitude}`;
    
    // Mapping des modes de transport
    const dirflgMap = {
      driving: 'd',
      walking: 'w', 
      transit: 'r',
      bicycling: 'b'
    };
    
    // Mapping des options à éviter
    const avoidMap = {
      tolls: 't',
      highways: 'h', 
      ferries: 'f'
    };
    
    const dirflg = dirflgMap[travelMode];
    const avoid = avoidOptions.map(option => avoidMap[option]).join('');
    
    // URL pour l'app Google Maps (iOS/Android) avec API v1 et navigation
    let mapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromCoords}&destination=${toCoords}&travelmode=${travelMode}&dir_action=navigate`;
    if (avoidOptions.length > 0) {
      mapsAppUrl += `&avoid=${avoidOptions.join('|')}`;
    }

    // URL alternative pour le navigateur web
    let webUrl = `https://maps.google.com/maps?saddr=${fromCoords}&daddr=${toCoords}&dirflg=${dirflg}`;
    if (avoid) {
      webUrl += `&avoid=${avoid}`;
    }

    // URL spécifique pour forcer l'ouverture dans Google Maps app avec navigation et origine
    const googleMapsAppUrl = `comgooglemaps://?saddr=${fromCoords}&daddr=${toCoords}&directionsmode=driving&nav=1&start=true`;
    
    // URL Android native pour démarrage direct de navigation (Intent-based)
    // Cette méthode démarre directement la navigation mais sans point de départ spécifique
    const androidNavigationUrl = `google.navigation:q=${toCoords}&mode=d`;
    
    // URL Android alternative avec syntaxe complète
    const androidNavigationFullUrl = `intent://navigation?q=${toCoords}&mode=d#Intent;scheme=google.navigation;package=com.google.android.apps.maps;end`;
    
    // URL iOS alternative pour Apple Maps navigation
    const iosNavigationUrl = `http://maps.apple.com/?saddr=${fromCoords}&daddr=${toCoords}&dirflg=d`;

    console.log('🗺️ Ouverture Google Maps route:', {
      from: `${fromPoint.name} (${fromCoords})`,
      to: `${toPoint.name} (${toCoords})`,
      platform: Platform.OS,
      standardUrl: mapsAppUrl,
      appUrl: googleMapsAppUrl,
      androidNavUrl: androidNavigationUrl,
      androidNavFullUrl: androidNavigationFullUrl,
      iosNavUrl: iosNavigationUrl
    });

    // Essayer d'ouvrir dans l'app Google Maps avec différentes méthodes selon la plateforme
    
    // ANDROID: Essayer d'abord l'intent natif pour navigation directe
    if (Platform.OS === 'android') {
      // Méthode Android 1: Navigation directe vers destination (Démarrer immédiat)
      try {
        const canOpenAndroidNav = await Linking.canOpenURL(androidNavigationUrl);
        console.log('🤖 Test Android navigation intent (destination seule):', { canOpen: canOpenAndroidNav, url: androidNavigationUrl });
        
        if (canOpenAndroidNav) {
          console.log('✅ Ouverture via Android navigation intent (Démarrer direct vers destination)');
          await Linking.openURL(androidNavigationUrl);
          return;
        }
      } catch (error) {
        console.log('⚠️ Échec Android navigation intent:', error);
      }

      // Méthode Android 2: Intent complet avec package explicite
      try {
        const canOpenAndroidNavFull = await Linking.canOpenURL(androidNavigationFullUrl);
        console.log('🤖 Test Android navigation intent (full):', { canOpen: canOpenAndroidNavFull, url: androidNavigationFullUrl });
        
        if (canOpenAndroidNavFull) {
          console.log('✅ Ouverture via Android navigation intent full (Démarrer direct vers destination)');
          await Linking.openURL(androidNavigationFullUrl);
          return;
        }
      } catch (error) {
        console.log('⚠️ Échec Android navigation intent full:', error);
      }
    }
    
    // iOS: Essayer Apple Maps navigation en premier
    if (Platform.OS === 'ios') {
      try {
        const canOpenIOSNav = await Linking.canOpenURL(iosNavigationUrl);
        console.log('🍎 Test iOS Apple Maps navigation:', { canOpen: canOpenIOSNav, url: iosNavigationUrl });
        
        if (canOpenIOSNav) {
          console.log('✅ Ouverture via Apple Maps navigation');
          await Linking.openURL(iosNavigationUrl);
          return;
        }
      } catch (error) {
        console.log('⚠️ Échec iOS Apple Maps navigation:', error);
      }
    }

    try {
      // Méthode 2: Essayer le schéma URL spécifique à Google Maps
      const canOpenGoogleMapsApp = await Linking.canOpenURL(googleMapsAppUrl);
      console.log('🔍 Test Google Maps app URL:', { canOpen: canOpenGoogleMapsApp, url: googleMapsAppUrl });
      
      if (canOpenGoogleMapsApp) {
        console.log('✅ Ouverture via Google Maps app URL');
        await Linking.openURL(googleMapsAppUrl);
        return;
      }
    } catch (error) {
      console.log('⚠️ Échec Google Maps app URL:', error);
    }

    try {
      // Méthode 3: Essayer l'URL standard Google Maps
      const canOpenMaps = await Linking.canOpenURL(mapsAppUrl);
      console.log('🔍 Test URL standard:', { canOpen: canOpenMaps, url: mapsAppUrl });
      
      if (canOpenMaps) {
        console.log('✅ Ouverture via URL standard');
        await Linking.openURL(mapsAppUrl);
        return;
      }
    } catch (error) {
      console.log('⚠️ Échec URL standard:', error);
    }

    // Méthode 4: Fallback vers le navigateur web
    console.log('🌐 Fallback vers navigateur web');
    await Linking.openURL(webUrl);
  } catch (error) {
    console.error('❌ Erreur ouverture Google Maps:', error);
    Alert.alert(
      'Erreur',
      'Impossible d\'ouvrir Google Maps. Vérifiez que l\'application est installée.'
    );
  }
};

/**
 * Fonction principale pour ouvrir l'itinéraire inter-étapes
 */
export const openInterStepRoute = async (
  fromStep: Step,
  toStep: Step
): Promise<void> => {
  try {
    console.log('🛣️ Calcul itinéraire inter-étapes:', {
      from: fromStep.title,
      to: toStep.title
    });

    // Obtenir le point de départ (dernière entité du step précédent)
    const fromPoint = getLastEntityFromStep(fromStep);
    if (!fromPoint) {
      Alert.alert(
        'Information',
        `Aucun point de départ trouvé pour "${fromStep.title}". Ajoutez des coordonnées à vos hébergements ou activités.`
      );
      return;
    }

    // Obtenir le point d'arrivée (première entité du step suivant)
    const toPoint = getFirstEntityFromStep(toStep);
    if (!toPoint) {
      Alert.alert(
        'Information',
        `Aucun point d'arrivée trouvé pour "${toStep.title}". Ajoutez des coordonnées à vos hébergements ou activités.`
      );
      return;
    }

    // Afficher une confirmation avant d'ouvrir Google Maps
    Alert.alert(
      'Itinéraire inter-étapes',
      `Ouvrir l'itinéraire :\n\n📍 Départ : ${fromPoint.name}\n📍 Arrivée : ${toPoint.name}`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Ouvrir Google Maps',
          onPress: () => openGoogleMapsRoute(fromPoint, toPoint, 'driving', []) // Mode conduite, sans éviter les péages
        }
      ]
    );

  } catch (error) {
    console.error('❌ Erreur calcul itinéraire:', error);
    Alert.alert(
      'Erreur',
      'Impossible de calculer l\'itinéraire entre les étapes.'
    );
  }
};
