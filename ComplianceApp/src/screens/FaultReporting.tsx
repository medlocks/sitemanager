import React, { useState } from 'react';
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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const FaultReporting = ({ navigation }: any) => {
  const { user } = useAuth();
  const [fault, setFault] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera access is required for digital evidence.");
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
        user?.id
      );
      
      await notificationService.notifyManagers(
        "NEW HAZARD REPORTED",
        `A new hazard was logged at ${location} by ${user?.name}`,
        "HAZARD"
      );
      
      Alert.alert(
        "Compliance Logged", 
        "The report is now live in the central audit vault.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      Alert.alert("Submission Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FA' }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Report a Fault or Hazard</Text>
          <Text style={styles.subtitle}>Statutory Evidence Capture</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Where is the issue?</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Mens Toilets, 2nd Floor" 
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#A0AEC0"
          />

          <Text style={styles.label}>Describe the fault</Text>
          <TextInput 
            style={[styles.input, { height: 120 }]} 
            placeholder="e.g. Lights not working, leaking tap..." 
            multiline
            value={fault}
            onChangeText={setFault}
            textAlignVertical="top"
            placeholderTextColor="#A0AEC0"
          />

          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} disabled={loading}>
            <Ionicons name="camera" size={24} color={COLORS.primary} style={{ marginBottom: 5 }} />
            <Text style={styles.photoBtnText}>
              {image ? "PHOTO EVIDENCE ATTACHED" : "ATTACH PHOTO EVIDENCE"}
            </Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image }} style={styles.preview} />
              <TouchableOpacity onPress={() => setImage(null)} disabled={loading} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color={COLORS.secondary} />
                <Text style={styles.removePhoto}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { backgroundColor: COLORS.lightGray }]} 
            onPress={submitFault} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
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
  content: { padding: 20 },
  header: { marginBottom: 25 },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, fontSize: 22 },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textLight, marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: '#E1E6ED'
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, color: COLORS.primary },
  input: { 
    backgroundColor: '#F8F9FB',
    borderWidth: 1, 
    borderColor: '#E1E6ED', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 20,
    color: COLORS.text,
    fontSize: 15
  },
  photoBtn: { 
    backgroundColor: '#F0F4F8', 
    padding: 20, 
    borderRadius: 12, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  photoBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 },
  removePhoto: { color: COLORS.secondary, fontWeight: '700', fontSize: 13 },
  submitBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 }
});