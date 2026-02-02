import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, TextInput, Image, ScrollView, SafeAreaView, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { workOrderService } from '../services/workOrderService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { notificationService } from '../services/notificationService';

export const ContractorWorkOrders = ({ navigation }: any) => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [form, setForm] = useState({
    notes: '',
    remedial: '',
    signature: '',
    nextService: false,
    date: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [evidence, setEvidence] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadTasks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const tasks = await workOrderService.getAssignedTasks(user.id);
      setAssignedTasks(tasks);
    } catch (e: any) {
      Alert.alert("System Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.4 });
    if (!result.canceled) {
      setEvidence({ uri: result.assets[0].uri, name: 'capture.jpg', isImage: true });
    }
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!res.canceled) {
      setEvidence({ 
        uri: res.assets[0].uri, 
        name: res.assets[0].name, 
        isImage: res.assets[0].mimeType?.includes('image')
      });
    }
  };

  const handleResolution = async () => {
    if (!evidence || !form.notes || !form.signature) {
      Alert.alert("Compliance Block", "Missing required evidence or signature.");
      return;
    }
    try {
      setIsUploading(true);
      let finalIsoDate = null;
      if (form.nextService) {
        const dateObj = form.date instanceof Date ? form.date : new Date(form.date);
        finalIsoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();
      }
      await workOrderService.resolveTask(user!.id, selectedTask, {
        evidenceFile: evidence,
        resolutionNotes: form.notes,
        remedialActions: form.remedial,
        signedByName: form.signature,
        requiresNextService: form.nextService,
        nextDueDate: finalIsoDate
      });
      await notificationService.notifyManagers(
        "WORK ORDER COMPLETED",
        `Contractor ${user?.name} has submitted sign-off for: ${selectedTask.description}`,
        "WORK_ORDER"
      );
      Alert.alert("Success", "Regulatory record sealed.");
      setUploadModalVisible(false);
      loadTasks();
    } catch (e: any) {
      Alert.alert("Sync Error", e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const displayDateText = () => {
    const d = form.date instanceof Date ? form.date : new Date(form.date);
    return isNaN(d.getTime()) ? 'Select Date' : d.toLocaleDateString('en-GB');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.quickRow}>
        <TouchableOpacity 
          testID="btn-quick-accident"
          style={styles.quickBtn} 
          onPress={() => navigation.navigate('LogAccident')}
        >
          <Ionicons name="medical" size={20} color="#FF4D4F" />
          <Text style={styles.quickBtnText}>ACCIDENT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="btn-quick-fault"
          style={styles.quickBtn} 
          onPress={() => navigation.navigate('FaultReporting')}
        >
          <Ionicons name="warning" size={20} color="#FAAD14" />
          <Text style={styles.quickBtnText}>FAULT</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          testID="btn-quick-profile"
          style={[styles.quickBtn, { borderLeftWidth: 2, borderLeftColor: COLORS.primary }]} 
          onPress={() => navigation.navigate('ContractorProfile')}
        >
          <Ionicons name="person-circle" size={22} color={COLORS.primary} />
          <Text style={[styles.quickBtnText, { color: COLORS.primary }]}>PROFILE</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={assignedTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.orderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderTitle}>{item.description}</Text>
              <Text style={styles.orderLoc}>{item.location}</Text>
            </View>
            <TouchableOpacity 
              testID={`btn-sign-off-${index}`}
              style={styles.signBtn} 
              onPress={() => { setSelectedTask(item); setUploadModalVisible(true); }}
            >
              <Text style={styles.signBtnText}>SIGN OFF</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No assigned work orders found.</Text>}
        contentContainerStyle={{ padding: 20 }}
      />

      <Modal visible={uploadModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent} testID="sign-off-modal">
          <ScrollView contentContainerStyle={{ padding: 25 }}>
            <Text style={styles.modalHeader}>STATUTORY CERTIFICATION</Text>
            
            <View style={styles.fileRow}>
              <TouchableOpacity testID="btn-capture-camera" style={styles.fileBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={COLORS.primary} />
                <Text style={styles.fileBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="btn-capture-file" style={styles.fileBtn} onPress={pickFile}>
                <Ionicons name="document-attach" size={24} color={COLORS.primary} />
                <Text style={styles.fileBtnText}>Attach</Text>
              </TouchableOpacity>
            </View>

            {evidence && (
              <View style={styles.preview} testID="evidence-preview-container">
                {evidence.isImage ? <Image source={{ uri: evidence.uri }} style={styles.img} /> : <Text style={styles.fileAttached}>File Attached: {evidence.name}</Text>}
              </View>
            )}

            <Text style={styles.inputLabel}>RESOLUTION NOTES</Text>
            <TextInput 
              testID="input-resolution-notes"
              style={[styles.input, { height: 80 }]} 
              placeholder="Detailed summary of work completed..." 
              multiline 
              value={form.notes} 
              onChangeText={(t) => setForm({...form, notes: t})} 
            />

            <Text style={styles.inputLabel}>REMEDIAL ACTIONS TAKEN</Text>
            <TextInput 
              testID="input-remedial-actions"
              style={[styles.input, { height: 80 }]} 
              placeholder="Describe any fixes or secondary actions..." 
              multiline 
              value={form.remedial} 
              onChangeText={(t) => setForm({...form, remedial: t})} 
            />

            <Text style={styles.inputLabel}>DIGITAL SIGNATURE</Text>
            <TextInput 
              testID="input-digital-signature"
              style={styles.input} 
              placeholder="Type Full Name" 
              value={form.signature} 
              onChangeText={(t) => setForm({...form, signature: t})} 
            />

            <View style={styles.switchBox}>
              <View>
                <Text style={styles.switchLabel}>NEXT SERVICE REQUIRED?</Text>
                {form.nextService && (
                   <TouchableOpacity testID="btn-open-datepicker" onPress={() => setShowDatePicker(true)}>
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
                  setForm({...form, nextService: v});
                  if(v) setShowDatePicker(true);
                }} 
              />
            </View>

            <TouchableOpacity 
              testID="btn-seal-record"
              style={styles.submit} 
              onPress={handleResolution} 
              disabled={isUploading}
            >
              {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SEAL RECORD & COMMIT</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              testID="btn-abort-sign-off"
              onPress={() => setUploadModalVisible(false)} 
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>ABORT & CLOSE</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  quickRow: { flexDirection: 'row', gap: 10, padding: 20 },
  quickBtn: { flex: 1, height: 50, backgroundColor: COLORS.white, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.light },
  quickBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', ...SHADOWS.light },
  orderTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  orderLoc: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  signBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  signBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 100, color: COLORS.lightGray },
  modalContent: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 25, color: COLORS.primary, letterSpacing: 2 },
  fileRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  fileBtn: { flex: 1, height: 70, borderRadius: 15, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#C4CDD5' },
  fileBtnText: { fontSize: 11, fontWeight: '700', marginTop: 5, color: COLORS.primary },
  preview: { height: 150, marginBottom: 20, borderRadius: 15, overflow: 'hidden', backgroundColor: '#F8F9FB', justifyContent: 'center', alignItems: 'center' },
  img: { width: '100%', height: '100%' },
  fileAttached: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#F8F9FB', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#CBD5E0', fontSize: 14, color: '#1A202C' },
  switchBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F0F4F8', borderRadius: 12, marginBottom: 25 },
  switchLabel: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
  dateDisplay: { fontSize: 14, color: '#2B6CB0', fontWeight: '800', marginTop: 4, textDecorationLine: 'underline' },
  submit: { backgroundColor: '#00C853', padding: 20, borderRadius: 15, alignItems: 'center' },
  submitText: { color: COLORS.white, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  cancel: { padding: 20, alignItems: 'center', marginTop: 10 },
  cancelText: { fontWeight: '900', color: '#E53E3E', fontSize: 15, textDecorationLine: 'underline' }
});