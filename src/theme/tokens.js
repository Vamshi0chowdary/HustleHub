import { Platform } from 'react-native';

export const colors = {
  light: {
    background: '#FAFAFB',
    surface: '#FFFFFF',
    card: '#F4F4F5',
    textPrimary: '#09090B',
    textSecondary: '#52525B',
    textMuted: '#6B7280',
    accent: '#4F46E5',
    accentSoft: '#EEF2FF',
    border: '#E4E4E7',
    danger: '#DC2626',
    success: '#16A34A',
    overlay: 'rgba(9,9,11,0.35)',
    inputBg: '#FFFFFF',
    inputBorder: '#D4D4D8',
  },
  dark: {
    background: '#0B0B0F',
    surface: '#111117',
    card: '#15151D',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    accent: '#6366F1',
    accentSoft: '#1A1B2A',
    border: '#27272A',
    danger: '#F87171',
    success: '#4ADE80',
    overlay: 'rgba(3,4,10,0.55)',
    inputBg: '#12121A',
    inputBorder: '#2A2A36',
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const typography = {
  family: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
};

export const motion = {
  duration: 300,
  pressScale: 1.02,
};

export const shadow = {
  light: {
    card: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
      elevation: 3,
    },
    raised: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 5,
    },
  },
  dark: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 22,
      elevation: 4,
    },
    raised: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.42,
      shadowRadius: 30,
      elevation: 7,
    },
  },
};
