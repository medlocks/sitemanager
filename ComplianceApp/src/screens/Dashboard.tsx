import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, ScrollView, Image, SafeAreaView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { incidentService, Incident } from '../services/incidentService';
import { notificationService } from '../services/notificationService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const Dashboard = ({ navigation }: any) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Incident | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentData, notifications] = await Promise.all([
        incidentService.getIncidents(),
        notificationService.getNotificationLog(user?.id || '')
      ]);
      setIncidents(incidentData);
      if (notifications){
      setUnreadCount(notifications.filter((n: any) => !n.is_read).length);
      }
    } catch (e: any) {
      Alert.alert("Sync Error", "Could not fetch live dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')} 
          style={styles.notifBadgeContainer}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, unreadCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);

    const channel = supabase
      .channel('db_changes_dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_notifications' }, () => loadData())
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigation, user]);

  const stats = {
    pending: incidents.filter(i => i.status === 'Pending').length,
    assigned: incidents.filter(i => i.status === 'Assigned').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
  };

  const openDetails = (item: Incident) => {
    setSelectedTask(item);
    setDetailVisible(true);
  };

  const renderItem = ({ item }: { item: Incident }) => {
    const isPlanned = item.type === 'Planned';
    const statusColor = item.status === 'Resolved' ? COLORS.success : (isPlanned ? COLORS.secondary : COLORS.warning);

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: statusColor }]}
        onPress={() => openDetails(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
             <Text style={styles.statusBadgeText}>{isPlanned && item.status !== 'Resolved' ? 'PLANNED' : item.status}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.meta}>📍 {item.location}</Text>
          <Text style={styles.viewLink}>VIEW RECORD →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Raytheon Command Center</Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: COLORS.warning }]}>
            <Text style={styles.statNum}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.statNum}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: COLORS.success }]}>
            <Text style={styles.statNum}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.faultBtn} onPress={() => navigation.navigate('FaultReporting')}>
          <Text style={styles.faultBtnText}>⚠️ REPORT NEW FAULT / HAZARD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.accidentBtn} onPress={() => navigation.navigate('LogAccident')}>
          <Text style={styles.accidentBtnText}>🚨 LOG WORKPLACE ACCIDENT</Text>
        </TouchableOpacity>

        {user?.role === 'Manager' && (
          <View style={styles.governanceSection}>
            <Text style={styles.subHeader}>Governance & Statutory Tools</Text>
            <View style={styles.grid}>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('BuildingServices')}>
                <Text style={styles.gridLabel}>Asset Register</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AuditReport')}>
                <Text style={styles.gridLabel}>Audit Vault</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('QualificationTracker')}>
                <Text style={styles.gridLabel}>Specialists</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridItem, { backgroundColor: COLORS.secondary }]} onPress={() => navigation.navigate('SiteSettings')}>
                <Text style={styles.gridLabel}>Security Config</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.subHeader}>Live Incident Feed</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FlatList 
            data={incidents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No active incidents.</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={detailVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Statutory Record</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={styles.closeText}>CLOSE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
               <View style={styles.infoBlock}>
                 <Text style={styles.infoLabel}>STATUS</Text>
                 <Text style={[styles.infoVal, {color: COLORS.primary}]}>{selectedTask?.status}</Text>
               </View>
               <View style={styles.infoBlock}>
                 <Text style={styles.infoLabel}>TASK TYPE</Text>
                 <Text style={styles.infoVal}>{selectedTask?.type || 'Reactive'}</Text>
               </View>
            </View>

            <Text style={styles.infoLabel}>DESCRIPTION</Text>
            <Text style={styles.bigDesc}>{selectedTask?.description}</Text>

            <Text style={styles.infoLabel}>LOCATION</Text>
            <Text style={styles.infoVal}>{selectedTask?.location}</Text>

            <View style={styles.divider} />

            {selectedTask?.status === 'Resolved' ? (
              <View>
                <Text style={styles.sectionHeader}>✓ Compliance Evidence</Text>
                
                <Text style={styles.infoLabel}>POST-WORK IMAGE</Text>
                {selectedTask?.resolved_image_url ? (
                  <Image source={{ uri: selectedTask.resolved_image_url }} style={styles.evidenceImage} />
                ) : (
                  <View style={styles.noImage}><Text>No Evidence Image Uploaded</Text></View>
                )}

                <Text style={styles.infoLabel}>RESOLUTION NOTES</Text>
                <Text style={styles.notesBox}>{selectedTask?.resolution_notes}</Text>

                <Text style={styles.infoLabel}>REMEDIAL ACTIONS TAKEN</Text>
                <Text style={styles.notesBox}>{selectedTask?.remedial_actions || 'No further actions required.'}</Text>

                <Text style={styles.infoLabel}>LEGALLY SIGNED BY</Text>
                <Text style={styles.signatureName}>{selectedTask?.signed_off_by || 'Verified User'}</Text>
                <Text style={styles.timestamp}>Resolved at: {selectedTask?.resolved_at ? new Date(selectedTask.resolved_at).toLocaleString() : 'N/A'}</Text>
              </View>
            ) : (
              user?.role === 'Manager' && (
                <TouchableOpacity 
                  style={styles.assignActionBtn}
                  onPress={() => {
                    setDetailVisible(false);
                    navigation.navigate('ContractorAssignment', { incidentId: selectedTask?.id });
                  }}
                >
                  <Text style={styles.assignActionText}>ASSIGN COMPETENT SPECIALIST</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { ...TYPOGRAPHY.header, textAlign: 'center', marginVertical: 20, color: COLORS.primary },
  notifBadgeContainer: { marginRight: 20, position: 'relative' },
  notifIcon: { fontSize: 22 },
  badge: { position: 'absolute', right: -6, top: -4, backgroundColor: COLORS.secondary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.white },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.m, marginBottom: 20 },
  statBox: { flex: 0.31, padding: 10, borderRadius: 10, alignItems: 'center', ...SHADOWS.light },
  statNum: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: 10, color: COLORS.white, fontWeight: 'bold', textTransform: 'uppercase' },
  faultBtn: { backgroundColor: COLORS.white, marginHorizontal: SPACING.m, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: COLORS.warning, ...SHADOWS.light },
  faultBtnText: { fontWeight: 'bold', color: COLORS.text },
  accidentBtn: { backgroundColor: COLORS.secondary, marginHorizontal: SPACING.m, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 25, ...SHADOWS.light },
  accidentBtnText: { fontWeight: 'bold', color: COLORS.white },
  governanceSection: { paddingHorizontal: SPACING.m, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, marginBottom: 12, alignItems: 'center', ...SHADOWS.light },
  gridLabel: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  subHeader: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: SPACING.m },
  card: { backgroundColor: COLORS.white, marginHorizontal: SPACING.m, padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 6, ...SHADOWS.light },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  timestamp: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold', color: COLORS.white },
  desc: { fontWeight: 'bold', fontSize: 15, color: COLORS.text, marginVertical: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { fontSize: 11, color: COLORS.gray },
  viewLink: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.gray, paddingHorizontal: 20 },
  modalContent: { flex: 1, padding: 25, backgroundColor: COLORS.white },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  closeText: { fontWeight: 'bold', color: COLORS.gray },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoBlock: { flex: 0.45 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, marginBottom: 5, letterSpacing: 0.5 },
  infoVal: { fontSize: 15, fontWeight: '600' },
  bigDesc: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.success, marginBottom: 20 },
  evidenceImage: { width: '100%', height: 250, borderRadius: 15, marginBottom: 20 },
  noImage: { width: '100%', height: 120, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', borderRadius: 15, borderColor: '#eee' },
  notesBox: { backgroundColor: '#f7f7f7', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  signatureName: { fontSize: 20, fontStyle: 'italic', color: COLORS.primary, fontWeight: 'bold', marginTop: 5 },
  assignActionBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  assignActionText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});