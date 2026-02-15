import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  TOUCH_TARGETS,
} from "../../theme";

interface Props {
  tasks: any[];
  onSignOff: (task: any) => void;
}

export const WorkOrderList = ({ tasks, onSignOff }: Props) => {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item, index }) => (
        <View style={styles.orderCard}>
          <View style={styles.textContainer}>
            <Text style={styles.orderTitle} accessibilityRole="header">
              {item.description}
            </Text>
            <Text
              style={styles.orderLoc}
              accessibilityLabel={`Location: ${item.location}`}
            >
              {item.location}
            </Text>
          </View>
          <TouchableOpacity
            testID={`btn-sign-off-${index}`}
            style={styles.signBtn}
            onPress={() => onSignOff(item)}
            accessibilityRole="button"
            accessibilityLabel={`Sign off for ${item.description}`}
            accessibilityHint="Opens the statutory certification modal for this task"
          >
            <Text style={styles.signBtnText}>SIGN OFF</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText} accessibilityRole="text">
          No assigned work orders found.
        </Text>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SPACING.l,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.light,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
  },
  textContainer: {
    flex: 1,
    paddingRight: SPACING.s,
  },
  orderTitle: {
    ...TYPOGRAPHY.subheader,
    fontSize: 17,
    color: COLORS.primary,
  },
  orderLoc: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 6,
  },
  signBtn: {
    backgroundColor: COLORS.primary,
    minWidth: 100,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
  },
  signBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginTop: 100,
    color: COLORS.textLight,
  },
});
