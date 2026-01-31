import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  FlatList, ActivityIndicator, Alert, SafeAreaView, TextInput, Modal, Dimensions, Linking, Image 
} from 'react-native';
import { BarChart } from "react-native-chart-kit";
import DateTimePicker from '@react-native-community/datetimepicker';
import { auditService } from '../services/auditService';
import { accidentService } from '../services/accidentService';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from '../theme';

const screenWidth = Dimensions.get("window").width;

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
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

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

  const handleExport = async () => {
    const isAsset = viewMode === 'Assets';
    const isAccident = viewMode === 'Accidents';
    let dataToExport = [];
    let title = "";

    if (isAsset) {
      dataToExport = assets;
      title = "Statutory Asset Register";
    } else if (isAccident) {
      dataToExport = filteredAccidents;
      title = `Accident Logbook (${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})`;
    } else {
      dataToExport = filteredIncidents;
      title = `Incident Audit Trail (${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})`;
    }

    await auditService.generateAuditPDF(title, dataToExport, isAsset);
  };

  // --- FILTER LOGIC ---
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

  // --- CHART DATA GENERATION ---
  const incidentChartData = auditService.getMonthlyTrend(filteredIncidents);
  const accidentChartData = auditService.getMonthlyTrend(filteredAccidents.map(a => ({...a, created_at: a.date_time})));

  const renderItem = ({ item }: { item: any }) => {
    const isAsset = viewMode === 'Assets';
    const isAccident = viewMode === 'Accidents';
    const statusColor = (item.status === 'Resolved' || item.status === 'Compliant') ? COLORS.success : COLORS.secondary;
    
    return (
      <TouchableOpacity style={styles.logCard} onPress={() => setSelectedItem(item)}>
        <View style={styles.logHeader}>
          <Text style={styles.logDate}>
            {isAccident ? new Date(item.date_time).toLocaleDateString('en-GB') : 
             isAsset ? `NEXT DUE: ${item.next_service_due}` : 
             new Date(item.created_at).toLocaleDateString('en-GB')}
          </Text>
          {isAccident ? (
            item.is_riddor_reportable && <View style={styles.riddorBadge}><Text style={styles.riddorText}>RIDDOR</Text></View>
          ) : (
            <View style={[styles.pill, {backgroundColor: statusColor}]}>
               <Text style={styles.pillTxt}>{item.status?.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.logDesc}>
            {isAccident ? `Injured: ${item.injured_person_name}` : isAsset ? item.asset_name : item.description}
        </Text>
        <Text style={styles.logLoc}>📍 {item.location}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Statutory Audit Vault</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.topTabs}>
            {(['Analytics', 'Incidents', 'Assets', 'Accidents'] as const).map(tab => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setViewMode(tab)} 
                style={[styles.tab, viewMode === tab && styles.tabActive, { minWidth: 90, marginHorizontal: 4 }]}
              >
                <Text style={[styles.tabText, viewMode === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {viewMode !== 'Assets' && (
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('from')}>
            <Text style={styles.dateBtnLabel}>FROM</Text>
            <Text style={styles.dateBtnVal}>{fromDate.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
          <Text style={styles.dateDivider}>→</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('to')}>
            <Text style={styles.dateBtnLabel}>TO</Text>
            <Text style={styles.dateBtnVal}>{toDate.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'from' ? fromDate : toDate}
          mode="date"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) showPicker === 'from' ? setFromDate(date) : setToDate(date);
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.content}>
          {viewMode === 'Analytics' ? (
            <ScrollView style={{padding: 20}}>
              <Text style={styles.sectionTitle}>Incident Volume (Faults/Hazards)</Text>
              
              <BarChart
                data={{ labels: incidentChartData.labels, datasets: [{ data: incidentChartData.values }] }}
                width={screenWidth - 40} height={200}
                yAxisLabel="" yAxisSuffix=""
                chartConfig={chartConfig} style={styles.chartStyle} fromZero
              />
              
              <View style={{marginTop: 30}}>
                <Text style={[styles.sectionTitle, {color: COLORS.secondary}]}>Accident Volume (HSE Logbook)</Text>
                
                <BarChart
                    data={{ labels: accidentChartData.labels, datasets: [{ data: accidentChartData.values }] }}
                    width={screenWidth - 40} height={200}
                    yAxisLabel="" yAxisSuffix=""
                    chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(200, 0, 0, ${opacity})` }} 
                    style={styles.chartStyle} fromZero
                />
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1, padding: 20 }}>
              <TextInput 
                style={styles.searchBar} 
                placeholder={`Search ${viewMode}...`} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
              />
              <FlatList
                data={viewMode === 'Assets' ? filteredAssets : viewMode === 'Accidents' ? filteredAccidents : filteredIncidents}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyTxt}>No records found.</Text>}
              />
            </View>
          )}
        </View>
      )}

      {/* COMPREHENSIVE DRILL-DOWN MODAL */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Statutory Record Detail</Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Text style={styles.closeTxt}>DONE</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>ITEM / PERSON</Text>
              <Text style={styles.detailVal}>{selectedItem?.asset_name || selectedItem?.description || selectedItem?.injured_person_name}</Text>
              
              <Text style={styles.detailLabel}>LOCATION</Text>
              <Text style={styles.detailVal}>{selectedItem?.location || 'Not Specified'}</Text>

              <View style={styles.detailRow}>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.detailLabel}>LOGGED DATE</Text>
                     <Text style={styles.detailVal}>
                        {selectedItem?.date_time ? new Date(selectedItem.date_time).toLocaleDateString('en-GB') : new Date(selectedItem?.created_at).toLocaleDateString('en-GB')}
                     </Text>
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.detailLabel}>TIME</Text>
                     <Text style={styles.detailVal}>
                        {new Date(selectedItem?.date_time || selectedItem?.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                   </View>
              </View>
            </View>

            {/* ACCIDENT SPECIFIC DETAILS */}
            {selectedItem?.injured_person_name && (
                <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>INJURY & TREATMENT DETAILS</Text>
                    <Text style={styles.metaLabel}>Injury Description</Text>
                    <Text style={styles.notesBox}>{selectedItem.injury_description}</Text>
                    <Text style={styles.metaLabel}>Treatment Given</Text>
                    <Text style={styles.notesBox}>{selectedItem.treatment_given || 'None'}</Text>
                    <Text style={styles.metaLabel}>RIDDOR Reportable</Text>
                    <Text style={[styles.detailVal, {color: selectedItem.is_riddor_reportable ? 'red' : 'green'}]}>
                        {selectedItem.is_riddor_reportable ? 'YES - ACTION REQUIRED' : 'NO'}
                    </Text>
                </View>
            )}

            {/* ASSET SPECIFIC DETAILS */}
            {selectedItem?.asset_name && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>STATUTORY INFO</Text>
                <View style={styles.detailRow}>
                   <View style={{flex: 1}}><Text style={styles.metaLabel}>Last Service</Text><Text style={styles.detailVal}>{selectedItem?.last_service_date || 'N/A'}</Text></View>
                   <View style={{flex: 1}}><Text style={styles.metaLabel}>Next Due</Text><Text style={[styles.detailVal, {color: COLORS.secondary}]}>{selectedItem?.next_service_due || 'N/A'}</Text></View>
                </View>
              </View>
            )}

            {/* EVIDENCE SECTION */}
            {(selectedItem?.evidence_url) && (
               <View style={styles.detailSection}>
                 <Text style={styles.detailLabel}>EVIDENCE & DOCUMENTATION</Text>
                 {selectedItem.evidence_url.toLowerCase().includes('.pdf') ? (
                    <TouchableOpacity style={styles.pdfBtn} onPress={() => Linking.openURL(selectedItem.evidence_url)}>
                        <Text style={styles.pdfBtnTxt}>📄 VIEW PDF CERTIFICATE</Text>
                    </TouchableOpacity>
                 ) : (
                    <Image source={{ uri: selectedItem.evidence_url }} style={styles.evidenceImage} resizeMode="contain" />
                 )}
               </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {viewMode !== 'Analytics' && (
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportTxt}>GENERATE {viewMode.toUpperCase()} PDF</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const chartConfig = {
  backgroundColor: "#fff", backgroundGradientFrom: "#fff", backgroundGradientTo: "#fff",
  decimalPlaces: 0, color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
  barPercentage: 0.6,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { ...TYPOGRAPHY.header, color: COLORS.primary },
  tabScroll: { marginTop: 15 },
  topTabs: { flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 10, padding: 4 },
  tab: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', ...SHADOWS.light },
  tabText: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary },
  filterBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dateBtn: { flex: 1, alignItems: 'center' },
  dateBtnLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.gray, letterSpacing: 1 },
  dateBtnVal: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginTop: 2 },
  dateDivider: { paddingHorizontal: 10, color: '#ccc' },
  searchBar: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: COLORS.primary, textTransform: 'uppercase' },
  chartStyle: { borderRadius: 16, marginVertical: 8 },
  logCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, ...SHADOWS.light },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logDate: { fontSize: 10, color: COLORS.gray, fontWeight: 'bold' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  pillTxt: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  riddorBadge: { backgroundColor: 'red', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  riddorText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  logDesc: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  logLoc: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  closeTxt: { color: COLORS.primary, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  detailCard: { backgroundColor: '#F8F9FB', padding: 20, borderRadius: 15, marginBottom: 20 },
  detailSection: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10, paddingTop: 10 },
  detailLabel: { fontSize: 10, fontWeight: 'bold', color: '#999', marginTop: 10, letterSpacing: 0.5 },
  detailVal: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  metaLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary, marginTop: 15 },
  notesBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 5, fontSize: 13, color: '#444' },
  exportBtn: { margin: 20, backgroundColor: COLORS.success, padding: 18, borderRadius: 12, alignItems: 'center' },
  exportTxt: { color: '#fff', fontWeight: 'bold' },
  emptyTxt: { textAlign: 'center', marginTop: 50, color: COLORS.gray },
  pdfBtn: { backgroundColor: '#FEE2E2', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  pdfBtnTxt: { color: '#B91C1C', fontWeight: 'bold', fontSize: 13 },
  evidenceImage: { width: '100%', height: 300, borderRadius: 12, marginTop: 10 }
});