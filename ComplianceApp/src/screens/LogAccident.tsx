import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { accidentService } from '../services/accidentService';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

export const LogAccident = ({ navigation }: any) => {
  const { user } = useAuth();
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
      await accidentService.logAccident({ ...form, user_id: user?.id });
      Alert.alert("Success", "Accident logged in the statutory book.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statutory Accident Book</Text>
      
      <Text style={styles.label}>Name of Injured Person</Text>
      <TextInput style={styles.input} value={form.injured_person_name} onChangeText={(v) => setForm({...form, injured_person_name: v})} />

      <Text style={styles.label}>Location of Accident</Text>
      <TextInput style={styles.input} value={form.location} onChangeText={(v) => setForm({...form, location: v})} />

      <Text style={styles.label}>Description of Injury & Event</Text>
      <TextInput style={[styles.input, {height: 100}]} multiline value={form.injury_description} onChangeText={(v) => setForm({...form, injury_description: v})} />

      <View style={styles.switchRow}>
        <Text style={styles.label}>RIDDOR Reportable?</Text>
        <Switch value={form.is_riddor_reportable} onValueChange={(v) => setForm({...form, is_riddor_reportable: v})} />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>SUBMIT ENTRY</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { ...TYPOGRAPHY.header, color: COLORS.secondary, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  btn: { backgroundColor: COLORS.secondary, padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});