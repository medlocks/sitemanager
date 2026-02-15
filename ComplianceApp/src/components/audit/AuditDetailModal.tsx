import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  TOUCH_TARGETS,
} from "../../theme";
import { supabase } from "../../lib/supabase";

interface Props {
  visible: boolean;
  item: any;
  onClose: () => void;
  viewMode: string;
}

export const AuditDetailModal = ({
  visible,
  item,
  onClose,
  viewMode,
}: Props) => {
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (item) {
      resolveEvidence(item);
      if (viewMode === "Assets") fetchAssetHistory(item.id);
    } else {
      setEvidenceUri(null);
      setHistory([]);
    }
  }, [item]);

  const fetchAssetHistory = async (assetId: string) => {
    try {
      setLoadingHistory(true);
      const { data } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("asset_id", assetId)
        .order("service_date", { ascending: false });
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const resolveEvidence = (item: any) => {
    setLoadingImg(true);
    const rawPath =
      item.image_url ||
      item.evidence_url ||
      item.resolved_image_url ||
      item.certificate_url;

    if (rawPath && !rawPath.startsWith("file://")) {
      if (rawPath.startsWith("http")) {
        setEvidenceUri(rawPath);
        setLoadingImg(false);
      } else {
        const { data } = supabase.storage
          .from("incident-evidence")
          .getPublicUrl(rawPath);
        if (data?.publicUrl)
          setEvidenceUri(`${data.publicUrl}?t=${new Date().getTime()}`);
        setLoadingImg(false);
      }
    } else {
      setEvidenceUri(null);
      setLoadingImg(false);
    }
  };

  const openEvidence = (url?: string) => {
    const targetUrl = url || evidenceUri;
    if (targetUrl) Linking.openURL(targetUrl).catch(() => {});
  };

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

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      accessibilityViewIsModal={true}
    >
      <SafeAreaView style={styles.safeArea} testID="audit-modal-detail">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} accessibilityRole="header">
            Statutory Record Detail
          </Text>
          <TouchableOpacity
            testID="btn-close-audit-modal"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close detail modal"
            style={styles.closeBtn}
          >
            <Text style={styles.closeTxt}>DONE</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailSection}>
            <Text style={styles.label} accessibilityRole="header">
              STATUTORY AUDIT TIMELINE
            </Text>
            <View style={styles.timelineItem}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={COLORS.secondary}
              />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>LOGGED / CREATED</Text>
                <Text style={styles.timeValue}>
                  {formatDate(item?.created_at || item?.date_time)}
                </Text>
              </View>
            </View>

            {(item?.status === "Resolved" || item?.status === "Compliant") && (
              <View style={[styles.timelineItem, { marginTop: SPACING.m }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.success}
                />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>VERIFIED & SIGNED OFF</Text>
                  <Text style={styles.timeValue}>
                    {formatDate(item?.resolved_at || item?.last_service)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.label} accessibilityRole="header">
              CORE DETAILS
            </Text>
            <Text style={styles.value} testID="audit-detail-title">
              {item?.asset_name ||
                item?.description ||
                item?.injured_person_name}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={COLORS.textLight} />
              <Text style={styles.locationText}>
                {item?.location || "Not Specified"}
              </Text>
            </View>
            {item?.next_service_due && (
              <Text
                style={[
                  styles.auditMeta,
                  { marginTop: SPACING.s, color: COLORS.secondary },
                ]}
              >
                NEXT STATUTORY DUE: {item.next_service_due}
              </Text>
            )}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.label} accessibilityRole="header">
              LATEST DIGITAL EVIDENCE
            </Text>
            {loadingImg ? (
              <ActivityIndicator color={COLORS.primary} size="large" />
            ) : evidenceUri ? (
              <View>
                {evidenceUri.toLowerCase().includes(".pdf") ? (
                  <TouchableOpacity
                    testID="btn-view-statutory-pdf"
                    style={styles.pdfCard}
                    onPress={() => openEvidence()}
                    accessibilityRole="link"
                    accessibilityLabel="View Statutory PDF document"
                  >
                    <Ionicons
                      name="document-text"
                      size={40}
                      color={COLORS.secondary}
                    />
                    <View style={styles.pdfContent}>
                      <Text style={styles.pdfText}>View Statutory PDF</Text>
                      <Text style={styles.pdfSub}>Touch to Open Document</Text>
                    </View>
                    <Ionicons
                      name="open-outline"
                      size={24}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    testID="btn-view-evidence-img"
                    onPress={() => openEvidence()}
                    style={styles.imageContainer}
                    accessibilityRole="imagebutton"
                    accessibilityLabel="Evidence image. Tap to view full screen."
                  >
                    <Image
                      source={{ uri: evidenceUri }}
                      style={styles.evidenceImage}
                      resizeMode="cover"
                    />
                    <View style={styles.expandOverlay}>
                      <Ionicons name="expand" size={18} color={COLORS.white} />
                      <Text style={styles.expandText}>Tap to Verify</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View
                style={styles.noEvidence}
                accessibilityLabel="No valid cloud evidence attached"
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color={COLORS.gray}
                />
                <Text style={styles.noEvidenceText}>
                  No valid cloud evidence attached.
                </Text>
              </View>
            )}
          </View>

          {viewMode === "Assets" && (
            <View style={styles.detailSection}>
              <Text style={styles.label} accessibilityRole="header">
                MAINTENANCE HISTORY (TRAIL)
              </Text>
              {loadingHistory ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginVertical: SPACING.m }}
                />
              ) : history.length > 0 ? (
                history.map((log, index) => (
                  <View
                    key={log.id}
                    style={[
                      styles.historyRow,
                      index !== history.length - 1 && styles.historyBorder,
                    ]}
                  >
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {new Date(log.service_date).toLocaleDateString("en-GB")}
                      </Text>
                      <Text style={styles.historyType}>
                        {log.service_type || "Maintenance"}
                      </Text>
                    </View>
                    <Text style={styles.historyNotes}>
                      {log.notes || "Routine check performed."}
                    </Text>
                    {log.certificate_url && (
                      <TouchableOpacity
                        testID={`btn-view-certificate-${index}`}
                        style={styles.historyLink}
                        onPress={() => {
                          const { data } = supabase.storage
                            .from("incident-evidence")
                            .getPublicUrl(log.certificate_url);
                          openEvidence(data.publicUrl);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel={`View certificate for service on ${new Date(log.service_date).toLocaleDateString("en-GB")}`}
                      >
                        <Ionicons
                          name="attach"
                          size={20}
                          color={COLORS.primary}
                        />
                        <Text style={styles.historyLinkText}>
                          View Certificate
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.historyBy}>
                      By: {log.signature_url || "Specialist"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noHistoryText}>
                  No past service records found for this asset.
                </Text>
              )}
            </View>
          )}

          {viewMode !== "Assets" &&
            (item?.status === "Resolved" || item?.injury_description) && (
              <View style={styles.detailSection}>
                <Text style={styles.label} accessibilityRole="header">
                  COMPLETION DATA
                </Text>
                {item?.injury_description && (
                  <>
                    <Text style={styles.subLabel}>INJURY DESCRIPTION</Text>
                    <Text style={styles.notesText} testID="audit-injury-desc">
                      {item.injury_description}
                    </Text>
                    <Text style={styles.subLabel}>TREATMENT</Text>
                    <Text style={styles.notesText}>
                      {item.treatment_given || "None recorded"}
                    </Text>
                  </>
                )}
                {item?.resolution_notes && (
                  <>
                    <Text style={styles.subLabel}>RESOLUTION NOTES</Text>
                    <Text
                      style={styles.notesText}
                      testID="audit-resolution-notes"
                    >
                      {item.resolution_notes}
                    </Text>
                  </>
                )}
                {item?.remedial_actions && (
                  <>
                    <Text style={[styles.subLabel, { marginTop: SPACING.s }]}>
                      REMEDIAL ACTIONS
                    </Text>
                    <Text style={styles.notesText}>
                      {item.remedial_actions}
                    </Text>
                  </>
                )}
                <View style={styles.divider} />
                <Text style={styles.auditMeta}>
                  Audited By:{" "}
                  {item?.signed_by_name ||
                    item?.signed_off_by ||
                    "Verified Specialist"}
                </Text>
              </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: "center",
    minHeight: TOUCH_TARGETS.min,
  },
  modalTitle: { ...TYPOGRAPHY.subheader, color: COLORS.primary },
  closeBtn: {
    minHeight: TOUCH_TARGETS.min,
    minWidth: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  closeTxt: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontWeight: "800",
  },
  scrollContent: { padding: SPACING.m },
  detailSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.m,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: "800",
    marginBottom: SPACING.m,
    letterSpacing: 1.2,
  },
  subLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    fontWeight: "800",
  },
  timelineItem: { flexDirection: "row", alignItems: "center" },
  timeInfo: { marginLeft: SPACING.s },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.textLight,
  },
  timeValue: { ...TYPOGRAPHY.body, color: COLORS.primary, fontWeight: "700" },
  value: {
    ...TYPOGRAPHY.header,
    fontSize: 20,
    color: COLORS.primary,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.s,
  },
  locationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    marginTop: SPACING.xs,
    backgroundColor: COLORS.lightGray,
  },
  evidenceImage: { width: "100%", height: 300 },
  expandOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: SPACING.s,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  expandText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: SPACING.xs,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    backgroundColor: "#FFF1F0",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    minHeight: TOUCH_TARGETS.min * 1.5,
  },
  pdfContent: { flex: 1, marginLeft: SPACING.s },
  pdfText: { ...TYPOGRAPHY.body, fontWeight: "800", color: COLORS.secondary },
  pdfSub: { ...TYPOGRAPHY.caption, color: COLORS.secondary, opacity: 0.8 },
  noEvidence: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: COLORS.gray,
  },
  noEvidenceText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  notesText: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: 10,
    marginBottom: SPACING.s,
    fontWeight: "500",
    overflow: "hidden",
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.lightGray,
    marginVertical: SPACING.m,
  },
  auditMeta: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  historyRow: { paddingVertical: SPACING.m },
  historyBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.lightGray,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  historyDate: {
    ...TYPOGRAPHY.body,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  historyType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: "800",
  },
  historyNotes: { ...TYPOGRAPHY.body, color: COLORS.text, lineHeight: 22 },
  historyBy: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    fontStyle: "italic",
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.s,
    minHeight: TOUCH_TARGETS.min,
  },
  historyLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "800",
    marginLeft: SPACING.xs,
    textDecorationLine: "underline",
  },
  noHistoryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: "center",
    marginVertical: SPACING.m,
  },
});
