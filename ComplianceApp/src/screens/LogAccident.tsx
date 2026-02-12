import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { accidentService } from '../services/accidentService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, TOUCH_TARGETS } from '../theme';

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
    if (!form.injured_person_name || !form.injury_description || !form.location) {
      return Alert.alert("Required Fields", "Please provide the name, location, and a description of the injury.");
    }

    if (!user?.id) {
      return Alert.alert("Error", "Authentication required. Please log in again.");
    }

    try {
      setLoading(true);

      const result = await accidentService.logAccident({ 
        user_id: user.id,
        date_time: form.date_time.toISOString(),
        location: form.location,
        injured_person_name: form.injured_person_name,
        injury_description: form.injury_description,
        treatment_given: form.treatment_given,
        is_riddor_reportable: form.is_riddor_reportable,
        status: 'Reported'
      });

      if (!result.success) {
        throw new Error(result.error || "Submission failed");
      }

      await notificationService.notifyManagers(
        "CRITICAL: ACCIDENT LOGGED",
        `Statutory entry for ${form.injured_person_name} at ${form.location} logged by ${user.name || 'User'}`,
        "ACCIDENT"
      );

      Alert.alert(
        "Entry Sealed", 
        "Accident logged in the statutory book. Site management has been alerted.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Registry Error", e.message || "An unexpected error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Statutory Accident Book</Text>
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
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Injured person's full name"
            accessibilityHint="Type the full name of the person who was injured"
          />

          <Text style={styles.label}>LOCATION OF ACCIDENT</Text>
          <TextInput 
            testID="input-accident-location"
            style={styles.input} 
            value={form.location} 
            onChangeText={(v) => setForm({...form, location: v})} 
            placeholder="e.g. Workshop B"
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Location of accident"
            accessibilityHint="Describe the area where the incident occurred"
          />

          <Text style={styles.label}>DESCRIPTION OF INJURY & EVENT</Text>
          <TextInput 
            testID="input-injury-description"
            style={[styles.input, styles.textArea]} 
            multiline 
            value={form.injury_description} 
            onChangeText={(v) => setForm({...form, injury_description: v})} 
            textAlignVertical="top"
            placeholder="Detailed account of incident..."
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Injury and event description"
            accessibilityHint="Provide a detailed account of how the injury happened"
          />

          <Text style={styles.label}>TREATMENT GIVEN (OPTIONAL)</Text>
          <TextInput 
            testID="input-treatment-given"
            style={styles.input} 
            value={form.treatment_given} 
            onChangeText={(v) => setForm({...form, treatment_given: v})} 
            placeholder="e.g. First aid applied on site"
            placeholderTextColor={COLORS.textLight}
            accessibilityLabel="Treatment given"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.label}>RIDDOR REPORTABLE?</Text>
              <Text style={styles.hint}>Does this require HSE notification?</Text>
            </View>
            <Switch 
              testID="switch-riddor"
              value={form.is_riddor_reportable} 
              onValueChange={(v) => setForm({...form, is_riddor_reportable: v})} 
              trackColor={{ false: COLORS.lightGray, true: COLORS.secondary }}
              thumbColor={COLORS.white}
              accessibilityLabel="Is this RIDDOR reportable?"
            />
          </View>

          <TouchableOpacity 
            testID="btn-submit-accident"
            style={[styles.btn, loading && styles.btnDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Submit official accident entry"
            accessibilityHint="Seals the record in the statutory accident book and notifies management"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="large" />
            ) : (
              <Text style={styles.btnText}>SUBMIT OFFICIAL ENTRY</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.m },
  header: { marginBottom: SPACING.l },
  title: { 
    ...TYPOGRAPHY.header, 
    fontSize: 24, 
    color: COLORS.primary 
  },
  subtitle: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.textLight, 
    fontWeight: '800', 
    marginTop: 4, 
    letterSpacing: 1 
  },
  formCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: COLORS.lightGray
  },
  label: { 
    ...TYPOGRAPHY.caption, 
    fontWeight: '900', 
    color: COLORS.primary, 
    marginBottom: 8, 
    letterSpacing: 0.5 
  },
  hint: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.textLight, 
    fontSize: 12, 
    marginTop: -4, 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: COLORS.background, 
    borderWidth: 2, 
    borderColor: COLORS.lightGray, 
    padding: SPACING.m, 
    borderRadius: 12, 
    marginBottom: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
    minHeight: TOUCH_TARGETS.min
  },
  textArea: { height: 120 },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.xl,
    padding: SPACING.m,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    minHeight: TOUCH_TARGETS.min
  },
  switchTextContainer: { flex: 1, paddingRight: 10 },
  btn: { 
    backgroundColor: COLORS.secondary, 
    minHeight: 65, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light 
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { 
    color: COLORS.white, 
    fontWeight: '900', 
    fontSize: 18, 
    letterSpacing: 1 
  }
});