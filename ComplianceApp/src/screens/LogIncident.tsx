import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, Image, 
  ScrollView, TouchableOpacity, ActivityIndicator, TextStyle, ViewStyle, ImageStyle 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const LogIncident = ({ navigation }: any) => {
  const { user } = useAuth();
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Denied", "Camera access is required for evidence.");
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
    if (!desc || !location) return Alert.alert("Error", "Description and Location are required");

    try {
      setLoading(true);
      await incidentService.createIncident(
        desc, 
        location, 
        image, 
        user?.id
      ); 
      
      Alert.alert("Success", "Incident logged to live vault.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Location</Text>
        <TextInput 
          placeholder="e.g. Block A, Floor 2" 
          value={location}
          onChangeText={setLocation}
          style={[styles.input, { minHeight: 45 }]}
          editable={!loading}
        />

        <Text style={styles.label}>Incident Description</Text>
        <TextInput 
          placeholder="Describe the risk..." 
          value={desc}
          onChangeText={setDesc}
          style={styles.input}
          multiline
          editable={!loading}
        />

        {image && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity onPress={() => setImage(undefined)} disabled={loading}>
              <Text style={styles.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={takePhoto} 
          disabled={loading}
        >
          <Text style={styles.secondaryBtnText}>Capture Photo Evidence (R15)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryBtn, loading && { backgroundColor: COLORS.gray }]} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Save Incident to Live Vault</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.white },
  form: { padding: SPACING.l, width: '100%' },
  label: { ...TYPOGRAPHY.body, fontWeight: 'bold', marginBottom: SPACING.s, color: COLORS.primary } as TextStyle,
  input: { 
    ...TYPOGRAPHY.body, borderWidth: 1, borderColor: COLORS.lightGray, 
    borderRadius: 8, marginBottom: SPACING.l, padding: SPACING.s, 
    minHeight: 100, backgroundColor: COLORS.background, textAlignVertical: 'top' 
  } as ViewStyle,
  imageWrapper: { alignItems: 'center', marginBottom: SPACING.l } as ViewStyle,
  preview: { width: '100%', height: 200, borderRadius: 8, ...SHADOWS.light } as ImageStyle,
  removeText: { ...TYPOGRAPHY.caption, color: COLORS.secondary, fontWeight: 'bold', marginTop: SPACING.s } as TextStyle,
  secondaryBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.gray, padding: SPACING.m, borderRadius: 8, alignItems: 'center', marginBottom: SPACING.m } as ViewStyle,
  secondaryBtnText: { color: COLORS.gray, fontWeight: 'bold' } as TextStyle,
  primaryBtn: { backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: 8, alignItems: 'center', ...SHADOWS.light } as ViewStyle,
  primaryBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 } as TextStyle
});