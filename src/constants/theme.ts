/**
 * Design tokens e cores oficiais da aplicação CashMe.
 * Suporta NativeWind / Tailwind CSS e temas Light / Dark.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Cores de marca oficiais do CashMe
 */
export const BrandColors = {
  consumidor: '#008D4C',
  lojista: '#6F35B5',
  pontos: '#F5B800',
  neutros: {
    fundo: '#F7F8FA',
    texto: '#171717',
    branco: '#FFFFFF',
    borda: '#E5E7EB',
    cinza: '#666666',
    cinzaClaro: '#F3F4F6',
  },
} as const;

export const Colors = {
  // Paletas semânticas por papel
  consumidor: {
    DEFAULT: '#008D4C',
    primary: '#008D4C',
    secondary: '#E7F5ED',
    dark: '#006B3A',
  },
  lojista: {
    DEFAULT: '#6F35B5',
    primary: '#6F35B5',
    secondary: '#EEE7F7',
    dark: '#582A91',
  },
  pontos: {
    DEFAULT: '#F5B800',
    primary: '#F5B800',
    secondary: '#FEF8E6',
    dark: '#D49E00',
  },
  neutros: {
    fundo: '#F7F8FA',
    texto: '#171717',
    branco: '#FFFFFF',
    borda: '#E5E7EB',
    cinza: '#666666',
    cinzaClaro: '#F3F4F6',
  },

  // Esquemas Light / Dark para componentes com suporte a tema
  light: {
    text: '#171717',
    background: '#F7F8FA',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#008D4C',
    secondary: '#6F35B5',
    points: '#F5B800',
    border: '#E5E7EB',
  },
  dark: {
    text: '#FFFFFF',
    background: '#171717',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#008D4C',
    secondary: '#6F35B5',
    points: '#F5B800',
    border: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
