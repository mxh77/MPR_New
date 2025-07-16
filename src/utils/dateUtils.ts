/**
 * Utilitaires pour la gestion des dates
 * RÈGLE CRITIQUE : Ne jamais utiliser Intl.DateTimeFormat qui applique le fuseau horaire local
 */

/**
 * Formate une date sans tenir compte du fuseau horaire
 * Utilise les méthodes UTC pour afficher l'heure exacte stockée en base
 * 
 * @param date - La date à formater
 * @param options - Options de formatage
 * @returns La date formatée au format DD/MM/YYYY HH:MM
 * 
 * @example
 * ```typescript
 * const date = new Date('2024-07-14T14:30:00.000Z');
 * console.log(formatDateWithoutTimezone(date)); // "14/07/2024 14:30"
 * // Au lieu de "14/07/2024 16:30" avec Intl.DateTimeFormat (UTC+2)
 * ```
 */
export const formatDateWithoutTimezone = (
  date: Date,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    dateFormat?: 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeSeparator?: ':' | 'h';
  } = {}
): string => {
  const {
    includeTime = true,
    includeSeconds = false,
    dateFormat = 'DD/MM/YYYY',
    timeSeparator = ':'
  } = options;

  // Utiliser les méthodes UTC pour éviter la conversion de fuseau horaire
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();

  // Format de la date
  let dateString = dateFormat === 'YYYY-MM-DD' 
    ? `${year}-${month}-${day}`
    : `${day}/${month}/${year}`;

  // Ajouter l'heure si demandé
  if (includeTime) {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    let timeString = timeSeparator === 'h' 
      ? `${hours}h${minutes}`
      : `${hours}:${minutes}`;

    if (includeSeconds) {
      const seconds = date.getUTCSeconds().toString().padStart(2, '0');
      timeString += timeSeparator === 'h' ? `${seconds}s` : `:${seconds}`;
    }

    dateString += ` ${timeString}`;
  }

  return dateString;
};

/**
 * Formate une date pour l'affichage court (ex: "14/07 14:30")
 * 
 * @param date - La date à formater
 * @returns La date formatée au format DD/MM HH:MM
 */
export const formatDateShort = (date: Date): string => {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${day}/${month} ${hours}:${minutes}`;
};

/**
 * Formate une date pour l'affichage de l'heure uniquement
 * 
 * @param date - La date à formater
 * @param format - Format d'affichage ('HH:MM' ou 'HHhMM')
 * @returns L'heure formatée
 */
export const formatTimeOnly = (
  date: Date, 
  format: 'HH:MM' | 'HHhMM' = 'HH:MM'
): string => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return format === 'HHhMM' ? `${hours}h${minutes}` : `${hours}:${minutes}`;
};

/**
 * Formate une date pour l'affichage de la date uniquement
 * 
 * @param date - La date à formater
 * @param format - Format d'affichage
 * @returns La date formatée
 */
export const formatDateOnly = (
  date: Date,
  format: 'DD/MM/YYYY' | 'DD/MM' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string => {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();

  switch (format) {
    case 'DD/MM':
      return `${day}/${month}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Debug une date pour identifier les problèmes de fuseau horaire
 * Affiche la date originale, l'ISO string, et les heures locale vs UTC
 * 
 * @param date - La date à debugger
 * @param label - Label pour identifier le log
 */
export const debugDateTimezone = (date: Date, label: string = 'Date'): void => {
  console.log(`🕐 ${label} - Date reçue:`, date);
  console.log(`🕐 ${label} - ISO string:`, date.toISOString());
  console.log(`🕐 ${label} - getHours() (local):`, date.getHours());
  console.log(`🕐 ${label} - getUTCHours() (UTC):`, date.getUTCHours());
  console.log(`🕐 ${label} - Formaté sans timezone:`, formatDateWithoutTimezone(date));
};

/**
 * Vérifie si une date est valide
 * 
 * @param date - La date à vérifier
 * @returns true si la date est valide
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Parse une date depuis une string ISO et retourne une Date valide
 * 
 * @param isoString - String ISO à parser
 * @returns Date valide ou null si parsing échoue
 */
export const parseISODate = (isoString: string | null | undefined): Date | null => {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
};
