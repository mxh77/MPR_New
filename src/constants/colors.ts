/**
 * Palette de couleurs pour Mon Petit Roadtrip
 * Respecte la charte graphique de l'application originale
 */
export const colors = {
  // Couleurs principales
  primary: '#007BFF',        // Bleu principal
  secondary: '#6c757d',      // Gris moyen
  success: '#28a745',        // Vert
  warning: '#ffc107',        // Jaune/Orange
  danger: '#dc3545',         // Rouge
  info: '#17a2b8',          // Bleu info
  light: '#f8f9fa',         // Gris très clair
  dark: '#343a40',          // Gris très foncé
  white: '#ffffff',
  black: '#000000',
  
  // Couleurs spécifiques aux activités
  hiking: '#FF5722',         // Rouge-orange randonnée
  accommodation: '#4CAF50',  // Vert hébergement  
  transport: '#FF9800',      // Orange transport
  visit: '#2196F3',         // Bleu visite
  restaurant: '#9C27B0',     // Violet restaurant
  
  // Couleurs d'état
  online: '#4CAF50',
  offline: '#FF5722',
  syncing: '#FF9800',
  
  // Grays scale
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Transparents
  backdrop: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(255, 255, 255, 0.9)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
} as const;

/**
 * Thème clair
 */
export const lightTheme = {
  colors: {
    ...colors,
    background: colors.white,
    surface: colors.white,
    surfaceVariant: colors.gray50,
    onBackground: colors.dark,
    onSurface: colors.dark,
    card: colors.white,
    text: colors.dark,
    textSecondary: colors.gray600,
    border: colors.gray300,
    divider: colors.gray200,
    disabled: colors.gray400,
    placeholder: colors.gray500,
  },
} as const;

/**
 * Thème sombre
 */
export const darkTheme = {
  colors: {
    ...colors,
    background: colors.gray900,
    surface: colors.gray800,
    surfaceVariant: colors.gray700,
    onBackground: colors.white,
    onSurface: colors.white,
    card: colors.gray800,
    text: colors.white,
    textSecondary: colors.gray400,
    border: colors.gray600,
    divider: colors.gray700,
    disabled: colors.gray600,
    placeholder: colors.gray500,
  },
} as const;

export type Theme = typeof lightTheme;
export type Colors = typeof colors;
