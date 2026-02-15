import { StyleSheet } from "react-native";
import { COLORS, SPACING } from "./index";

export const globalStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.s,
    backgroundColor: COLORS.white,
  },
});
