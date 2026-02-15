import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  TOUCH_TARGETS,
} from "../../theme";

interface Props {
  viewMode: string;
  setViewMode: (mode: any) => void;
  fromDate: Date;
  toDate: Date;
  onDateChange: (type: "from" | "to", date: Date) => void;
}

export const AuditFilters = ({
  viewMode,
  setViewMode,
  fromDate,
  toDate,
  onDateChange,
}: Props) => {
  const [showPicker, setShowPicker] = React.useState<"from" | "to" | null>(
    null,
  );

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.mainTitle} accessibilityRole="header">
          Statutory Audit Vault
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          accessibilityRole="tablist"
        >
          <View style={styles.topTabs}>
            {(["Analytics", "Incidents", "Assets", "Accidents"] as const).map(
              (tab) => (
                <TouchableOpacity
                  key={tab}
                  testID={`audit-tab-${tab}`}
                  onPress={() => setViewMode(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: viewMode === tab }}
                  accessibilityLabel={`${tab} view`}
                  accessibilityHint={`Switches view to ${tab}`}
                  style={[styles.tab, viewMode === tab && styles.tabActive]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      viewMode === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </ScrollView>
      </View>

      {viewMode !== "Assets" && viewMode !== "Analytics" && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            testID="btn-filter-from"
            style={styles.dateBtn}
            onPress={() => setShowPicker("from")}
            accessibilityRole="button"
            accessibilityLabel={`From date: ${fromDate.toLocaleDateString("en-GB")}`}
            accessibilityHint="Opens date picker for start date"
          >
            <Text style={styles.dateBtnLabel}>FROM</Text>
            <Text style={styles.dateBtnVal}>
              {fromDate.toLocaleDateString("en-GB")}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateDivider} accessibilityElementsHidden={true}>
            →
          </Text>

          <TouchableOpacity
            testID="btn-filter-to"
            style={styles.dateBtn}
            onPress={() => setShowPicker("to")}
            accessibilityRole="button"
            accessibilityLabel={`To date: ${toDate.toLocaleDateString("en-GB")}`}
            accessibilityHint="Opens date picker for end date"
          >
            <Text style={styles.dateBtnLabel}>TO</Text>
            <Text style={styles.dateBtnVal}>
              {toDate.toLocaleDateString("en-GB")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          testID="audit-date-picker"
          value={showPicker === "from" ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) onDateChange(showPicker, date);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.lightGray,
  },
  mainTitle: {
    ...TYPOGRAPHY.header,
    color: COLORS.primary,
  },
  tabScroll: {
    marginTop: SPACING.m,
  },
  topTabs: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    minWidth: 100,
    marginHorizontal: 4,
    minHeight: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: SPACING.s,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.textLight,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.lightGray,
  },
  dateBtn: {
    flex: 1,
    alignItems: "center",
    minHeight: TOUCH_TARGETS.min,
    justifyContent: "center",
  },
  dateBtnLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: 1.2,
  },
  dateBtnVal: {
    ...TYPOGRAPHY.body,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  dateDivider: {
    paddingHorizontal: SPACING.s,
    color: COLORS.gray,
    fontSize: 20,
  },
});
