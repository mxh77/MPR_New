/**
 * Constantes de l'application Mon Petit Roadtrip
 */

// Espacement système (8px base unit)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Tailles de police
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
} as const;

// Rayons de bordure
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
} as const;

// Ombres
export const SHADOWS = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Durées d'animation
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Z-Index
export const Z_INDEX = {
  modal: 1000,
  overlay: 999,
  dropdown: 100,
  header: 50,
  fab: 10,
} as const;

// Types d'activités
export const ACTIVITY_TYPES = {
  HIKING: 'hiking',
  VISIT: 'visit',
  RESTAURANT: 'restaurant',
  ACCOMMODATION: 'accommodation',
  TRANSPORT: 'transport',
  OTHER: 'other',
} as const;

// Types d'étapes
export const STEP_TYPES = {
  STOP: 'stop',
  OVERNIGHT: 'overnight',
  ACTIVITY: 'activity',
} as const;

// Priorités des tâches
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Statuts des tâches
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Types de notifications
export const NOTIFICATION_TYPES = {
  CHATBOT_SUCCESS: 'chatbot_success',
  CHATBOT_ERROR: 'chatbot_error',
  SYSTEM: 'system',
  REMINDER: 'reminder',
  SYNC_ERROR: 'sync_error',
} as const;

// Configuration sync
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 seconde
  BATCH_SIZE: 50,
  POLL_INTERVAL: 30000, // 30 secondes
} as const;

// Configuration API
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 secondes
  UPLOAD_TIMEOUT: 120000, // 2 minutes
  RETRY_ATTEMPTS: 3,
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  AUTHENTICATION_FAILED: 'Échec de l\'authentification',
  UNAUTHORIZED: 'Accès non autorisé',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur serveur',
  SYNC_FAILED: 'Échec de la synchronisation',
  UNKNOWN_ERROR: 'Erreur inconnue',
} as const;
