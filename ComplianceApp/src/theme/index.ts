import { TextStyle, ViewStyle, ImageStyle } from 'react-native';

export const COLORS = {
  primary: '#002d72',
  secondary: '#dc3545',
  accent: '#17a2b8',
  warning: '#ffc107',
  success: '#28a745',
  info: '#007bff',
  background: '#f4f7f6',
  white: '#ffffff',
  gray: '#6c757d',
  lightGray: '#eee',
  text: '#333',
  textLight: '#999',
};

export const SPACING = {
  xs: 5,
  s: 10,
  m: 15,
  l: 20,
  xl: 30,
};

export const TYPOGRAPHY = {
  header: {
    fontSize: 22,
    fontWeight: 'bold' as const, // Fixes the string assignment error
    color: COLORS.primary,
  } as TextStyle,
  subheader: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  } as TextStyle,
  body: {
    fontSize: 14,
    color: COLORS.text,
  } as TextStyle,
  caption: {
    fontSize: 10,
    color: COLORS.textLight,
  } as TextStyle,
};

export const SHADOWS = {
  light: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
};