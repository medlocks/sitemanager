import { TextStyle, ViewStyle } from "react-native";

export const COLORS = {
  primary: "#00265F",
  secondary: "#991B1B",
  accent: "#0E7490",
  warning: "#78350F",
  success: "#14532D",
  info: "#075985",
  background: "#F4F7F6",
  white: "#FFFFFF",
  gray: "#4B5563",
  lightGray: "#E5E7EB",
  text: "#1F2937",
  textLight: "#4B5563",
};

export const SPACING = {
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
};

export const TYPOGRAPHY = {
  header: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: COLORS.primary,
    lineHeight: 32,
  } as TextStyle,
  subheader: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.text,
    lineHeight: 26,
  } as TextStyle,
  body: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  } as TextStyle,
  caption: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  } as TextStyle,
};

export const SHADOWS = {
  light: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  } as ViewStyle,
};

export const TOUCH_TARGETS = {
  min: 48,
  gap: 12,
};

export const ACCESSIBILITY = {
  contrastRatio: "7:1",
  minimumFontScale: 1.0,
  maximumFontScale: 2.0,
};
