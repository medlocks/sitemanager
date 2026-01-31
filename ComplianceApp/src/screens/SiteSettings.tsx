import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { settingsService, SiteSettingsData } from '../services/settingsService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const SiteSettings = () => {
  const [loading, setLoading] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [minClearance, setMinClearance] = useState('None');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setStrictMode(data.strict_mode);
      setMinClearance(data.global_min_clearance);
    } catch (error: any) {
      Alert.alert("Sync Error", "Could not load security protocols: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updateSettings({
        strict_mode: strictMode,
        global_min_clearance: minClearance
      });
      Alert.alert("Success", "Global security protocols updated and applied to all future assignments.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Site Security Protocols</Text>
      <Text style={styles.instruction}>Define the mandatory compliance floor for all external contractors.</Text>
      
      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Strict Compliance Mode</Text>
          <Text style={styles.subLabel}>Block assignments if DBS is missing or specialisms are unverified.</Text>
        </View>
        <Switch 
          value={strictMode} 
          onValueChange={setStrictMode}
          trackColor={{ false: "#767577", true: COLORS.success }}
        />
      </View>

      <Text style={styles.sectionTitle}>Global Minimum Clearance</Text>
      <View style={styles.clearanceGrid}>
        {['None', 'BPSS', 'SC', 'DV'].map(level => (
          <TouchableOpacity 
            key={level} 
            style={[styles.chip, minClearance === level && styles.chipActive]}
            onPress={() => setMinClearance(level)}
          >
            <Text style={[styles.chipText, minClearance === level && {color: '#fff'}]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>APPLY PROTOCOLS</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.m,
  },
  header: {
    ...TYPOGRAPHY.header,
    color: COLORS.primary,
    marginBottom: 4,
  },
  instruction: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.l,
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.m,
    ...SHADOWS.light,
  },
  label: {
    ...TYPOGRAPHY.subheader,
    fontSize: 16,
    color: COLORS.text,
  },
  subLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
    paddingRight: 10,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    letterSpacing: 1,
  },
  clearanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: COLORS.white,
    minWidth: '22%',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  saveBtn: {
    backgroundColor: COLORS.success,
    padding: SPACING.m,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto', 
    marginBottom: SPACING.l,
    ...SHADOWS.light,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});