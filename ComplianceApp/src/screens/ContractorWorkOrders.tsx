import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, TextInput, Image, ScrollView, SafeAreaView, Switch 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { workOrderService } from '../services/workOrderService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const ContractorWorkOrders = ({ navigation }: any) => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [remedialActions, setRemedialActions] = useState('');
  const [signedByName, setSignedByName] = useState('');
  const [requiresNextService, setRequiresNextService] = useState(false);
  const [nextDueDate, setNextDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadTasks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [tasks, notifications] = await Promise.all([
        workOrderService.getAssignedTasks(user.id),
        notificationService.getNotificationLog(user.id)
      ]);
      setAssignedTasks(tasks);
      if (notifications){
      setUnreadCount(notifications.filter((n: any) => !n.is_read).length);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')} 
          style={styles.notifBadgeContainer}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ContractorProfile')} style={{ marginRight: 15 }}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>MY PROFILE</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, unreadCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadTasks);
    
    const channel = supabase
      .channel('notif_sync_contractor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_notifications' }, () => loadTasks())
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigation, user]);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.4 });
    if (!result.canceled) {
      setEvidenceFile({ uri: result.assets[0].uri, name: 'camera_capture.jpg', isImage: true });
    }
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!res.canceled) {
      setEvidenceFile({ 
        uri: res.assets[0].uri, 
        name: res.assets[0].name, 
        isImage: res.assets[0].mimeType?.includes('image') || false 
      });
    }
  };

  const handleResolution = async () => {
    if (!evidenceFile || !resolutionNotes || !signedByName || !user?.id) {
      Alert.alert("Compliance Block", "Evidence, Notes, and Signature are mandatory.");
      return;
    }

    try {
      setIsUploading(true);
      await workOrderService.resolveTask(user.id, selectedTask, {
        evidenceFile,
        resolutionNotes,
        remedialActions,
        signedByName,
        requiresNextService,
        nextDueDate
      });
      
      Alert.alert("Record Sealed", "Task resolved and stored in the database.");
      setUploadModalVisible(false);
      resetForm();
      loadTasks();
    } catch (e: any) {
      Alert.alert("Submission Failed", e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setEvidenceFile(null);
    setResolutionNotes('');
    setRemedialActions('');
    setSignedByName('');
    setRequiresNextService(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Contractor Portal</Text>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]} 
          onPress={() => navigation.navigate('LogAccident')}
        >
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionText}>LOG ACCIDENT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: COLORS.warning }]} 
          onPress={() => navigation.navigate('FaultReporting')}
        >
          <Text style={styles.actionIcon}>⚠️</Text>
          <Text style={styles.actionText}>REPORT FAULT</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Assigned Work Orders</Text>

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
        <FlatList 
          data={assignedTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>{item.description}</Text>
                <Text style={styles.cardLoc}>📍 {item.location}</Text>
                {item.isAssetTask && <Text style={styles.assetBadge}>SYSTEM ASSET</Text>}
              </View>
              <TouchableOpacity style={styles.openBtn} onPress={() => { setSelectedTask(item); setUploadModalVisible(true); }}>
                <Text style={styles.openBtnText}>SIGN OFF</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No active jobs.</Text>}
          contentContainerStyle={{ padding: SPACING.m, paddingBottom: 100 }}
        />
      )}

      <Modal visible={uploadModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>{selectedTask?.isAssetTask ? 'Asset Certification' : 'Incident Resolution'}</Text>
            
            <Text style={styles.sectionLabel}>1. EVIDENCE ATTACHMENT</Text>
            <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                    <Text style={styles.uploadIcon}>📸</Text>
                    <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                    <Text style={styles.uploadIcon}>📁</Text>
                    <Text style={styles.uploadText}>Files/PDF</Text>
                </TouchableOpacity>
            </View>

            {evidenceFile && (
                <View style={styles.previewContainer}>
                    {evidenceFile.isImage ? (
                        <Image source={{ uri: evidenceFile.uri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.pdfPlaceholder}><Text style={styles.pdfText}>📄 {evidenceFile.name}</Text></View>
                    )}
                    <TouchableOpacity onPress={() => setEvidenceFile(null)}><Text style={styles.removeText}>Remove File</Text></TouchableOpacity>
                </View>
            )}

            <Text style={styles.sectionLabel}>2. WORK NOTES</Text>
            <TextInput style={[styles.input, { height: 70 }]} placeholder="Summary of work..." multiline value={resolutionNotes} onChangeText={setResolutionNotes} />

            {!selectedTask?.isAssetTask && (
              <>
                <Text style={styles.sectionLabel}>3. REMEDIAL ACTIONS</Text>
                <TextInput style={styles.input} placeholder="Anything else need fixing?" value={remedialActions} onChangeText={setRemedialActions} />
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>SCHEDULE NEXT SERVICE?</Text>
              <Switch value={requiresNextService} onValueChange={setRequiresNextService} trackColor={{ false: "#ddd", true: COLORS.secondary }} />
            </View>

            {requiresNextService && (
              <View>
                <Text style={styles.sectionLabel}>FUTURE DUE DATE</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>📅 {nextDueDate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={nextDueDate} mode="date" display="default" onChange={(_event: any, date?: Date) => { setShowDatePicker(false); if (date) setNextDueDate(date); }} />
                )}
              </View>
            )}

            <Text style={styles.sectionLabel}>5. SIGNATURE (PRINT NAME)</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={signedByName} onChangeText={setSignedByName} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleResolution} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT COMPLIANCE DATA</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>CANCEL</Text></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { ...TYPOGRAPHY.header, paddingHorizontal: SPACING.m, paddingTop: SPACING.m, color: COLORS.primary },
  notifBadgeContainer: { marginLeft: 20, position: 'relative' },
  notifIcon: { fontSize: 22 },
  badge: { position: 'absolute', right: -6, top: -4, backgroundColor: COLORS.secondary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.white },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  subHeader: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray, paddingHorizontal: SPACING.m, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.m, marginBottom: 5 },
  actionBtn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', ...SHADOWS.light },
  actionIcon: { fontSize: 18, marginRight: 8 },
  actionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 11 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.m, ...SHADOWS.light },
  cardTitle: { fontWeight: 'bold', fontSize: 15 },
  cardLoc: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  assetBadge: { fontSize: 9, fontWeight: 'bold', color: COLORS.secondary, marginTop: 5 },
  openBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  openBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.gray },
  modalBg: { flex: 1, backgroundColor: COLORS.white },
  modalScroll: { padding: 25 },
  modalTitle: { ...TYPOGRAPHY.header, textAlign: 'center', marginBottom: 25, color: COLORS.primary },
  sectionLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, marginBottom: 8, letterSpacing: 1 },
  uploadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  uploadOption: { flex: 0.48, height: 80, backgroundColor: '#f0f4f8', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d0d7de', borderStyle: 'dashed' },
  uploadIcon: { fontSize: 24, marginBottom: 4 },
  uploadText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  previewContainer: { marginBottom: 20, alignItems: 'center' },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  pdfPlaceholder: { width: '100%', padding: 20, backgroundColor: '#fffbe6', borderRadius: 12, borderWidth: 1, borderColor: '#ffe58f', alignItems: 'center' },
  pdfText: { fontWeight: 'bold', color: '#856404' },
  removeText: { marginTop: 8, color: COLORS.warning, fontWeight: 'bold', fontSize: 12 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#f0f4f8', padding: 15, borderRadius: 10 },
  switchLabel: { fontWeight: 'bold', fontSize: 11, color: COLORS.primary },
  datePickerBtn: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
  dateText: { fontWeight: 'bold' },
  submitBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: 12, alignItems: 'center' },
  submitText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 20, alignItems: 'center' },
  cancelText: { color: COLORS.gray, fontWeight: 'bold' }
});