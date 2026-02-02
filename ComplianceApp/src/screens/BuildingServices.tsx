import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { buildingService } from '../services/buildingService';
import { assetService } from '../services/assetService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const BuildingServices = ({ navigation }: any) => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBuildingData = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getServiceReports();
      setServices(data);
    } catch (error: any) {
      Alert.alert("Sync Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        user?.role === 'Manager' && (
          <TouchableOpacity 
            testID="btn-nav-add-asset"
            onPress={() => navigation.navigate('AddAsset')} 
            style={styles.navAddBtn}
          >
            <Text style={styles.navAddText}>+ NEW</Text>
          </TouchableOpacity>
        )
      ),
    });
    const unsubscribe = navigation.addListener('focus', loadBuildingData);
    return unsubscribe;
  }, [navigation, user]);

  const handleDuplicate = async (item: any) => {
    try {
      setLoading(true);
      await assetService.duplicateAsset(item);
      await loadBuildingData();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderService = ({ item, index }: { item: any, index: number }) => {
    const isCompliant = item.status === 'Compliant';
    const isManager = user?.role === 'Manager';

    return (
      <TouchableOpacity 
        testID={`asset-card-${index}`}
        style={[styles.card, { borderLeftColor: isCompliant ? COLORS.success : COLORS.secondary }]}
        onPress={() => isManager && navigation.navigate('AddAsset', { asset: item })}
      >
        <View style={styles.headerRow}>
          <Text style={styles.typeTag}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isCompliant ? COLORS.success : COLORS.secondary }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.assetTitle}>{item.assetName}</Text>
        <Text style={styles.meta}>📍 {item.location || 'No location'}</Text>
        
        <View style={styles.dateGrid}>
          <View><Text style={styles.dateLabel}>LAST</Text><Text style={styles.dateValue}>{item.lastServiceDate || '-'}</Text></View>
          <View><Text style={styles.dateLabel}>DUE</Text><Text style={styles.dateValue}>{item.nextServiceDueDate}</Text></View>
        </View>

        {isManager && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              testID={`btn-assign-asset-${index}`}
              style={styles.assignBtn}
              onPress={() => navigation.navigate('ContractorAssignment', { incidentId: item.id, isAsset: true, assetName: item.assetName })}
            >
              <Text style={styles.btnText}>ASSIGN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              testID={`btn-copy-asset-${index}`}
              style={styles.copyBtn} 
              onPress={() => handleDuplicate(item)}
            >
              <Text style={styles.copyText}>COPY</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Asset Register</Text>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} testID="loading-indicator" /> : (
        <FlatList 
          testID="asset-list"
          data={services} 
          keyExtractor={(item) => item.id} 
          renderItem={({item, index}) => renderService({item, index})} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.m, backgroundColor: COLORS.background },
  mainTitle: { ...TYPOGRAPHY.header, marginBottom: 15 },
  card: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 6, ...SHADOWS.light },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  typeTag: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  assetTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  meta: { fontSize: 12, color: COLORS.gray },
  dateGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  dateLabel: { fontSize: 8, color: COLORS.gray },
  dateValue: { fontSize: 12, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  assignBtn: { backgroundColor: COLORS.primary, flex: 0.75, padding: 10, borderRadius: 6, alignItems: 'center' },
  copyBtn: { backgroundColor: '#eee', flex: 0.2, padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  copyText: { fontWeight: 'bold', fontSize: 12 },
  navAddBtn: { backgroundColor: COLORS.success, padding: 8, borderRadius: 6 },
  navAddText: { color: '#fff', fontWeight: 'bold' }
});