import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Image, 
  TextStyle, 
  ViewStyle, 
  ImageStyle 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { saveIncidentLocally } from '../services/storageService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const FaultReporting = ({ navigation }: any) => {
  const { user } = useAuth();
  const [fault, setFault] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera access is required for digital evidence (R15).");
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

    const faultLog = {
      id: Date.now().toString(),
      userId: user?.id || 'Employee',
      timestamp: new Date().toISOString(),
      description: `FAULT REPORT: ${fault} at ${location}`,
      imageUri: image || undefined,
      status: 'Pending' as const
    };

    await saveIncidentLocally(faultLog);
    
    Alert.alert(
      "Compliance Logged", 
      "The Site Manager has been notified via the central dashboard. Photo evidence is attached to the audit trail."
    );
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report a Fault or Hazard</Text>
      <Text style={styles.subtitle}>Statutory Evidence Capture (ISO 45001)</Text>

      <Text style={styles.label}>Where is the issue?</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. Mens Toilets, 2nd Floor" 
        value={location}
        onChangeText={setLocation}
        placeholderTextColor={COLORS.textLight}
      />

      <Text style={styles.label}>Describe the fault</Text>
      <TextInput 
        style={[styles.input, { height: 100 }]} 
        placeholder="e.g. Lights not working, leaking tap, broken socket..." 
        multiline
        value={fault}
        onChangeText={setFault}
        textAlignVertical="top"
        placeholderTextColor={COLORS.textLight}
      />

      <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
        <Text style={styles.photoBtnText}>
          {image ? "✅ PHOTO ATTACHED" : "📸 ATTACH PHOTO EVIDENCE (R15)"}
        </Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity onPress={() => setImage(null)}>
            <Text style={styles.removePhoto}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={submitFault}>
        <Text style={styles.btnText}>Submit Report to Site Manager</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.l, 
    backgroundColor: COLORS.white 
  } as ViewStyle,
  title: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary 
  } as TextStyle,
  subtitle: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 12, 
    marginBottom: SPACING.xl 
  } as TextStyle,
  label: { 
    ...TYPOGRAPHY.body, 
    fontWeight: 'bold', 
    marginBottom: SPACING.xs, 
    color: COLORS.text 
  } as TextStyle,
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.lightGray, 
    borderRadius: 8, 
    padding: SPACING.s, 
    marginBottom: SPACING.l,
    color: COLORS.text,
    backgroundColor: COLORS.background 
  } as ViewStyle,
  photoBtn: { 
    backgroundColor: COLORS.background, 
    padding: SPACING.m, 
    borderRadius: 8, 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: COLORS.primary, 
    alignItems: 'center', 
    marginBottom: SPACING.l 
  } as ViewStyle,
  photoBtnText: { 
    color: COLORS.primary, 
    fontWeight: 'bold' 
  } as TextStyle,
  previewContainer: { 
    alignItems: 'center', 
    marginBottom: SPACING.l 
  } as ViewStyle,
  preview: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8,
    ...SHADOWS.light
  } as ImageStyle,
  removePhoto: { 
    color: COLORS.secondary, 
    marginTop: SPACING.s, 
    fontWeight: 'bold' 
  } as TextStyle,
  submitBtn: { 
    backgroundColor: COLORS.primary, 
    padding: SPACING.m, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: SPACING.xl
  } as ViewStyle,
  btnText: { 
    color: COLORS.white, 
    fontWeight: 'bold' 
  } as TextStyle
});