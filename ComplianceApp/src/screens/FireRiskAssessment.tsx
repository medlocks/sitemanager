import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  TextStyle, 
  ViewStyle,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { incidentService } from '../services/incidentService';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const FireRiskAssessment = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState({
    exitsClear: false,
    extinguishersPresent: false,
    alarmsFunctional: false,
    signageVisible: false,
    noCombustibles: false
  });

  const handleSubmission = async () => {
    const failedChecks = Object.values(checks).filter(val => val === false).length;
    const statusLabel = failedChecks === 0 ? 'PASS' : 'FAIL - ACTION REQUIRED';
    const incidentStatus = failedChecks === 0 ? 'Pending' : 'High Risk';
    
    const description = `Daily FRA Completed. Safety Status: ${statusLabel}. Issues: ${
      failedChecks === 0 ? 'None' : 'Statutory failures detected during walkthrough.'
    }`;

    try {
      setLoading(true);
      await incidentService.createIncident(
        description, 
        "Site-Wide Walkthrough", 
        undefined, 
        user?.id, 
        incidentStatus
      );

      if (failedChecks > 0) {
        Alert.alert(
          "High Risk Detected", 
          "One or more fire safety checks failed. An urgent incident report has been logged in the Live Audit Vault."
        );
      } else {
        Alert.alert(
          "Site Compliant", 
          "Daily Fire Risk Assessment logged successfully to live database."
        );
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Sync Failure", "Could not upload FRA log: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Daily Fire Risk Assessment</Text>
      <Text style={styles.subtitle}>Statutory Walkthrough</Text>

      <View style={styles.listContainer}>
        <View style={styles.checkItem}>
          <Text style={styles.label}>All Fire Exits Clear & Unlocked?</Text>
          <Switch 
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            value={checks.exitsClear} 
            onValueChange={(v) => setChecks({...checks, exitsClear: v})} 
          />
        </View>

        <View style={styles.checkItem}>
          <Text style={styles.label}>Extinguishers In-Place & Serviced?</Text>
          <Switch 
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            value={checks.extinguishersPresent} 
            onValueChange={(v) => setChecks({...checks, extinguishersPresent: v})} 
          />
        </View>

        <View style={styles.checkItem}>
          <Text style={styles.label}>Fire Alarm Panel Clear / No Faults?</Text>
          <Switch 
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            value={checks.alarmsFunctional} 
            onValueChange={(v) => setChecks({...checks, alarmsFunctional: v})} 
          />
        </View>

        <View style={styles.checkItem}>
          <Text style={styles.label}>Emergency Signage Illuminated?</Text>
          <Switch 
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            value={checks.signageVisible} 
            onValueChange={(v) => setChecks({...checks, signageVisible: v})} 
          />
        </View>

        <View style={styles.checkItem}>
          <Text style={styles.label}>No Combustible Waste Accumulation?</Text>
          <Switch 
            trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
            thumbColor={COLORS.white}
            value={checks.noCombustibles} 
            onValueChange={(v) => setChecks({...checks, noCombustibles: v})} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
        onPress={handleSubmission}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.btnText}>Submit Verified FRA Log</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.l, 
    backgroundColor: COLORS.white 
  } as ViewStyle,
  title: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.secondary 
  } as TextStyle,
  subtitle: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 12, 
    marginBottom: SPACING.xl 
  } as TextStyle,
  listContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.s,
    ...SHADOWS.light
  } as ViewStyle,
  checkItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.m, 
    paddingHorizontal: SPACING.s,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray 
  } as ViewStyle,
  label: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.text, 
    flex: 0.8 
  } as TextStyle,
  submitBtn: { 
    backgroundColor: COLORS.secondary, 
    padding: SPACING.m, 
    borderRadius: 10, 
    marginTop: SPACING.xl, 
    alignItems: 'center',
    marginBottom: SPACING.xl 
  } as ViewStyle,
  btnText: { 
    color: COLORS.white, 
    fontWeight: 'bold', 
    fontSize: 16 
  } as TextStyle
});