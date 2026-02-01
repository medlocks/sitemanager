import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ActivityIndicator, 
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const IncidentDetail = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { incident } = route.params;
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceUri, setEvidenceUri] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Manager') {
      Alert.alert("Security Block", "Only Site Managers may access statutory evidence dossiers.");
      navigation.goBack();
      return;
    }

    const fetchData = async () => {
      if (incident.assigned_contractor_id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', incident.assigned_contractor_id)
          .single();
        setContractor(data);
      }

      const rawPath = incident.image_url || incident.evidence_url;
      if (rawPath && !rawPath.startsWith('file://')) {
        if (rawPath.startsWith('http')) {
          setEvidenceUri(rawPath);
        } else {
          const { data } = supabase.storage
            .from('incident-evidence')
            .getPublicUrl(rawPath);
          
          if (data?.publicUrl) {
            setEvidenceUri(`${data.publicUrl}?t=${new Date().getTime()}`);
          }
        }
      } else {
        setImgError(true);
      }
      
      setLoading(false);
      setLoadingImg(false);
    };

    fetchData();
  }, [incident, user]);

  const isResolved = incident.status === 'Resolved';
  const isPdf = evidenceUri?.toLowerCase().includes('.pdf');

  const handleAssignment = () => {
    navigation.navigate('ContractorAssignment', { incidentId: incident.id });
  };

  const openEvidence = () => {
    if (evidenceUri) {
      Linking.openURL(evidenceUri).catch(() => {
        Alert.alert("Error", "Unable to open evidence file.");
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'PENDING';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (user?.role !== 'Manager') return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.statusHeader}>
          <View style={[styles.badge, { backgroundColor: isResolved ? '#00C853' : '#FFAB00' }]}>
            <Text style={styles.badgeText}>{incident.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.timestamp}>REF: {incident.id.slice(0, 8)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>STATUTORY AUDIT TIMELINE</Text>
          <View style={styles.timelineItem}>
            <Ionicons name="radio-button-on" size={14} color={COLORS.secondary} />
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>LOGGED BY STAFF</Text>
              <Text style={styles.timeValue}>{formatDate(incident.created_at)}</Text>
            </View>
          </View>
          
          {isResolved && (
            <View style={[styles.timelineItem, { marginTop: 15 }]}>
              <Ionicons name="checkmark-circle" size={14} color="#00C853" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>RESOLVED & SIGNED OFF</Text>
                <Text style={styles.timeValue}>{formatDate(incident.resolved_at)}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>HAZARD DESCRIPTION</Text>
          <Text style={styles.value}>{incident.description}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.textLight} />
            <Text style={styles.locationText}>{incident.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>DIGITAL EVIDENCE</Text>
          {loadingImg ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (evidenceUri && !imgError) ? (
            <View>
              {isPdf ? (
                <TouchableOpacity style={styles.pdfCard} onPress={openEvidence}>
                  <Ionicons name="document-text" size={32} color="#FF4D4F" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.pdfText}>View Statutory PDF</Text>
                    <Text style={styles.pdfSub}>Touch to Open Document</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={openEvidence} style={styles.imageContainer}>
                  <Image 
                    source={{ uri: evidenceUri }} 
                    style={styles.evidenceImage} 
                    resizeMode="cover"
                    onError={() => setImgError(true)}
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
              <Text style={styles.noEvidenceText}>No valid cloud evidence found.</Text>
            </View>
          )}
        </View>

        {isResolved ? (
          <View style={styles.section}>
            <Text style={styles.label}>CONTRACTOR COMPLETION REPORT</Text>
            
            <Text style={styles.subLabel}>RESOLUTION NOTES</Text>
            <Text style={styles.notesText}>{incident.resolution_notes || "No notes provided."}</Text>

            <Text style={[styles.subLabel, { marginTop: 15 }]}>REMEDIAL ACTIONS TAKEN</Text>
            <Text style={styles.notesText}>{incident.remedial_actions || "No further actions required."}</Text>
            
            <View style={styles.divider} />
            <Text style={styles.auditMeta}>Signed by: {incident.signed_off_by || contractor?.name || 'Assigned Specialist'}</Text>
          </View>
        ) : (
          <View style={styles.section}>
             <Text style={styles.label}>MANAGEMENT CONTROLS</Text>
             <TouchableOpacity style={styles.assignBtn} onPress={handleAssignment}>
                <Text style={styles.assignBtnText}>
                  {contractor ? `REASSIGN (${contractor.name})` : "ASSIGN SPECIALIST"}
                </Text>
              </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  content: { padding: 20 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  timestamp: { fontSize: 11, color: COLORS.textLight, fontWeight: '700' },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, ...SHADOWS.light, borderWidth: 1, borderColor: '#E1E6ED' },
  label: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginBottom: 12, letterSpacing: 1 },
  subLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, marginBottom: 5, textTransform: 'uppercase' },
  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  timeInfo: { marginLeft: 10 },
  timeLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textLight },
  timeValue: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  value: { fontSize: 15, color: COLORS.primary, fontWeight: '600', lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  imageContainer: { borderRadius: 10, overflow: 'hidden', position: 'relative', marginTop: 5, backgroundColor: '#f0f0f0' },
  evidenceImage: { width: '100%', height: 220 },
  expandOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  expandText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  pdfCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF1F0', borderRadius: 10, borderWidth: 1, borderColor: '#FFA39E' },
  pdfText: { fontSize: 14, fontWeight: '700', color: '#CF1322' },
  pdfSub: { fontSize: 10, color: '#CF1322', opacity: 0.6 },
  noEvidence: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C4CDD5' },
  noEvidenceText: { color: COLORS.lightGray, fontSize: 12, marginTop: 5 },
  loaderBox: { height: 100, justifyContent: 'center', alignItems: 'center' },
  assignBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  notesText: { fontSize: 14, color: COLORS.text, lineHeight: 20, backgroundColor: '#F8F9FB', padding: 12, borderRadius: 8, marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E1E6ED', marginVertical: 15 },
  auditMeta: { fontSize: 11, fontWeight: '700', color: COLORS.secondary }
});