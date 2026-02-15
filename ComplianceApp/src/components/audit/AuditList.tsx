import React from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
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
  data: any[];
  viewMode: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSelectItem: (item: any) => void;
}

export const AuditList = ({
  data,
  viewMode,
  searchQuery,
  onSearchChange,
  onSelectItem,
}: Props) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "PENDING";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isAsset = viewMode === "Assets";
    const isAccident = viewMode === "Accidents";
    const statusLabel =
      item.status?.toUpperCase() || (isAccident ? "LOGGED" : "PENDING");
    const isCompliant =
      item.status === "Resolved" || item.status === "Compliant";
    const statusColor = isCompliant ? COLORS.success : COLORS.warning;

    return (
      <TouchableOpacity
        testID={`audit-log-item-${index}`}
        style={styles.logCard}
        onPress={() => onSelectItem(item)}
        accessibilityRole="button"
        accessibilityLabel={`${statusLabel} record, ${isAsset ? "Asset" : "Incident"}: ${isAccident ? item.injured_person_name : isAsset ? item.asset_name : item.description}. Location: ${item.location}`}
        accessibilityHint="Double tap to view full statutory details"
      >
        <View style={styles.logHeader}>
          <Text style={styles.logDate}>
            {isAccident
              ? formatDate(item.date_time)
              : isAsset
                ? `NEXT DUE: ${item.next_service_due}`
                : formatDate(item.created_at)}
          </Text>
          <View style={[styles.pill, { backgroundColor: statusColor }]}>
            <Text style={styles.pillTxt}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.logDesc}>
          {isAccident
            ? `Injured: ${item.injured_person_name}`
            : isAsset
              ? item.asset_name
              : item.description}
        </Text>
        <View style={styles.locationContainer}>
          <Text
            style={styles.logLoc}
            accessibilityLabel={`Location: ${item.location}`}
          >
            {item.location}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID={`audit-list-view-${viewMode}`}>
      <TextInput
        testID="audit-search-input"
        style={styles.searchBar}
        placeholder={`Search ${viewMode}...`}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholderTextColor={COLORS.textLight}
        accessibilityLabel={`Search field for ${viewMode}`}
        accessibilityHint={`Type here to filter the ${viewMode} list`}
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={styles.emptyTxt} accessibilityRole="text">
            No statutory records found.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.m,
  },
  searchBar: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.m,
    marginTop: SPACING.m,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    color: COLORS.text,
    fontSize: 16,
    minHeight: TOUCH_TARGETS.min,
  },
  logCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.s,
    ...SHADOWS.light,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
    minHeight: TOUCH_TARGETS.min * 1.5,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  logDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: "800",
  },
  pill: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  pillTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  logDesc: {
    ...TYPOGRAPHY.subheader,
    color: COLORS.primary,
    lineHeight: 22,
  },
  locationContainer: {
    marginTop: SPACING.s,
    minHeight: 24,
    justifyContent: "center",
  },
  logLoc: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyTxt: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginTop: 50,
    color: COLORS.textLight,
    fontWeight: "600",
  },
  listPadding: {
    paddingBottom: SPACING.xl,
  },
});
