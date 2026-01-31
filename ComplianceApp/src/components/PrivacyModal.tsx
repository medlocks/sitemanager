import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyModal = ({ visible, onClose }: PrivacyModalProps) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Statutory Privacy Protocol</Text>
            <Text style={styles.subtitle}>GDPR Compliance</Text>
            
            <ScrollView style={styles.scroll}>
              <Text style={styles.sectionTitle}>1. Data Collection & Purpose</Text>
              <Text style={styles.bodyText}>
                We collect professional certifications, incident logs, and site activity data. This is strictly for 
                UK Statutory Health & Safety compliance and to ensure competence for hazardous site work.
              </Text>

              <Text style={styles.sectionTitle}>2. Secure Storage (R5)</Text>
              <Text style={styles.bodyText}>
                All evidence is stored in a secure cloud vault using AES-256 encryption at rest. 
                Data transmission is protected via SSL/TLS protocols.
              </Text>

              <Text style={styles.sectionTitle}>3. Retention Policy</Text>
              <Text style={styles.bodyText}>
                To satisfy UK HSE requirements, compliance records and incident evidence are retained for a 
                minimum of 7 years before being scheduled for automated erasure.
              </Text>

              <Text style={styles.sectionTitle}>4. Your Rights</Text>
              <Text style={styles.bodyText}>
                You have the right to data portability. You can export your data in JSON format from the 
                Contractor Profile screen at any time. For "Right to be Forgotten" requests, contact the 
                Site Manager.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>I UNDERSTAND & ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: COLORS.white, borderRadius: 15, maxHeight: '80%', ...SHADOWS.light },
  content: { padding: 25 },
  title: { ...TYPOGRAPHY.header, fontSize: 20, color: COLORS.primary, marginBottom: 5 },
  subtitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 20, letterSpacing: 1 },
  scroll: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: 5, marginTop: 15 },
  bodyText: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },
  closeBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: COLORS.white, fontWeight: 'bold', letterSpacing: 1 }
});