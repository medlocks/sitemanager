import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextStyle, ViewStyle } from 'react-native';
import { ServiceReport } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

const REGULATORY_SERVICES: ServiceReport[] = [
  { id: 'S1', type: 'TR19_DUCTWORK', assetName: 'Kitchen Extract System', regulation: 'BS EN 15780 / TR19', lastServiceDate: '2025-11-10', nextServiceDueDate: '2026-05-10', status: 'Compliant' },
  { id: 'S2', type: 'GAS_SAFETY', assetName: 'Main Boiler House', regulation: 'Gas Safety (Installation and Use) Regs', lastServiceDate: '2025-01-15', nextServiceDueDate: '2026-01-15', status: 'Urgent Action' },
  { id: 'S3', type: 'HVAC', assetName: 'Server Room F-Gas', regulation: 'F-Gas Regulation (EU) 517/2014', lastServiceDate: '2025-06-01', nextServiceDueDate: '2026-06-01', status: 'Compliant' },
  { id: 'S4', type: 'FIRE_SAFETY', assetName: 'Sprinkler System', regulation: 'BS 9251:2021', lastServiceDate: '2025-12-20', nextServiceDueDate: '2026-12-20', status: 'Compliant' },
  { id: 'S5', type: 'TR19_DUCTWORK', assetName: 'AHU Supply Ducting', regulation: 'BS EN 15780 Hygiene Class B', lastServiceDate: '2024-01-01', nextServiceDueDate: '2025-01-01', status: 'Overdue' }
];

export const BuildingServices = () => {
  const [services] = useState<ServiceReport[]>(REGULATORY_SERVICES);

  useEffect(() => {
    const overdue = services.filter(s => s.status !== 'Compliant').length;
    if (overdue > 0) {
      Alert.alert(
        "Legal Risk Alert", 
        `You have ${overdue} services failing BS EN 15780 or Gas Safety standards. High risk of non-compliance fines.`
      );
    }
  }, [services]);

  const renderService = ({ item }: { item: ServiceReport }) => {
    const isCompliant = item.status === 'Compliant';

    return (
      <View style={[
        styles.card, 
        isCompliant ? { borderColor: COLORS.success } : { borderColor: COLORS.secondary }
      ]}>
        <View style={styles.headerRow}>
          <Text style={styles.typeTag}>{item.type.replace('_', ' ')}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isCompliant ? COLORS.success : COLORS.secondary }
          ]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.assetTitle}>{item.assetName}</Text>
        <Text style={styles.regText}>Regulation: {item.regulation}</Text>
        
        <View style={styles.dateGrid}>
          <View>
            <Text style={styles.dateLabel}>Last Inspected</Text>
            <Text style={styles.dateValue}>{item.lastServiceDate}</Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Next Due</Text>
            <Text style={[
              styles.dateValue, 
              !isCompliant && { color: COLORS.secondary }
            ]}>
              {item.nextServiceDueDate}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.btnText}>View Certificate & Cleaning Records</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Statutory Building Compliance</Text>
      <FlatList 
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        contentContainerStyle={{ paddingBottom: SPACING.l }}
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
  mainTitle: { 
    ...TYPOGRAPHY.header,
    marginBottom: SPACING.l, 
    textTransform: 'uppercase' 
  } as TextStyle,
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    padding: SPACING.m, 
    marginBottom: SPACING.m, 
    borderWidth: 1.5,
    ...SHADOWS.light 
  } as ViewStyle,
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.s 
  } as ViewStyle,
  typeTag: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: COLORS.primary 
  } as TextStyle,
  statusBadge: { 
    paddingHorizontal: SPACING.s, 
    paddingVertical: 4, 
    borderRadius: 6 
  } as ViewStyle,
  badgeText: { 
    color: COLORS.white, 
    fontSize: 10, 
    fontWeight: 'bold' 
  } as TextStyle,
  assetTitle: { 
    ...TYPOGRAPHY.subheader,
    color: COLORS.text 
  } as TextStyle,
  regText: { 
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic', 
    marginTop: 4 
  } as TextStyle,
  dateGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: SPACING.m, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.lightGray, 
    paddingTop: SPACING.s 
  } as ViewStyle,
  dateLabel: { 
    ...TYPOGRAPHY.caption 
  } as TextStyle,
  dateValue: { 
    fontSize: 13, 
    fontWeight: '600',
    color: COLORS.text 
  } as TextStyle,
  actionBtn: { 
    backgroundColor: COLORS.primary, 
    padding: SPACING.s, 
    borderRadius: 8, 
    marginTop: SPACING.m, 
    alignItems: 'center' 
  } as ViewStyle,
  btnText: { 
    color: COLORS.white, 
    fontWeight: 'bold', 
    fontSize: 12 
  } as TextStyle
});