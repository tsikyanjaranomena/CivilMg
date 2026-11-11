/**
 * Jetons de thème génériques (couleurs UI, espacements, polices).
 * Les couleurs propres aux statuts de dossier vivent uniquement dans
 * `domain/statuts/statutConfig.ts` — jamais ici.
 */
import { Platform } from 'react-native';

export const Colors = {
  // Fond gris-bleu doux + cartes et champs blancs : les blocs ressortent sans
  // ombres (plus fiable sur Android d'entrée de gamme et sur web).
  light: {
    text: '#14213D',
    textSecondary: '#5B6475',
    background: '#F2F5FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EDF8',
    border: '#E1E6EF',
    primary: '#1E56A0',
    primaryText: '#FFFFFF',
    accent: '#F5A524',
    accentText: '#1F1500',
    danger: '#C0392B',
    success: '#1E8E5A',
    warning: '#C27803',
  },
  dark: {
    text: '#F2F4F8',
    textSecondary: '#A9B1C0',
    background: '#0E1117',
    backgroundElement: '#181D26',
    backgroundSelected: '#232A36',
    border: '#2A3241',
    primary: '#6A9EE8',
    primaryText: '#0B1220',
    accent: '#F5B547',
    accentText: '#1F1500',
    danger: '#EF7B6C',
    success: '#4FC38A',
    warning: '#E8AE45',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display, sans-serif)',
    rounded: 'var(--font-rounded, sans-serif)',
    mono: 'var(--font-mono, monospace)',
  },
});

// Espacements en px — base 4, adaptée aux grandes cibles tactiles (>= 44px) requises.
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MinTouchTarget = 44;
