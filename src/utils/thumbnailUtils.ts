/**
 * Utilitaires pour la gestion des thumbnails
 * Gère la conversion entre objets API et URLs d'images
 */

/**
 * Fonction pour extraire l'URI de l'image depuis l'objet thumbnail
 * Compatible avec tous les formats de thumbnails de l'API
 */
export const getImageUri = (thumbnail: any): string | null => {
  // console.log('🖼️ getImageUri - thumbnail reçu:', {
  //   type: typeof thumbnail,
  //   value: thumbnail,
  //   hasUrl: thumbnail?.url,
  //   hasUri: thumbnail?.uri,
  //   isString: typeof thumbnail === 'string'
  // });

  if (!thumbnail) {
    return null;
  }

  // Si c'est déjà une chaîne valide
  if (typeof thumbnail === 'string' && thumbnail.trim().length > 0) {
    const uri = thumbnail.trim();
    return uri;
  }

  // Si c'est un objet avec une propriété url (format API)
  if (typeof thumbnail === 'object' && thumbnail !== null) {
    // PRIORITÉ 1: thumbnail.url (selon API)
    if (thumbnail.url && typeof thumbnail.url === 'string' && thumbnail.url.trim().length > 0) {
      const cleanUrl = thumbnail.url.trim()
        .replace(/^https?:\/\/storrage\./, 'https://storage.')  // Corriger "storrage" → "storage"
        .replace(/^htttps:\/\//, 'https://')                    // Corriger "htttps" → "https"
      
      return cleanUrl;
    }

    // PRIORITÉ 2: thumbnail.uri (fallback)
    if (thumbnail.uri && typeof thumbnail.uri === 'string' && thumbnail.uri.trim().length > 0) {
      const uri = thumbnail.uri.trim();
      return uri;
    }
  }

  // console.log('🖼️ getImageUri - Aucun format reconnu');
  return null;
};

/**
 * Validation d'URI d'image
 * Vérifie si l'URI est valide pour l'affichage
 */
export const isValidImageUri = (uri: string | null): boolean => {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  const cleanUri = uri.trim();
  
  // Vérifier les protocoles autorisés
  const validProtocols = ['http://', 'https://', 'file://', 'data:'];
  const hasValidProtocol = validProtocols.some(protocol => cleanUri.startsWith(protocol));
  
  if (!hasValidProtocol) {
    return false;
  }

  // Vérifier les extensions d'image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasImageExtension = imageExtensions.some(ext => 
    cleanUri.toLowerCase().includes(ext)
  );

  // Pour Google Storage, on accepte même sans extension visible
  const isGoogleStorage = cleanUri.includes('storage.googleapis.com');
  
  return hasImageExtension || isGoogleStorage || cleanUri.startsWith('data:image/');
};

/**
 * Debug des problèmes de thumbnail
 * Affiche des informations détaillées sur le thumbnail
 */
export const debugThumbnail = (thumbnail: any, context: string = '') => {
  console.log(`🖼️ [${context}] Thumbnail debug:`, {
    type: typeof thumbnail,
    isNull: thumbnail === null,
    isUndefined: thumbnail === undefined,
    hasUrl: thumbnail?.url ? 'OUI' : 'NON',
    hasUri: thumbnail?.uri ? 'OUI' : 'NON',
    value: thumbnail,
    extractedUri: getImageUri(thumbnail)
  });
};
