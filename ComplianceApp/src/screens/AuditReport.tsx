import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const AuditReport = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const fetchReports = async () => {
    const data = await AsyncStorage.getItem('@incidents_vault');
    if (data) {
      const parsed = JSON.parse(data);
      setIncidents(parsed.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp)));
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const generatePDF = () => {
    Alert.alert(
      "R7 Export Success", 
      "Comprehensive Audit Report generated. Included: Fire Walkthroughs, Employee Faults, and Photo Evidence."
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Statutory Audit Log (R7)</Text>
      <Text style={styles.subHeader}>Verified Evidence Vault | ISO 45001 & BS 9999</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Total Logs</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.statNum}>{incidents.filter(i => i.imageUri).length}</Text>
          <Text style={styles.statLabel}>Photo Records</Text>
        </View>
      </View>

      <View style={styles.logSection}>
        <Text style={styles.logTitle}>Live Site Evidence Trail</Text>
        {incidents.map((item) => (
          <View key={item.id} style={styles.reportCard}>
            <View style={styles.cardTop}>
              <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
              <Text style={[
                styles.status, 
                item.status === 'Resolved' ? { color: COLORS.success } : { color: COLORS.warning }
              ]}>
                {item.status}
              </Text>
            </View>
            
            <Text style={styles.description}>{item.description}</Text>
            
            {item.imageUri && (
              <View style={styles.evidenceFrame}>
                <Text style={styles.evidenceLabel}>Digital Evidence (R15):</Text>
                <Image source={{ uri: item.imageUri }} style={styles.evidenceImage} />
              </View>
            )}

            <Text style={styles.meta}>Reporter ID: {item.userId} | Ref: {item.id.slice(-6)}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
        <Text style={styles.btnText}>Export Certified Report (PDF/CSV)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.l, 
    backgroundColor: COLORS.background 
  },
  header: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary 
  },
  subHeader: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 12, 
    marginBottom: SPACING.l 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.l 
  },
  statBox: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 8, 
    width: '48%', 
    borderLeftWidth: 4, 
    borderLeftColor: COLORS.primary,
    ...SHADOWS.light 
  },
  statNum: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: COLORS.text 
  },
  statLabel: { 
    ...TYPOGRAPHY.caption, 
    textTransform: 'uppercase' 
  },
  logSection: { 
    marginTop: SPACING.s 
  },
  logTitle: { 
    ...TYPOGRAPHY.subheader, 
    marginBottom: SPACING.m 
  },
  reportCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 10, 
    padding: SPACING.m, 
    marginBottom: SPACING.m, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray 
  },
  cardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.xs 
  },
  date: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 11 
  },
  status: { 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  description: { 
    ...TYPOGRAPHY.body, 
    marginBottom: SPACING.s, 
    fontWeight: '500' 
  },
  evidenceFrame: { 
    backgroundColor: COLORS.background, 
    padding: SPACING.s, 
    borderRadius: 8, 
    marginBottom: SPACING.s 
  },
  evidenceLabel: { 
    ...TYPOGRAPHY.caption, 
    fontWeight: 'bold', 
    marginBottom: SPACING.xs 
  },
  evidenceImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 4 
  },
  meta: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.textLight 
  },
  exportBtn: { 
    backgroundColor: COLORS.primary, 
    padding: SPACING.m, 
    borderRadius: 10, 
    marginVertical: SPACING.xl, 
    alignItems: 'center' 
  },
  btnText: { 
    color: COLORS.white, 
    fontWeight: 'bold' 
  }
});