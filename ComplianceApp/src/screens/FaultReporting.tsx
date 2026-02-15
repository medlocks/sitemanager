import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { incidentService } from "../services/incidentService";
import { notificationService } from "../services/notificationService";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, TOUCH_TARGETS } from "../theme";

export const FaultReporting = ({ navigation }: any) => {
  const { user } = useAuth();
  const [fault, setFault] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera access is required for digital evidence.",
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitFault = async () => {
    if (!fault || !location) {
      Alert.alert("Incomplete", "Please provide fault details and location.");
      return;
    }

    try {
      setLoading(true);
      await incidentService.createIncident(
        `FAULT REPORT: ${fault}`,
        location,
        image || undefined,
        user?.id,
      );

      await notificationService.notifyManagers(
        "NEW HAZARD REPORTED",
        `A new hazard was logged at ${location} by ${user?.name}`,
        "HAZARD",
      );

      Alert.alert(
        "Compliance Logged",
        "The report is now live in the central audit vault.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert("Submission Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Report a Fault or Hazard
          </Text>
          <Text style={styles.subtitle}>Statutory Evidence Capture</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Where is the issue?</Text>
          <TextInput
            testID="input-fault-location"
            style={styles.input}
            placeholder="e.g. Mens Toilets, 2nd Floor"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Location of the issue"
            accessibilityHint="Describe exactly where the fault is located"
          />

          <Text style={styles.label}>Describe the fault</Text>
          <TextInput
            testID="input-fault-description"
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Lights not working, leaking tap..."
            multiline
            value={fault}
            onChangeText={setFault}
            textAlignVertical="top"
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Fault description"
            accessibilityHint="Provide detailed information about the hazard"
          />

          <TouchableOpacity
            testID="btn-fault-camera"
            style={styles.photoBtn}
            onPress={takePhoto}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={
              image
                ? "Photo evidence attached. Tap to retake."
                : "Attach photo evidence"
            }
            accessibilityHint="Opens the camera to capture a photo of the fault"
          >
            <Ionicons
              name="camera"
              size={32}
              color={COLORS.primary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.photoBtnText}>
              {image ? "PHOTO EVIDENCE ATTACHED" : "ATTACH PHOTO EVIDENCE"}
            </Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.previewContainer} testID="photo-preview-box">
              <Image
                source={{ uri: image }}
                style={styles.preview}
                accessibilityRole="image"
                accessibilityLabel="Preview of captured fault photo"
              />
              <TouchableOpacity
                testID="btn-remove-photo"
                onPress={() => setImage(null)}
                disabled={loading}
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.removePhoto}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            testID="btn-submit-fault"
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={submitFault}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Submit Report to Live Vault"
            accessibilityHint="Finalizes and uploads the report to the compliance system"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="large" />
            ) : (
              <Text style={styles.btnText}>Submit Report to Live Vault</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.m },
  header: { marginBottom: SPACING.l },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, fontSize: 24 },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: "800",
    marginBottom: SPACING.s,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
    minHeight: TOUCH_TARGETS.min,
  },
  textArea: { height: 120 },
  photoBtn: {
    backgroundColor: COLORS.background,
    minHeight: 120,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
  },
  photoBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  previewContainer: { alignItems: "center", marginBottom: SPACING.m },
  preview: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.s,
    minHeight: TOUCH_TARGETS.min,
    gap: 8,
  },
  removePhoto: {
    color: COLORS.secondary,
    fontWeight: "800",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 65,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.s,
  },
  disabledBtn: { backgroundColor: COLORS.gray },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
  },
});
