import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { buildingService } from "../services/buildingService";
import { assetService } from "../services/assetService";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, TOUCH_TARGETS } from "../theme";

export const BuildingServices = ({ navigation }: any) => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBuildingData = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getServiceReports();
      setServices(data);
    } catch (error: any) {
      Alert.alert("Sync Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        user?.role === "Manager" && (
          <TouchableOpacity
            testID="btn-nav-add-asset"
            onPress={() => navigation.navigate("AddAsset")}
            style={styles.navAddBtn}
            accessibilityRole="button"
            accessibilityLabel="Add new asset"
          >
            <Text style={styles.navAddText}>+ NEW</Text>
          </TouchableOpacity>
        ),
    });
    const unsubscribe = navigation.addListener("focus", loadBuildingData);
    return unsubscribe;
  }, [navigation, user]);

  const handleDuplicate = async (item: any) => {
    try {
      setLoading(true);
      await assetService.duplicateAsset(item);
      await loadBuildingData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderService = ({ item, index }: { item: any; index: number }) => {
    const isCompliant = item.status === "Compliant";
    const isManager = user?.role === "Manager";

    return (
      <TouchableOpacity
        testID={`asset-card-${index}`}
        style={[
          styles.card,
          { borderLeftColor: isCompliant ? COLORS.success : COLORS.secondary },
        ]}
        onPress={() =>
          isManager && navigation.navigate("AddAsset", { asset: item })
        }
        accessibilityRole={isManager ? "button" : "none"}
        accessibilityLabel={`${item.assetName}, Status: ${item.status}. ${isManager ? "Double tap to edit asset." : ""}`}
      >
        <View style={styles.headerRow}>
          <Text style={styles.typeTag}>{item.type}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompliant
                  ? COLORS.success
                  : COLORS.secondary,
              },
            ]}
          >
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.assetTitle}>{item.assetName}</Text>
        <Text
          style={styles.meta}
          accessibilityLabel={`Location: ${item.location || "No location specified"}`}
        >
          {item.location || "No location"}
        </Text>

        <View style={styles.dateGrid}>
          <View>
            <Text style={styles.dateLabel}>LAST SERVICE</Text>
            <Text style={styles.dateValue}>{item.lastServiceDate || "-"}</Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>DUE DATE</Text>
            <Text style={styles.dateValue}>{item.nextServiceDueDate}</Text>
          </View>
        </View>

        {isManager && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              testID={`btn-assign-asset-${index}`}
              style={styles.assignBtn}
              onPress={() =>
                navigation.navigate("ContractorAssignment", {
                  incidentId: item.id,
                  isAsset: true,
                  assetName: item.assetName,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Assign contractor to ${item.assetName}`}
            >
              <Text style={styles.btnText}>ASSIGN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`btn-copy-asset-${index}`}
              style={styles.copyBtn}
              onPress={() => handleDuplicate(item)}
              accessibilityRole="button"
              accessibilityLabel={`Duplicate ${item.assetName}`}
            >
              <Text style={styles.copyText}>COPY</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle} accessibilityRole="header">
        Asset Register
      </Text>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            testID="loading-indicator"
          />
        </View>
      ) : (
        <FlatList
          testID="asset-list"
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderService({ item, index })}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.background,
  },
  mainTitle: { ...TYPOGRAPHY.header, marginVertical: SPACING.m },
  listContent: { paddingBottom: SPACING.xl },
  loadingWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.m,
    borderLeftWidth: 8,
    ...SHADOWS.light,
    minHeight: 120,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeTag: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  assetTitle: { ...TYPOGRAPHY.subheader, marginTop: 8 },
  meta: { ...TYPOGRAPHY.body, color: COLORS.textLight, marginTop: 4 },
  dateGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.lightGray,
  },
  dateLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: "700",
  },
  dateValue: { ...TYPOGRAPHY.body, fontWeight: "800", marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    marginTop: SPACING.l,
    justifyContent: "space-between",
    gap: SPACING.s,
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
    flex: 0.75,
    minHeight: TOUCH_TARGETS.min,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtn: {
    backgroundColor: COLORS.lightGray,
    flex: 0.25,
    minHeight: TOUCH_TARGETS.min,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  copyText: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  navAddBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 8,
    justifyContent: "center",
    marginRight: 10,
  },
  navAddText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
});
