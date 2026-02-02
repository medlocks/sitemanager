import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, SafeAreaView, ActivityIndicator } from 'react-native';
import { contractorService } from '../services/contractorService';
import { COLORS, TYPOGRAPHY } from '../theme';

export const ContractorDetail = ({ route, navigation }: any) => {
  const { contractor } = route.params;
  const [status, setStatus] = useState(contractor.competence_status);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      await contractorService.updateContractorStatus(contractor.id, newStatus);
      setStatus(newStatus);
      Alert.alert("Success", `Status changed to ${newStatus}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{contractor.name[0]}</Text>
          </View>
          <Text style={styles.name}>{contractor.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{contractor.specialism?.toUpperCase() || 'GENERAL'}</Text>
          </View>
          <Text style={styles.email}>{contractor.email}</Text>
          <Text 
            testID="contractor-status-text"
            style={[styles.statusInfo, { color: status === 'Approved' ? COLORS.success : COLORS.secondary }]}
          >
            Current Status: {status}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Statutory Documents</Text>
          <TouchableOpacity 
            testID="btn-view-contractor-cert"
            style={styles.fileBtn} 
            onPress={() => contractor.competence_evidence_url ? Linking.openURL(contractor.competence_evidence_url) : Alert.alert("Error", "No document available")}
          >
            <Text style={styles.fileBtnTxt}>📄 VIEW SUBMITTED CERTIFICATE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionSection}>
          {loading ? (
            <ActivityIndicator testID="status-loading-indicator" color={COLORS.primary} />
          ) : (
            <>
              <TouchableOpacity 
                testID="btn-approve-contractor"
                style={styles.approveBtn} 
                onPress={() => handleUpdateStatus('Approved')}
              >
                <Text style={styles.btnTxt}>APPROVE OPERATIVE</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                testID="btn-suspend-contractor"
                style={styles.suspendBtn} 
                onPress={() => handleUpdateStatus('Rejected')}
              >
                <Text style={styles.btnTxt}>SUSPEND / REJECT</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 25 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  badge: { backgroundColor: '#f0f4f8', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, marginVertical: 8 },
  badgeTxt: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  email: { color: COLORS.gray },
  statusInfo: { fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  section: { marginBottom: 25 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, marginBottom: 8 },
  fileBtn: { backgroundColor: '#f0f4f8', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  fileBtnTxt: { color: COLORS.primary, fontWeight: 'bold' },
  actionSection: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  approveBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  suspendBtn: { backgroundColor: COLORS.secondary, padding: 18, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold' }
});