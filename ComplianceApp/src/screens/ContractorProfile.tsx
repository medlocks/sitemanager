import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../lib/supabase";
import { contractorService, Contractor } from "../services/contractorService";
import { fileService } from "../services/fileService";
import { useAuth } from "../context/AuthContext";
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, TOUCH_TARGETS } from "../theme";
import { privacyService } from "../services/privacyService";

const SPECIALISMS = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Fire Safety",
  "Gas",
  "General",
  "Caretaker",
];

export const ContractorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await contractorService.getProfile(user.id);
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleUpdateSpecialism = async (val: string) => {
    if (!user?.id) return;
    try {
      await contractorService.updateSpecialism(user.id, val);
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleUploadCompetence = async () => {
    if (!user?.id) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      setUploading(true);
      const file = res.assets[0];

      const result = await fileService.uploadCompetenceDocument(
        user.id,
        file.uri,
        file.name,
      );

      const finalPath = typeof result === "object" ? result.path : result;

      await contractorService.submitCompetence(user.id, finalPath);

      if (typeof result === "object" && result.offline) {
        Alert.alert(
          "Offline",
          "Certification saved locally. It will sync when you are back online.",
        );
      } else {
        Alert.alert("Success", "Certification updated. Pending verification.");
      }

      await loadProfile();
    } catch (e: any) {
      Alert.alert("Upload Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewCertificate = () => {
    if (!profile?.competence_evidence_url) return;

    const path = profile.competence_evidence_url;

    if (path.startsWith("http")) {
      Linking.openURL(path);
    } else {
      const { data } = supabase.storage.from("evidence").getPublicUrl(path);

      if (data?.publicUrl) {
        Linking.openURL(data.publicUrl);
      }
    }
  };

  if (loading)
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label} accessibilityRole="header">
            OPERATIVE NAME
          </Text>
          <Text style={styles.val}>{profile?.name}</Text>

          <Text style={styles.label}>MY SPECIALISM (TRADE)</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup">
            {SPECIALISMS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  profile?.specialism === s && styles.chipActive,
                ]}
                onPress={() => handleUpdateSpecialism(s)}
                accessibilityRole="radio"
                accessibilityState={{ checked: profile?.specialism === s }}
                accessibilityLabel={`${s} specialism`}
              >
                <Text
                  style={[
                    styles.chipText,
                    profile?.specialism === s && styles.chipTextActive,
                  ]}
                >
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>VERIFICATION STATUS</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  profile?.competence_status === "Approved"
                    ? COLORS.success
                    : profile?.competence_status === "Rejected"
                      ? COLORS.secondary
                      : COLORS.warning,
              },
            ]}
            accessibilityLabel={`Verification status: ${profile?.competence_status || "Unverified"}`}
          >
            <Text style={styles.statusText}>
              {profile?.competence_status?.toUpperCase() || "UNVERIFIED"}
            </Text>
          </View>

          {profile?.rejection_reason && (
            <View style={styles.rejectBox} accessibilityRole="alert">
              <Text style={styles.rejectTitle}>FEEDBACK</Text>
              <Text style={styles.rejectText}>{profile.rejection_reason}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleUploadCompetence}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Replace competence proof"
            accessibilityHint="Upload a new PDF or image certificate for verification"
          >
            <Text style={styles.uploadBtnText}>
              {uploading ? "UPLOADING..." : "REPLACE COMPETENCY PROOF"}
            </Text>
          </TouchableOpacity>

          {profile?.competence_evidence_url && (
            <TouchableOpacity
              onPress={handleViewCertificate}
              style={styles.viewBtn}
              accessibilityRole="link"
              accessibilityLabel="View current certificate"
            >
              <Text style={styles.viewBtnText}>View Current Certificate →</Text>
            </TouchableOpacity>
          )}

          <View style={styles.governanceBox}>
            <Text style={styles.label} accessibilityRole="header">
              PRIVACY & DATA RIGHTS
            </Text>
            <Text style={styles.infoText}>
              Your data is stored securely in an encrypted vault. You have the
              right to export your professional record at any time.
            </Text>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => user?.id && privacyService.downloadMyData(user.id)}
              accessibilityRole="button"
              accessibilityLabel="Export my data in JSON format"
            >
              <Text style={styles.exportBtnText}>EXPORT MY DATA (JSON)</Text>
            </TouchableOpacity>

            <Text style={styles.caption}>
              To request account deletion or data erasure, please contact the
              Site Manager.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: SPACING.m },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.l,
    borderRadius: 15,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.s,
    letterSpacing: 1.2,
  },
  val: {
    ...TYPOGRAPHY.header,
    color: COLORS.primary,
    marginBottom: SPACING.l,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.l,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textLight,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: SPACING.l,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  rejectBox: {
    backgroundColor: "#FFF5F5",
    padding: SPACING.m,
    borderRadius: 8,
    marginBottom: SPACING.l,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.secondary,
  },
  rejectTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "900",
    color: COLORS.secondary,
    marginBottom: 4,
  },
  rejectText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    minHeight: TOUCH_TARGETS.min,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
  viewBtn: {
    marginTop: SPACING.l,
    minHeight: TOUCH_TARGETS.min,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  governanceBox: {
    marginTop: SPACING.xl,
    padding: SPACING.m,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.m,
    lineHeight: 22,
  },
  exportBtn: {
    backgroundColor: COLORS.white,
    minHeight: TOUCH_TARGETS.min,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: "center",
    lineHeight: 16,
  },
});
