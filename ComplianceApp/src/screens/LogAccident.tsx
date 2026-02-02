import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accidentService } from '../services/accidentService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

export const LogAccident = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    injured_person_name: '',
    location: '',
    injury_description: '',
    treatment_given: '',
    is_riddor_reportable: false,
    date_time: new Date(),
  });

  const handleSubmit = async () => {
    if (!form.injured_person_name || !form.injury_description) {
      return Alert.alert("Required", "Please fill in the injured person's name and injury description.");
    }

    try {
      setLoading(true);
      await accidentService.logAccident({ ...form, user_id: user?.id });

      await notificationService.notifyManagers(
        "CRITICAL: ACCIDENT LOGGED",
        `Statutory entry for ${form.injured_person_name} at ${form.location} logged by ${user?.name}`,
        "ACCIDENT"
      );

      Alert.alert(
        "Entry Sealed", 
        "Accident logged in the statutory book. Site management has been alerted.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Registry Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Statutory Accident Book</Text>
          <Text style={styles.subtitle}>Official RIDDOR-Compliant Registry</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>NAME OF INJURED PERSON</Text>
          <TextInput 
            testID="input-injured-name"
            style={styles.input} 
            value={form.injured_person_name} 
            onChangeText={(v) => setForm({...form, injured_person_name: v})} 
            placeholder="Full Name"
          />

          <Text style={styles.label}>LOCATION OF ACCIDENT</Text>
          <TextInput 
            testID="input-accident-location"
            style={styles.input} 
            value={form.location} 
            onChangeText={(v) => setForm({...form, location: v})} 
            placeholder="e.g. Workshop B"
          />

          <Text style={styles.label}>DESCRIPTION OF INJURY & EVENT</Text>
          <TextInput 
            testID="input-injury-description"
            style={[styles.input, {height: 100}]} 
            multiline 
            value={form.injury_description} 
            onChangeText={(v) => setForm({...form, injury_description: v})} 
            textAlignVertical="top"
            placeholder="Detailed account of incident..."
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>RIDDOR REPORTABLE?</Text>
              <Text style={styles.hint}>Does this require HSE notification?</Text>
            </View>
            <Switch 
              testID="switch-riddor"
              value={form.is_riddor_reportable} 
              onValueChange={(v) => setForm({...form, is_riddor_reportable: v})} 
              trackColor={{ false: "#D1D5DB", true: COLORS.secondary }}
            />
          </View>

          <TouchableOpacity 
            testID="btn-submit-accident"
            style={[styles.btn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "SEALING RECORD..." : "SUBMIT OFFICIAL ENTRY"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FA' },
  content: { padding: 20 },
  header: { marginBottom: 25 },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, fontSize: 22 },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textLight, marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: '#E1E6ED'
  },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 8, letterSpacing: 0.5 },
  hint: { fontSize: 10, color: COLORS.textLight, marginTop: -4, marginBottom: 8 },
  input: { 
    backgroundColor: '#F8F9FB', 
    borderWidth: 1, 
    borderColor: '#E1E6ED', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 20,
    fontSize: 15,
    color: COLORS.text 
  },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#F0F4F8',
    borderRadius: 12
  },
  btn: { 
    backgroundColor: COLORS.secondary, 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    ...SHADOWS.light 
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});