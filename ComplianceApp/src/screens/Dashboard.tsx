import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  TextStyle,
  ViewStyle
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { checkPendingTasks } from '../services/notificationService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const Dashboard = ({ navigation }: any) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('@incidents_vault');
      if (data) {
        const parsedData = JSON.parse(data);
        setIncidents(parsedData.sort((a: any, b: any) => 
          b.timestamp.localeCompare(a.timestamp)
        ));
      }
    } catch (e) {
      Alert.alert("Error", "Failed to sync local data.");
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
      if (user?.role === 'SiteManager') {
        checkPendingTasks();
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const stats = {
    pending: incidents.filter(i => i.status === 'Pending').length,
    assigned: incidents.filter(i => i.status === 'Assigned').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
  };

  const renderItem = ({ item }: { item: Incident }) => {
    // Logic for dynamic borders based on status
    let statusBorderColor = COLORS.warning;
    if (item.status === 'Assigned') statusBorderColor = COLORS.info;
    if (item.status === 'Resolved') statusBorderColor = COLORS.success;

    // Logic for dynamic badge background
    let badgeBg = COLORS.warning;
    if (item.status === 'Assigned') badgeBg = COLORS.info;
    if (item.status === 'Resolved') badgeBg = COLORS.success;

    return (
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: statusBorderColor }]}
        onPress={() => {
          if (user?.role === 'SiteManager' && item.status === 'Pending') {
            navigation.navigate('ContractorAssignment', { incidentId: item.id });
          }
        }}
        disabled={user?.role !== 'SiteManager' || item.status !== 'Pending'}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
             <Text style={styles.statusBadgeText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.meta}>Reporter: {item.userId} {item.assignedTo ? `| Assigned: ${item.assignedTo}` : ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Raytheon Command Centre</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.statNum}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: COLORS.info }]}>
          <Text style={styles.statNum}>{stats.assigned}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: COLORS.success }]}>
          <Text style={styles.statNum}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.faultBtn} 
        onPress={() => navigation.navigate('FaultReporting')}
      >
        <Text style={styles.faultBtnText}>⚠️ REPORT NEW FAULT / HAZARD</Text>
      </TouchableOpacity>

      {user?.role === 'SiteManager' && (
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('FireRiskAssessment')}>
            <Text style={styles.gridLabel}>Fire Safety</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('BuildingServices')}>
            <Text style={styles.gridLabel}>TR19 / Gas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('QualificationTracker')}>
            <Text style={styles.gridLabel}>Contractors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AuditReport')}>
            <Text style={styles.gridLabel}>Audit Logs</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.subHeader}>Recent Site Activity</Text>
      <FlatList 
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.m, 
    backgroundColor: COLORS.background 
  } as ViewStyle,
  header: { 
    ...TYPOGRAPHY.header, 
    textAlign: 'center', 
    marginBottom: SPACING.m 
  } as TextStyle,
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.m 
  } as ViewStyle,
  statBox: { 
    flex: 0.31, 
    padding: SPACING.s, 
    borderRadius: 10, 
    alignItems: 'center', 
    ...SHADOWS.light 
  } as ViewStyle,
  statNum: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.white 
  } as TextStyle,
  statLabel: { 
    fontSize: 9, 
    color: COLORS.white, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  } as TextStyle,
  faultBtn: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: SPACING.m, 
    borderWidth: 2, 
    borderColor: COLORS.warning 
  } as ViewStyle,
  faultBtnText: { 
    fontWeight: 'bold', 
    color: COLORS.text, 
    fontSize: 14 
  } as TextStyle,
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.s 
  } as ViewStyle,
  gridItem: { 
    width: '48%', 
    backgroundColor: COLORS.primary, 
    padding: SPACING.m, 
    borderRadius: 8, 
    marginBottom: SPACING.s, 
    alignItems: 'center' 
  } as ViewStyle,
  gridLabel: { 
    color: COLORS.white, 
    fontSize: 11, 
    fontWeight: 'bold' 
  } as TextStyle,
  subHeader: { 
    ...TYPOGRAPHY.subheader, 
    marginVertical: SPACING.s, 
    color: COLORS.gray 
  } as TextStyle,
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 10, 
    marginBottom: SPACING.s, 
    borderLeftWidth: 6, 
    ...SHADOWS.light 
  } as ViewStyle,
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.xs 
  } as ViewStyle,
  timestamp: { 
    ...TYPOGRAPHY.caption 
  } as TextStyle,
  statusBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  } as ViewStyle,
  statusBadgeText: {
    fontSize: 9, 
    fontWeight: 'bold', 
    color: COLORS.white 
  } as TextStyle,
  desc: { 
    ...TYPOGRAPHY.body, 
    marginVertical: SPACING.xs, 
    fontWeight: '500' 
  } as TextStyle,
  meta: { 
    ...TYPOGRAPHY.caption, 
    fontStyle: 'italic' 
  } as TextStyle
});