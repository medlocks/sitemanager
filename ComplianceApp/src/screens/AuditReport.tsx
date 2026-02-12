import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { auditService } from '../services/auditService';
import { accidentService } from '../services/accidentService';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, TOUCH_TARGETS } from '../theme';

import { AuditFilters } from '../components/audit/AuditFilters';
import { AuditCharts } from '../components/audit/AuditCharts';
import { AuditList } from '../components/audit/AuditList';
import { AuditDetailModal } from '../components/audit/AuditDetailModal';

export const AuditReport = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'Analytics' | 'Incidents' | 'Assets' | 'Accidents'>('Analytics');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [accidents, setAccidents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [fromDate, setFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [toDate, setToDate] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAuditData();
      const accData = await accidentService.getAccidents();
      setIncidents(data.incidents || []);
      setAssets(data.assets || []);
      setAccidents(accData || []);
    } catch (e: any) {
      Alert.alert("Sync Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredIncidents = incidents.filter(item => {
    const itemDate = new Date(item.created_at);
    return itemDate >= fromDate && itemDate <= toDate && 
           (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredAccidents = accidents.filter(item => {
    const itemDate = new Date(item.date_time);
    return itemDate >= fromDate && itemDate <= toDate && 
           (item.injured_person_name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredAssets = assets.filter(item => 
    (item.asset_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incidentChartData = auditService.getMonthlyTrend(filteredIncidents);
  const accidentChartData = auditService.getMonthlyTrend(filteredAccidents.map(a => ({...a, created_at: a.date_time})));

  return (
    <SafeAreaView style={styles.container}>
      <AuditFilters 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        fromDate={fromDate} 
        toDate={toDate}
        onDateChange={(type, date) => type === 'from' ? setFromDate(date) : setToDate(date)}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {viewMode === 'Analytics' ? (
            <AuditCharts incidentData={incidentChartData} accidentData={accidentChartData} />
          ) : (
            <AuditList 
              viewMode={viewMode}
              data={viewMode === 'Assets' ? filteredAssets : viewMode === 'Accidents' ? filteredAccidents : filteredIncidents}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectItem={setSelectedItem}
            />
          )}
        </View>
      )}

      {viewMode !== 'Analytics' && (
       <TouchableOpacity 
  testID="btn-export-audit-pdf"
  style={styles.exportBtn} 
  onPress={() => {
    const dataToExport = 
      viewMode === 'Assets' ? filteredAssets : 
      viewMode === 'Accidents' ? filteredAccidents : 
      filteredIncidents;

    auditService.generateAuditPDF(
      `${viewMode} Report`, 
      dataToExport, 
      viewMode === 'Assets'
    );
  }}
  accessibilityRole="button"
  accessibilityLabel={`Generate ${viewMode} PDF report`}
>
  <Text style={styles.exportTxt}>GENERATE {viewMode.toUpperCase()} PDF</Text>
</TouchableOpacity>
      )}

      <AuditDetailModal 
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        viewMode={viewMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: { 
    flex: 1 
  },
  exportBtn: { 
    margin: SPACING.l, 
    backgroundColor: COLORS.success, 
    minHeight: TOUCH_TARGETS.min, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  exportTxt: { 
    color: COLORS.white, 
    fontWeight: '800', 
    fontSize: 16, 
    letterSpacing: 1.2 
  },
});