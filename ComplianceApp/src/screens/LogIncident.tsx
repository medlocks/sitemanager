import React, { useState } from 'react';
import { 
  View, 
  Text,
  TextInput, 
  StyleSheet, 
  Alert, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  TextStyle,
  ViewStyle,
  ImageStyle 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { useAuth } from '../context/AuthContext';
import { saveIncidentLocally } from '../services/storageService';
import { Incident } from '../types'; 
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const LogIncident = () => {
  const { user } = useAuth();
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You need to allow camera access to capture evidence.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!desc) return Alert.alert("Error", "Description required");

    const newIncident: Incident = {
      id: Date.now().toString(),
      userId: user?.id || 'unknown', 
      timestamp: new Date().toISOString(), 
      description: desc, 
      imageUri: image, 
      status: 'Pending',
    };

    try {
      await saveIncidentLocally(newIncident); 
      setDesc('');
      setImage(undefined);
      Alert.alert("Success", "Incident logged locally and ready for sync.");
    } catch (error) {
      Alert.alert("Error", "Failed to save incident locally.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Incident Description</Text>
        <TextInput 
          placeholder="Describe the risk (e.g. Blocked Exit)..." 
          placeholderTextColor={COLORS.textLight}
          value={desc}
          onChangeText={setDesc}
          style={styles.input}
          multiline
        />

        {image && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity onPress={() => setImage(undefined)}>
              <Text style={styles.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
          <Text style={styles.secondaryBtnText}>📸 Capture Photo Evidence</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryBtnText}>Save Incident to Vault</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: COLORS.white 
  } as ViewStyle,
  form: { 
    padding: SPACING.l, 
    width: '100%' 
  } as ViewStyle,
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
    color: COLORS.primary
  } as TextStyle,
  input: { 
    ...TYPOGRAPHY.body,
    borderWidth: 1, 
    borderColor: COLORS.lightGray, 
    borderRadius: 8, 
    marginBottom: SPACING.l, 
    padding: SPACING.s, 
    minHeight: 120,
    backgroundColor: COLORS.background,
    textAlignVertical: 'top'
  } as TextStyle,
  imageWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.l
  } as ViewStyle,
  preview: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8, 
    ...SHADOWS.light 
  } as ImageStyle,
  removeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginTop: SPACING.s
  } as TextStyle,
  secondaryBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.gray,
    padding: SPACING.m,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.m
  } as ViewStyle,
  secondaryBtnText: {
    color: COLORS.gray,
    fontWeight: 'bold'
  } as TextStyle,
  primaryBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: 8,
    alignItems: 'center',
    ...SHADOWS.light
  } as ViewStyle,
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  } as TextStyle
});