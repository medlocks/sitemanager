import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  TOUCH_TARGETS,
  SHADOWS,
} from "../../theme";
import { workOrderService } from "../../services/workOrderService";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";

interface Props {
  visible: boolean;
  task: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignOffModal = ({ visible, task, onClose, onSuccess }: Props) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [evidence, setEvidence] = useState<any | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    notes: "",
    remedial: "",
    signature: "",
    nextService: false,
    date: new Date(),
  });

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.4,
    });
    if (!result.canceled) {
      setEvidence({
        uri: result.assets[0].uri,
        name: "capture.jpg",
        isImage: true,
      });
    }
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });
    if (!res.canceled) {
      setEvidence({
        uri: res.assets[0].uri,
        name: res.assets[0].name,
        isImage: res.assets[0].mimeType?.includes("image"),
      });
    }
  };

  const handleResolution = async () => {
    if (!form.notes || !form.signature) {
      Alert.alert("Compliance Block", "Missing required notes or signature.");
      return;
    }
    try {
      setIsUploading(true);
      let finalIsoDate = null;
      if (form.nextService) {
        const dateObj =
          form.date instanceof Date ? form.date : new Date(form.date);
        finalIsoDate = !isNaN(dateObj.getTime())
          ? dateObj.toISOString()
          : new Date().toISOString();
      }

      await workOrderService.resolveTask(user!.id, task, {
        evidenceFile: evidence,
        resolutionNotes: form.notes,
        remedialActions: form.remedial,
        signedByName: form.signature,
        requiresNextService: form.nextService,
        nextDueDate: finalIsoDate,
      });

      await notificationService.notifyManagers(
        "WORK ORDER COMPLETED",
        `Contractor ${user?.name} has submitted sign-off for: ${task.description}`,
        "WORK_ORDER",
      );

      Alert.alert("Success", "Regulatory record sealed.");
      onSuccess();
    } catch (e: any) {
      Alert.alert("Sync Error", e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const displayDateText = () => {
    const d = form.date instanceof Date ? form.date : new Date(form.date);
    return isNaN(d.getTime()) ? "Select Date" : d.toLocaleDateString("en-GB");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <SafeAreaView style={styles.modalContent} testID="sign-off-modal">
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.modalHeader} accessibilityRole="header">
            STATUTORY CERTIFICATION
          </Text>

          <View style={styles.fileRow}>
            <TouchableOpacity
              testID="btn-capture-camera"
              style={styles.fileBtn}
              onPress={takePhoto}
              accessibilityRole="button"
              accessibilityLabel="Take Photo with Camera"
              accessibilityHint="Opens system camera to capture visual evidence"
            >
              <Ionicons name="camera" size={32} color={COLORS.primary} />
              <Text style={styles.fileBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="btn-capture-file"
              style={styles.fileBtn}
              onPress={pickFile}
              accessibilityRole="button"
              accessibilityLabel="Attach Document or Image"
              accessibilityHint="Opens file browser to select evidence"
            >
              <Ionicons
                name="document-attach"
                size={32}
                color={COLORS.primary}
              />
              <Text style={styles.fileBtnText}>Attach</Text>
            </TouchableOpacity>
          </View>

          {evidence && (
            <View
              style={styles.preview}
              testID="evidence-preview-container"
              accessibilityLabel="Evidence preview"
            >
              {evidence.isImage ? (
                <Image
                  source={{ uri: evidence.uri }}
                  style={styles.img}
                  accessibilityRole="image"
                  accessibilityLabel="Selected image evidence"
                />
              ) : (
                <Text style={styles.fileAttached}>
                  File Attached: {evidence.name}
                </Text>
              )}
            </View>
          )}

          <Text style={styles.inputLabel}>RESOLUTION NOTES</Text>
          <TextInput
            testID="input-resolution-notes"
            style={[styles.input, styles.textArea]}
            placeholder="Detailed summary of work completed..."
            placeholderTextColor={COLORS.textLight}
            multiline
            value={form.notes}
            onChangeText={(t) => setForm({ ...form, notes: t })}
            accessibilityLabel="Resolution Notes"
            accessibilityHint="Describe the work completed in detail"
          />

          <Text style={styles.inputLabel}>ANY FURTHER REMEDIAL ACTIONS?</Text>
          <TextInput
            testID="input-remedial-actions"
            style={[styles.input, styles.textArea]}
            placeholder="Describe any fixes or secondary actions required..."
            placeholderTextColor={COLORS.textLight}
            multiline
            value={form.remedial}
            onChangeText={(t) => setForm({ ...form, remedial: t })}
            accessibilityLabel="Remedial Actions"
            accessibilityHint="Describe any secondary fixes required"
          />

          <Text style={styles.inputLabel}>DIGITAL SIGNATURE</Text>
          <TextInput
            testID="input-digital-signature"
            style={styles.input}
            placeholder="Type Full Name"
            placeholderTextColor={COLORS.textLight}
            value={form.signature}
            onChangeText={(t) => setForm({ ...form, signature: t })}
            accessibilityLabel="Digital Signature"
            accessibilityHint="Type your full name to sign the record"
          />

          <View style={styles.switchBox}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>NEXT SERVICE REQUIRED?</Text>
              {form.nextService && (
                <TouchableOpacity
                  testID="btn-open-datepicker"
                  onPress={() => setShowDatePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Scheduled date: ${displayDateText()}. Tap to change.`}
                >
                  <Text style={styles.dateDisplay}>
                    Scheduled: {displayDateText()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Switch
              testID="switch-next-service"
              value={form.nextService}
              onValueChange={(v) => {
                setForm({ ...form, nextService: v });
                if (v) setShowDatePicker(true);
              }}
              trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
              accessibilityLabel="Next Service Required Toggle"
            />
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) setForm((prev) => ({ ...prev, date: d }));
              }}
            />
          )}

          <TouchableOpacity
            testID="btn-seal-record"
            style={styles.submit}
            onPress={handleResolution}
            disabled={isUploading}
            accessibilityRole="button"
            accessibilityLabel="Seal Record and Commit"
            accessibilityHint="Finalizes and saves the statutory certification"
          >
            {isUploading ? (
              <ActivityIndicator color={COLORS.white} size="large" />
            ) : (
              <Text style={styles.submitText}>SEAL RECORD & COMMIT</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-abort-sign-off"
            onPress={onClose}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel="Abort and Close"
            accessibilityHint="Closes the modal without saving"
          >
            <Text style={styles.cancelText}>ABORT & CLOSE</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: { flex: 1, backgroundColor: COLORS.white },
  scrollContainer: { padding: SPACING.l },
  modalHeader: {
    ...TYPOGRAPHY.header,
    fontSize: 20,
    textAlign: "center",
    marginBottom: SPACING.xl,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  fileRow: { flexDirection: "row", gap: SPACING.m, marginBottom: SPACING.l },
  fileBtn: {
    flex: 1,
    minHeight: 100,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  fileBtnText: {
    ...TYPOGRAPHY.caption,
    fontSize: 14,
    fontWeight: "800",
    marginTop: SPACING.xs,
    color: COLORS.primary,
  },
  preview: {
    height: 200,
    marginBottom: SPACING.l,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  img: { width: "100%", height: "100%" },
  fileAttached: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "700",
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 2,
    borderColor: COLORS.gray,
    ...TYPOGRAPHY.body,
    minHeight: TOUCH_TARGETS.min,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  switchBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.m,
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    marginBottom: SPACING.xl,
    minHeight: TOUCH_TARGETS.min,
  },
  switchTextContainer: { flex: 1 },
  switchLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "900",
    color: COLORS.primary,
  },
  dateDisplay: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "800",
    marginTop: 6,
    textDecorationLine: "underline",
  },
  submit: {
    backgroundColor: COLORS.success,
    minHeight: 65,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
  },
  cancel: {
    minHeight: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.m,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    fontWeight: "800",
    color: COLORS.secondary,
    textDecorationLine: "underline",
  },
});
