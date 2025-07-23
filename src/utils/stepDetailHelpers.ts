/**
 * Utilitaires communs pour les écrans de détail d'étape
 * Fonctions réutilisables entre les différents onglets
 */
import { Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISODate, formatDateWithoutTimezone } from './index';

/**
 * Fonction pour extraire l'URI de l'image depuis l'objet thumbnail
 */
export const getImageUri = (thumbnail: any): string | null => {
//   console.log('🖼️ getImageUri - thumbnail reçu:', {
//     type: typeof thumbnail,
//     value: thumbnail,
//     hasUrl: thumbnail?.url,
//     hasUri: thumbnail?.uri,
//     isString: typeof thumbnail === 'string'
//   });

  // 🔍 DEBUG: Vérifier si l'URL est déjà corrompue à la réception
  if (thumbnail?.url) {
    // console.log('🔍 DEBUG URL AVANT nettoyage:', {
    //   originalUrl: thumbnail.url,
    //   hasGGoogleAccessId: thumbnail.url.includes('GGoogleAccessId'),
    //   hasCorrectGoogleAccessId: thumbnail.url.includes('GoogleAccessId') && !thumbnail.url.includes('GGoogleAccessId')
    // });
  }

  if (!thumbnail) {
    // console.log('🖼️ getImageUri - thumbnail null/undefined');
    return null;
  }

  // Si c'est déjà une chaîne valide
  if (typeof thumbnail === 'string' && thumbnail.trim().length > 0) {
    const uri = thumbnail.trim();
    // console.log('🖼️ getImageUri - string:', uri);
    return uri;
  }

  // Si c'est un objet avec une propriété url (PRIORITÉ selon API)
  if (typeof thumbnail === 'object' && thumbnail !== null) {
    // PRIORITÉ 1: thumbnail.url (selon API)
    if (thumbnail.url && typeof thumbnail.url === 'string' && thumbnail.url.trim().length > 0) {
      // SÉCURITÉ: Nettoyer l'URL pour éviter les corruptions
      const cleanUrl = thumbnail.url.trim()
        .replace(/^https?:\/\/storrage\./, 'https://storage.')  // Corriger "storrage" → "storage"
        .replace(/^htttps:\/\//, 'https://')                    // Corriger "htttps" → "https"
      // CORRECTION: Ne PAS appliquer le nettoyage GGoogleAccessId car l'URL est déjà propre
      // .replace(/GGoogleAccessId/g, 'GoogleAccessId');         // DÉSACTIVÉ - causait la corruption

    //   console.log('🖼️ getImageUri - object.url (API):', cleanUrl);
      return cleanUrl;
    }

    // PRIORITÉ 2: thumbnail.uri (fallback)
    if (thumbnail.uri && typeof thumbnail.uri === 'string' && thumbnail.uri.trim().length > 0) {
      const uri = thumbnail.uri.trim();
    //   console.log('🖼️ getImageUri - object.uri (fallback):', uri);
      return uri;
    }

    // PRIORITÉ 3: Si l'objet a d'autres propriétés, les logger pour debug
    // console.warn('🖼️ getImageUri - Objet thumbnail sans url/uri:', {
    //   keys: Object.keys(thumbnail),
    //   thumbnail
    // });
  }

//   console.log('🖼️ getImageUri - Aucun format reconnu pour:', thumbnail);
  return null;
};

/**
 * Validation stricte de l'URI pour éviter les erreurs de casting
 */
export const isValidImageUri = (uri: any): uri is string => {
  if (typeof uri !== 'string' || uri.length === 0) {
    console.warn('🖼️ URI invalide - pas une string ou vide:', {
      uri,
      type: typeof uri,
      isString: typeof uri === 'string',
      hasLength: uri?.length > 0
    });
    return false;
  }

  // Vérifier que l'URI commence bien par un protocole valide
  const hasValidProtocol = uri.startsWith('http://') || uri.startsWith('https://') ||
    uri.startsWith('file://') || uri.startsWith('data:');

  if (!hasValidProtocol) {
    console.warn('🖼️ URI invalide - protocole invalide:', {
      uri,
      startsWithHttp: uri.startsWith('http'),
      startsWithHttps: uri.startsWith('https'),
      startsWithFile: uri.startsWith('file'),
      startsWithData: uri.startsWith('data')
    });
    return false;
  }

  // Vérifier qu'il n'y a pas de caractères corrompus typiques
  const hasCorruption = uri.includes('storrage.') ||      // "storrage" au lieu de "storage"
    uri.includes('htttps://') ||      // "htttps" au lieu de "https"
    uri.includes('GGoogleAccessId');  // "GGoogleAccessId" au lieu de "GoogleAccessId"

  if (hasCorruption) {
    console.warn('🖼️ URI détectée comme corrompue:', {
      uri,
      hasStorrage: uri.includes('storrage.'),
      hasTripleT: uri.includes('htttps://'),
      hasDoubleG: uri.includes('GGoogleAccessId')
    });
    return false;
  }

  return true;
};

/**
 * Interfaces pour le composant SafeImage
 */
export interface SafeImageProps {
  thumbnail: any;
  style: any;
  placeholderIcon: keyof typeof Ionicons.glyphMap;
  onError?: (error: any) => void;
  theme: any;
}

/**
 * Formater les dates de manière cohérente
 */
export const formatItemDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = parseISODate(dateString);
  return date ? formatDateWithoutTimezone(date) : 'N/A';
};

/**
 * Validation des coordonnées géographiques
 * Note: 0,0 est une coordonnée valide (au large de l'Afrique)
 */
export const hasValidCoordinates = (item: any): boolean => {
  return item.latitude !== null &&
    item.latitude !== undefined &&
    item.longitude !== null &&
    item.longitude !== undefined &&
    typeof item.latitude === 'number' &&
    typeof item.longitude === 'number' &&
    !isNaN(item.latitude) &&
    !isNaN(item.longitude) &&
    Math.abs(item.latitude) <= 90 &&
    Math.abs(item.longitude) <= 180;
};

/**
 * Ouvrir une URL externe (site web)
 */
export const handleOpenWebsite = async (url: string, name: string): Promise<void> => {
  if (!url) {
    Alert.alert('Information', 'Aucun site web défini pour cet élément');
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erreur', `Impossible d'ouvrir le lien: ${url}`);
    }
  } catch (error) {
    console.error('Erreur ouverture URL:', error);
    Alert.alert('Erreur', 'Impossible d\'ouvrir le site web');
  }
};

/**
 * Ouvrir dans Google Maps
 */
export const handleOpenMaps = async (item: any): Promise<void> => {
  if (!hasValidCoordinates(item)) {
    Alert.alert('Information', 'Aucune localisation définie pour cet élément');
    return;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
  
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps');
    }
  } catch (error) {
    console.error('Erreur ouverture Google Maps:', error);
    Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps');
  }
};

/**
 * Mapper les types d'activités
 */
export const getActivityTypeLabel = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'hiking': '🥾 Randonnée',
    'visit': '🏛️ Visite',
    'restaurant': '🍽️ Restaurant',
    'accommodation': '🏨 Hébergement',
    'transport': '🚗 Transport'
  };
  return typeMap[type] || type;
};

/**
 * Mapper les types d'activités pour les marqueurs de carte
 */
export const mapActivityTypeForMarker = (type: string): string => {
  if (!type) return 'activity';
  
//   console.log('🗺️ Mapping type activité:', {
//     originalType: type,
//     normalizedType: type.toLowerCase()
//   });

  switch (type.toLowerCase()) {
    case 'hiking':
    case 'randonnée':
    case 'randonnee':
      return 'hiking';
    case 'transport':
    case 'voiture':
    case 'car':
      return 'transport';
    case 'visit':
    case 'visite':
    case 'museum':
    case 'monument':
      return 'visit';
    case 'restaurant':
    case 'food':
    case 'repas':
      return 'restaurant';
    case 'courses':
    case 'shopping':
      return 'courses';
    default:
      return 'activity';
  }
};
