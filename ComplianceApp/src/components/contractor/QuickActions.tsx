import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  TOUCH_TARGETS,
} from "../../theme";

interface Props {
  navigation: any;
}

export const QuickActions = ({ navigation }: Props) => {
  return (
    <View style={styles.quickRow}>
      <TouchableOpacity
        testID="btn-quick-accident"
        style={styles.quickBtn}
        onPress={() => navigation.navigate("LogAccident")}
        accessibilityRole="button"
        accessibilityLabel="Log Accident"
        accessibilityHint="Navigates to the statutory accident reporting form"
      >
        <Ionicons name="medical" size={24} color={COLORS.secondary} />
        <Text style={styles.quickBtnText}>ACCIDENT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-quick-fault"
        style={styles.quickBtn}
        onPress={() => navigation.navigate("FaultReporting")}
        accessibilityRole="button"
        accessibilityLabel="Report Fault"
        accessibilityHint="Navigates to the fault and hazard reporting form"
      >
        <Ionicons name="warning" size={24} color={COLORS.warning} />
        <Text style={styles.quickBtnText}>FAULT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-quick-profile"
        style={[styles.quickBtn, styles.profileBtn]}
        onPress={() => navigation.navigate("ContractorProfile")}
        accessibilityRole="button"
        accessibilityLabel="Contractor Profile"
        accessibilityHint="Navigates to your professional profile and competence records"
      >
        <Ionicons name="person-circle" size={26} color={COLORS.primary} />
        <Text style={[styles.quickBtnText, styles.primaryText]}>PROFILE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quickRow: {
    flexDirection: "row",
    gap: SPACING.s,
    padding: SPACING.l,
  },
  quickBtn: {
    flex: 1,
    height: TOUCH_TARGETS.min,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  profileBtn: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  quickBtnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  primaryText: {
    color: COLORS.primary,
  },
});
