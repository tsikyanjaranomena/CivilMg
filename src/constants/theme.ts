/**
 * Jetons de thème génériques (couleurs UI, espacements, polices).
 * Les couleurs propres aux statuts de dossier vivent uniquement dans
 * `domain/statuts/statutConfig.ts` — jamais ici.
 */
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#161A1D',
    textSecondary: '#5A6069',
    background: '#FFFFFF',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E5E9F0',
    border: '#D6D9DE',
    primary: '#1D4E89',
    primaryText: '#FFFFFF',
    danger: '#B3261E',
    success: '#1E7B4D',
    warning: '#B26A00',
  },
  dark: {
    text: '#F4F5F6',
    textSecondary: '#B0B4BA',
    background: '#121316',
    backgroundElement: '#1E2023',
    backgroundSelected: '#2A2D31',
    border: '#33363B',
    primary: '#5B8FD4',
    primaryText: '#0B1220',
    danger: '#E5766D',
    success: '#4FC38A',
    warning: '#E0A93E',
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
