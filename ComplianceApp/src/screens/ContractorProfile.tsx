import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Linking, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { contractorService, Contractor } from '../services/contractorService';
import { fileService } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { privacyService } from '../services/privacyService';

const SPECIALISMS = ['Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Gas', 'General', 'Caretaker'];

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

  if (!user || !user.id) {
    Alert.alert("Error", "You must be logged in to upload documents.");
    return;
  }

  useEffect(() => {
    loadProfile();
  }, []);

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
        type: ['application/pdf', 'image/*'], 
        copyToCacheDirectory: true 
      });
      
      if (res.canceled) return;
      
      setUploading(true);
      const file = res.assets[0];
      
      // Fixed: Handle the hybrid return type (string | {offline: boolean, localUri: string})
      const uploadResult = await fileService.uploadCompetenceDocument(user.id, file.uri, file.name);
      
      const publicUrl = typeof uploadResult === 'object' && uploadResult.offline 
        ? uploadResult.localUri 
        : (uploadResult as string);

      await contractorService.submitCompetence(user.id, publicUrl);
      
      if (typeof uploadResult === 'object' && uploadResult.offline) {
        Alert.alert("Offline", "Certification saved locally and will sync when connection returns.");
      } else {
        Alert.alert("Success", "Certification uploaded.");
      }
      
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Upload Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>OPERATIVE NAME</Text>
          <Text style={styles.val}>{profile?.name}</Text>

          <Text style={styles.label}>MY SPECIALISM (TRADE)</Text>
          <View style={styles.chipRow}>
            {SPECIALISMS.map(s => (
              <TouchableOpacity key={s} 
                style={[styles.chip, profile?.specialism === s && styles.chipActive]}
                onPress={() => handleUpdateSpecialism(s)}
              >
                <Text style={[styles.chipText, profile?.specialism === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>VERIFICATION STATUS</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: profile?.competence_status === 'Approved' ? COLORS.success : 
                             profile?.competence_status === 'Rejected' ? COLORS.secondary : COLORS.warning 
          }]}>
            <Text style={styles.statusText}>{profile?.competence_status?.toUpperCase() || 'UNVERIFIED'}</Text>
          </View>

          {profile?.rejection_reason && (
            <View style={styles.rejectBox}>
              <Text style={styles.rejectTitle}>FEEDBACK</Text>
              <Text style={styles.rejectText}>{profile.rejection_reason}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadCompetence} disabled={uploading}>
            <Text style={styles.uploadBtnText}>{uploading ? "UPLOADING..." : "UPLOAD COMPETENCY PROOF"}</Text>
          </TouchableOpacity>
          
          {profile?.competence_evidence_url && (
            <TouchableOpacity 
              onPress={() => {
                if (profile.competence_evidence_url) {
                  Linking.openURL(profile.competence_evidence_url);
                } else {
                  Alert.alert("Error", "Document link is missing.");
                }
              }} 
              style={styles.viewBtn}
            >
              <Text style={styles.viewBtnText}>View Current Certificate →</Text>
            </TouchableOpacity>
          )}

          <View style={styles.governanceBox}>
  <Text style={styles.label}>PRIVACY & DATA RIGHTS</Text>
  <Text style={styles.infoText}>
    Your data is stored securely in an encrypted vault. You have the right to export your professional record at any time.
  </Text>
  
  <TouchableOpacity 
    style={styles.exportBtn} 
    onPress={() => privacyService.downloadMyData(user.id)}
  >
    <Text style={styles.exportBtnText}>EXPORT MY DATA (JSON)</Text>
  </TouchableOpacity>

  <Text style={styles.caption}>
    To request account deletion or data erasure, please contact the Site Manager.
  </Text>
</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  card: { backgroundColor: COLORS.white, padding: 25, borderRadius: 15, ...SHADOWS.light },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, marginBottom: 8, letterSpacing: 1 },
  val: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.gray },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 20 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  rejectBox: { backgroundColor: '#FFF5F5', padding: 15, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  rejectTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 5 },
  rejectText: { fontSize: 13, color: '#444' },
  uploadBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: 'bold' },
  viewBtn: { marginTop: 20, alignItems: 'center' },
  viewBtnText: { color: COLORS.primary, fontWeight: '600', textDecorationLine: 'underline' },
  governanceBox: { marginTop: 30, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
infoText: { fontSize: 12, color: COLORS.gray, marginBottom: 15, lineHeight: 18 },
exportBtn: { backgroundColor: COLORS.white, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
exportBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
caption: { fontSize: 10, color: COLORS.lightGray, marginTop: 10, textAlign: 'center' }
});