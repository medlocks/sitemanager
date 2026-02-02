import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  FlatList, ActivityIndicator, Alert, SafeAreaView, TextInput, Modal, Dimensions, Linking, Image 
} from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
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
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [fromDate, setFromDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);

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

  const fetchAssetHistory = async (assetId: string) => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('asset_id', assetId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (e: any) {
      console.error("History Error:", e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedItem) {
      resolveEvidence(selectedItem);
      if (viewMode === 'Assets') {
        fetchAssetHistory(selectedItem.id);
      }
    } else {
      setEvidenceUri(null);
      setHistory([]);
    }
  }, [selectedItem]);

  const resolveEvidence = (item: any) => {
    setLoadingImg(true);
    const rawPath = item.image_url || item.evidence_url || item.resolved_image_url || item.certificate_url;
    
    if (rawPath && !rawPath.startsWith('file://')) {
      if (rawPath.startsWith('http')) {
        setEvidenceUri(rawPath);
        setLoadingImg(false);
      } else {
        const { data } = supabase.storage
          .from('incident-evidence')
          .getPublicUrl(rawPath);
        
        if (data?.publicUrl) {
          setEvidenceUri(`${data.publicUrl}?t=${new Date().getTime()}`);
        }
        setLoadingImg(false);
      }
    } else {
      setEvidenceUri(null);
      setLoadingImg(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'PENDING';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const openEvidence = (url?: string) => {
    const targetUrl = url || evidenceUri;
    if (targetUrl) {
      Linking.openURL(targetUrl).catch(() => {
        Alert.alert("Error", "Unable to open evidence file.");
      });
    }
  };

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

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isAsset = viewMode === 'Assets';
    const isAccident = viewMode === 'Accidents';
    const statusColor = (item.status === 'Resolved' || item.status === 'Compliant') ? '#00C853' : '#FFAB00';
    
    return (
      <TouchableOpacity 
        testID={`audit-log-item-${index}`}
        style={styles.logCard} 
        onPress={() => setSelectedItem(item)}
      >
        <View style={styles.logHeader}>
          <Text style={styles.logDate}>
            {isAccident ? formatDate(item.date_time) : 
             isAsset ? `NEXT DUE: ${item.next_service_due}` : 
             formatDate(item.created_at)}
          </Text>
          <View style={[styles.pill, {backgroundColor: statusColor}]}>
             <Text style={styles.pillTxt}>{item.status?.toUpperCase() || (isAccident ? 'LOGGED' : 'PENDING')}</Text>
          </View>
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
                testID={`audit-tab-${tab}`}
                onPress={() => setViewMode(tab)} 
                style={[styles.tab, viewMode === tab && styles.tabActive, { minWidth: 90, marginHorizontal: 4 }]}
              >
                <Text style={[styles.tabText, viewMode === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {viewMode !== 'Assets' && viewMode !== 'Analytics' && (
        <View style={styles.filterBar}>
          <TouchableOpacity testID="btn-filter-from" style={styles.dateBtn} onPress={() => setShowPicker('from')}>
            <Text style={styles.dateBtnLabel}>FROM</Text>
            <Text style={styles.dateBtnVal}>{fromDate.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
          <Text style={styles.dateDivider}>→</Text>
          <TouchableOpacity testID="btn-filter-to" style={styles.dateBtn} onPress={() => setShowPicker('to')}>
            <Text style={styles.dateBtnLabel}>TO</Text>
            <Text style={styles.dateBtnVal}>{toDate.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          testID="audit-date-picker"
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
            <ScrollView style={{padding: 20}} testID="audit-analytics-view">
              <Text style={styles.sectionTitle} testID="incident-volume">Incident Volume (Faults/Hazards)</Text>
              <BarChart
                data={{ labels: incidentChartData.labels, datasets: [{ data: incidentChartData.values }] }}
                width={screenWidth - 40} height={200}
                yAxisLabel="" yAxisSuffix=""
                chartConfig={chartConfig} style={styles.chartStyle} fromZero
              />
              <View style={{marginTop: 30}}>
                <Text style={[styles.sectionTitle, {color: COLORS.secondary}]} testID="accident-volume">Accident Volume (HSE Logbook)</Text>
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
            <View style={{ flex: 1, padding: 20 }} testID={`audit-list-view-${viewMode}`}>
              <TextInput 
                testID="audit-search-input"
                style={styles.searchBar} 
                placeholder={`Search ${viewMode}...`} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                placeholderTextColor={COLORS.textLight}
              />
              <FlatList
                data={viewMode === 'Assets' ? filteredAssets : viewMode === 'Accidents' ? filteredAccidents : filteredIncidents}
                keyExtractor={item => item.id}
                renderItem={({item, index}) => renderItem({item, index})}
                ListEmptyComponent={<Text style={styles.emptyTxt}>No statutory records found.</Text>}
              />
            </View>
          )}
        </View>
      )}

      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{flex: 1, backgroundColor: '#F4F7FA'}} testID="audit-modal-detail">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Statutory Record Detail</Text>
            <TouchableOpacity testID="btn-close-audit-modal" onPress={() => setSelectedItem(null)}>
              <Text style={styles.closeTxt}>DONE</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* TIMELINE SECTION */}
            <View style={styles.detailSection}>
              <Text style={styles.label}>STATUTORY AUDIT TIMELINE</Text>
              <View style={styles.timelineItem}>
                <Ionicons name="radio-button-on" size={14} color={COLORS.secondary} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>LOGGED / CREATED</Text>
                  <Text style={styles.timeValue}>{formatDate(selectedItem?.created_at || selectedItem?.date_time)}</Text>
                </View>
              </View>
              
              {(selectedItem?.status === 'Resolved' || selectedItem?.status === 'Compliant') && (
                <View style={[styles.timelineItem, { marginTop: 15 }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#00C853" />
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>VERIFIED & SIGNED OFF</Text>
                    <Text style={styles.timeValue}>{formatDate(selectedItem?.resolved_at || selectedItem?.last_service)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* CORE DATA */}
            <View style={styles.detailSection}>
              <Text style={styles.label}>CORE DETAILS</Text>
              <Text style={styles.value} testID="audit-detail-title">{selectedItem?.asset_name || selectedItem?.description || selectedItem?.injured_person_name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={COLORS.textLight} />
                <Text style={styles.locationText}>{selectedItem?.location || 'Not Specified'}</Text>
              </View>
              {selectedItem?.next_service_due && (
                <Text style={[styles.auditMeta, { marginTop: 10, color: COLORS.secondary }]}>
                  NEXT STATUTORY DUE: {selectedItem.next_service_due}
                </Text>
              )}
            </View>

            {/* LATEST EVIDENCE */}
            <View style={styles.detailSection}>
              <Text style={styles.label}>LATEST DIGITAL EVIDENCE</Text>
              {loadingImg ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : evidenceUri ? (
                <View>
                  {evidenceUri.toLowerCase().includes('.pdf') ? (
                    <TouchableOpacity testID="btn-view-statutory-pdf" style={styles.pdfCard} onPress={() => openEvidence()}>
                      <Ionicons name="document-text" size={32} color="#FF4D4F" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.pdfText}>View Statutory PDF</Text>
                        <Text style={styles.pdfSub}>Touch to Open Document</Text>
                      </View>
                      <Ionicons name="open-outline" size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity testID="btn-view-evidence-img" onPress={() => openEvidence()} style={styles.imageContainer}>
                      <Image 
                        source={{ uri: evidenceUri }} 
                        style={styles.evidenceImage} 
                        resizeMode="cover"
                      />
                      <View style={styles.expandOverlay}>
                        <Ionicons name="expand" size={14} color="#fff" />
                        <Text style={styles.expandText}>Tap to Verify</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.noEvidence}>
                  <Ionicons name="cloud-offline-outline" size={24} color={COLORS.lightGray} />
                  <Text style={styles.noEvidenceText}>No valid cloud evidence attached.</Text>
                </View>
              )}
            </View>

            {/* ASSET MAINTENANCE HISTORY SECTION */}
            {viewMode === 'Assets' && (
              <View style={styles.detailSection}>
                <Text style={styles.label}>MAINTENANCE HISTORY (TRAIL)</Text>
                {loadingHistory ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                ) : history.length > 0 ? (
                  history.map((log, index) => (
                    <View key={log.id} style={[styles.historyRow, index !== history.length -1 && styles.historyBorder]}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyDate}>{new Date(log.service_date).toLocaleDateString('en-GB')}</Text>
                        <Text style={styles.historyType}>{log.service_type || 'Maintenance'}</Text>
                      </View>
                      <Text style={styles.historyNotes}>{log.notes || 'Routine check performed.'}</Text>
                      {log.certificate_url && (
                        <TouchableOpacity 
                          testID={`btn-view-certificate-${index}`}
                          style={styles.historyLink} 
                          onPress={() => {
                            const { data } = supabase.storage.from('incident-evidence').getPublicUrl(log.certificate_url);
                            openEvidence(data.publicUrl);
                          }}
                        >
                          <Ionicons name="attach" size={14} color={COLORS.primary} />
                          <Text style={styles.historyLinkText}>View Certificate</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.historyBy}>By: {log.signature_url || 'Specialist'}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No past service records found for this asset.</Text>
                )}
              </View>
            )}

            {/* COMPLETION DATA FOR INCIDENTS/ACCIDENTS */}
            {viewMode !== 'Assets' && (selectedItem?.status === 'Resolved' || selectedItem?.injury_description) && (
              <View style={styles.detailSection}>
                <Text style={styles.label}>COMPLETION DATA</Text>
                
                {selectedItem?.injury_description && (
                   <>
                    <Text style={styles.subLabel}>INJURY DESCRIPTION</Text>
                    <Text style={styles.notesText} testID="audit-injury-desc">{selectedItem.injury_description}</Text>
                    <Text style={styles.subLabel}>TREATMENT</Text>
                    <Text style={styles.notesText}>{selectedItem.treatment_given || 'None recorded'}</Text>
                   </>
                )}

                {selectedItem?.resolution_notes && (
                  <>
                    <Text style={styles.subLabel}>RESOLUTION NOTES</Text>
                    <Text style={styles.notesText} testID="audit-resolution-notes">{selectedItem.resolution_notes}</Text>
                  </>
                )}

                {selectedItem?.remedial_actions && (
                  <>
                    <Text style={[styles.subLabel, { marginTop: 10 }]}>REMEDIAL ACTIONS</Text>
                    <Text style={styles.notesText}>{selectedItem.remedial_actions}</Text>
                  </>
                )}

                <View style={styles.divider} />
                <Text style={styles.auditMeta}>
                  Audited By: { selectedItem?.signed_by_name || selectedItem?.signed_off_by || 'Verified Specialist'}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {viewMode !== 'Analytics' && (
        <TouchableOpacity 
          testID="btn-export-audit-pdf"
          style={styles.exportBtn} 
          onPress={() => auditService.generateAuditPDF(viewMode, viewMode === 'Assets' ? filteredAssets : filteredIncidents, viewMode === 'Assets')}
        >
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
  container: { flex: 1, backgroundColor: '#F4F7FA' },
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
  searchBar: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15, marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: '#E1E6ED', color: '#000' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: COLORS.primary, textTransform: 'uppercase' },
  chartStyle: { borderRadius: 16, marginVertical: 8 },
  logCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, marginHorizontal: 20, ...SHADOWS.light, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logDate: { fontSize: 10, color: COLORS.textLight, fontWeight: '800' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  pillTxt: { color: '#fff', fontSize: 9, fontWeight: '900' },
  logDesc: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  logLoc: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  closeTxt: { color: COLORS.secondary, fontWeight: '900' },
  detailSection: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, ...SHADOWS.light, borderWidth: 1, borderColor: '#E1E6ED' },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginBottom: 12, letterSpacing: 1 },
  subLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, marginBottom: 5, textTransform: 'uppercase' },
  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  timeInfo: { marginLeft: 10 },
  timeLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textLight },
  timeValue: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  value: { fontSize: 16, color: COLORS.primary, fontWeight: '700', lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  imageContainer: { borderRadius: 10, overflow: 'hidden', position: 'relative', marginTop: 5, backgroundColor: '#f0f0f0' },
  evidenceImage: { width: '100%', height: 250 },
  expandOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  expandText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  pdfCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF1F0', borderRadius: 10, borderWidth: 1, borderColor: '#FFA39E' },
  pdfText: { fontSize: 14, fontWeight: '700', color: '#CF1322' },
  pdfSub: { fontSize: 10, color: '#CF1322', opacity: 0.6 },
  noEvidence: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C4CDD5' },
  noEvidenceText: { color: COLORS.lightGray, fontSize: 12, marginTop: 5 },
  exportBtn: { margin: 20, backgroundColor: '#00C853', padding: 18, borderRadius: 12, alignItems: 'center', ...SHADOWS },
  exportTxt: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  notesText: { fontSize: 13, color: COLORS.text, lineHeight: 18, backgroundColor: '#F4F7FA', padding: 12, borderRadius: 8, marginBottom: 10, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E1E6ED', marginVertical: 15 },
  auditMeta: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase' },
  emptyTxt: { textAlign: 'center', marginTop: 50, color: COLORS.textLight, fontWeight: '600' },
  historyRow: { paddingVertical: 12 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  historyDate: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  historyType: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  historyNotes: { fontSize: 12, color: '#666', lineHeight: 18 },
  historyBy: { fontSize: 10, color: COLORS.textLight, marginTop: 4, fontStyle: 'italic' },
  historyLink: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  historyLinkText: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', marginLeft: 4, textDecorationLine: 'underline' },
  noHistoryText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginVertical: 10 }
});