import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { contractorService } from "../services/contractorService";
import { COLORS, TYPOGRAPHY, SPACING, TOUCH_TARGETS, SHADOWS } from "../theme";

export const ContractorDetail = ({ route, navigation }: any) => {
  const { contractor } = route.params;
  const [status, setStatus] = useState(contractor.competence_status);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      await contractorService.updateContractorStatus(contractor.id, newStatus);
      setStatus(newStatus);
      Alert.alert("Success", `Status changed to ${newStatus}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar} accessibilityElementsHidden={true}>
            <Text style={styles.avatarTxt}>{contractor.name[0]}</Text>
          </View>
          <Text style={styles.name} accessibilityRole="header">
            {contractor.name}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>
              {contractor.specialism?.toUpperCase() || "GENERAL"}
            </Text>
          </View>
          <Text
            style={styles.email}
            accessibilityLabel={`Email address: ${contractor.email}`}
          >
            {contractor.email}
          </Text>
          <Text
            testID="contractor-status-text"
            style={[
              styles.statusInfo,
              {
                color:
                  status === "Approved" ? COLORS.success : COLORS.secondary,
              },
            ]}
            accessibilityLabel={`Current competence status is ${status}`}
          >
            Current Status: {status}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>STATUTORY DOCUMENTS</Text>
          <TouchableOpacity
            testID="btn-view-contractor-cert"
            style={styles.fileBtn}
            onPress={() =>
              contractor.competence_evidence_url
                ? Linking.openURL(contractor.competence_evidence_url)
                : Alert.alert("Error", "No document available")
            }
            accessibilityRole="link"
            accessibilityLabel="View submitted competence certificate"
            accessibilityHint="Opens the contractor's PDF certification in the system browser"
          >
            <Text style={styles.fileBtnTxt}>VIEW SUBMITTED CERTIFICATE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionSection}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                testID="status-loading-indicator"
                color={COLORS.primary}
                size="large"
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                testID="btn-approve-contractor"
                style={styles.approveBtn}
                onPress={() => handleUpdateStatus("Approved")}
                accessibilityRole="button"
                accessibilityLabel="Approve Operative"
                accessibilityHint="Updates contractor status to approved for site work"
              >
                <Text style={styles.btnTxt}>APPROVE OPERATIVE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-suspend-contractor"
                style={styles.suspendBtn}
                onPress={() => handleUpdateStatus("Rejected")}
                accessibilityRole="button"
                accessibilityLabel="Suspend or Reject Operative"
                accessibilityHint="Blocks the contractor from being assigned to any further site tasks"
              >
                <Text style={styles.btnTxt}>SUSPEND / REJECT</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { padding: SPACING.l },
  profileHeader: { alignItems: "center", marginBottom: SPACING.xl },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  avatarTxt: { color: COLORS.white, fontSize: 40, fontWeight: "800" },
  name: { ...TYPOGRAPHY.header, marginTop: SPACING.m, textAlign: "center" },
  badge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: SPACING.s,
  },
  badgeTxt: {
    color: COLORS.primary,
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    letterSpacing: 1,
  },
  email: { ...TYPOGRAPHY.body, color: COLORS.textLight },
  statusInfo: { ...TYPOGRAPHY.body, fontWeight: "800", marginTop: SPACING.xs },
  section: { marginBottom: SPACING.xl },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  fileBtn: {
    backgroundColor: COLORS.background,
    minHeight: TOUCH_TARGETS.min * 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    padding: SPACING.m,
  },
  fileBtnTxt: { color: COLORS.primary, ...TYPOGRAPHY.body, fontWeight: "800" },
  actionSection: {
    borderTopWidth: 2,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.l,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    minHeight: TOUCH_TARGETS.min + 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
    ...SHADOWS.light,
  },
  suspendBtn: {
    backgroundColor: COLORS.secondary,
    minHeight: TOUCH_TARGETS.min + 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  loaderContainer: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
});
