import { Platform } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  surface: '#F7F8F7',
  surfaceElevated: '#FBFCFB',
  primary: '#0B6B45',
  primaryPressed: '#075538',
  primarySoft: '#EAF7F0',
  primaryMuted: '#CDEBDA',
  text: '#111312',
  textSecondary: '#6D726F',
  textTertiary: '#9A9E9C',
  border: '#E7EAE8',
  borderStrong: '#D8DEDA',
  white: '#FFFFFF',
  success: '#148553',
  warm: '#A45B2A',
  warmSoft: '#FBF1E9',
  dark: '#11251D',
  darkMuted: '#29453A',
  danger: '#B8483B',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: 38,
  display: 32,
  title: 26,
  heading: 20,
  body: 16,
  small: 14,
  caption: 12,
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#13261E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  android: { elevation: 2 },
  default: {},
});

export const layout = {
  screenPadding: 20,
  contentMaxWidth: 680,
  buttonHeight: 56,
  tabBarHeight: 68,
} as const;

