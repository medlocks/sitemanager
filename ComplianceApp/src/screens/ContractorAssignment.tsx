import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextStyle, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident, Contractor } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

const MOCK_CONTRACTORS: Contractor[] = [
  { id: 'CON1', name: 'Dave Sparks', company: 'Volt-Check Ltd', specialism: 'ELECTRICAL', qualifications: [{ id: 'Q1', type: 'NICEIC', expiryDate: '2027-01-01', isValid: true }] },
  { id: 'CON2', name: 'Sarah Vent', company: 'Air-Flow Hygiene', specialism: 'TR19_DUCTWORK', qualifications: [{ id: 'Q2', type: 'TR19 Certified', expiryDate: '2026-05-01', isValid: true }] }
];

export const ContractorAssignment = ({ route, navigation }: any) => {
  const { incidentId } = route.params;
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const fetchIncident = async () => {
      const data = await AsyncStorage.getItem('@incidents_vault');
      if (data) {
        const found = JSON.parse(data).find((i: Incident) => i.id === incidentId);
        setIncident(found);
      }
    };
    fetchIncident();
  }, [incidentId]);

  const assignContractor = async (contractorName: string) => {
    const data = await AsyncStorage.getItem('@incidents_vault');
    if (data) {
      const incidents = JSON.parse(data);
      const updated = incidents.map((i: Incident) => 
        i.id === incidentId ? { ...i, status: 'Assigned', assignedTo: contractorName } : i
      );
      await AsyncStorage.setItem('@incidents_vault', JSON.stringify(updated));
      Alert.alert("Success", `Work order sent to ${contractorName}. Status: Assigned.`);
      navigation.navigate('Dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assign Qualified Contractor</Text>
      
      <View style={styles.incidentBox}>
        <Text style={styles.label}>ISSUE DETAILS:</Text>
        <Text style={styles.value}>{incident?.description}</Text>
      </View>

      <Text style={styles.subTitle}>Verified Specialist Directory</Text>
      <FlatList 
        data={MOCK_CONTRACTORS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => assignContractor(item.name)}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.specialismBadge}>{item.specialism.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.company}>{item.company}</Text>
            <Text style={styles.statusText}>● System Verified & Compliant</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.l, 
    backgroundColor: COLORS.background 
  } as ViewStyle,
  header: { 
    ...TYPOGRAPHY.header, 
    marginBottom: SPACING.l 
  } as TextStyle,
  incidentBox: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 8, 
    marginBottom: SPACING.xl, 
    borderLeftWidth: 5, 
    borderLeftColor: COLORS.warning,
    ...SHADOWS.light 
  } as ViewStyle,
  label: { 
    ...TYPOGRAPHY.caption, 
    fontWeight: 'bold', 
    color: COLORS.gray 
  } as TextStyle,
  value: { 
    ...TYPOGRAPHY.body, 
    marginTop: SPACING.xs,
    color: COLORS.text 
  } as TextStyle,
  subTitle: { 
    ...TYPOGRAPHY.subheader, 
    fontSize: 14, 
    marginBottom: SPACING.m 
  } as TextStyle,
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 8, 
    marginBottom: SPACING.m, 
    borderRightWidth: 5, 
    borderRightColor: COLORS.success,
    ...SHADOWS.light 
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs
  } as ViewStyle,
  name: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: COLORS.text 
  } as TextStyle,
  specialismBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  } as TextStyle,
  company: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 12,
    marginBottom: SPACING.s 
  } as TextStyle,
  statusText: { 
    fontSize: 10, 
    color: COLORS.success, 
    fontWeight: 'bold' 
  } as TextStyle
});