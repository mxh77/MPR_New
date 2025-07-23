/**
 * Utilitaires pour la navigation inter-étapes - VERSION CORRIGÉE
 * Calcul des points de départ/arrivée et ouverture dans Google Maps
 */
import { Alert, Linking } from 'react-native';
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
    
    // URL pour l'app Google Maps (iOS/Android) avec API v1
    let mapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromCoords}&destination=${toCoords}&travelmode=${travelMode}`;
    if (avoidOptions.length > 0) {
      mapsAppUrl += `&avoid=${avoidOptions.join('|')}`;
    }

    // URL alternative pour le navigateur web
    let webUrl = `https://maps.google.com/maps?saddr=${fromCoords}&daddr=${toCoords}&dirflg=${dirflg}`;
    if (avoid) {
      webUrl += `&avoid=${avoid}`;
    }

    console.log('🗺️ Ouverture Google Maps route:', {
      from: `${fromPoint.name} (${fromCoords})`,
      to: `${toPoint.name} (${toCoords})`,
      url: mapsAppUrl
    });

    // Essayer d'ouvrir dans l'app Google Maps
    const canOpenMaps = await Linking.canOpenURL(mapsAppUrl);
    
    if (canOpenMaps) {
      await Linking.openURL(mapsAppUrl);
    } else {
      // Fallback vers le navigateur web
      await Linking.openURL(webUrl);
    }
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
