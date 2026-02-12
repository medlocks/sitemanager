import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, TOUCH_TARGETS } from '../theme';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyModal = ({ visible, onClose }: PrivacyModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} accessibilityViewIsModal={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              <Text style={styles.title} accessibilityRole="header">Statutory Privacy Protocol</Text>
              <Text style={styles.subtitle}>GDPR COMPLIANCE</Text>
              
              <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.sectionTitle} accessibilityRole="header">1. Data Collection & Purpose</Text>
                <Text style={styles.bodyText}>
                  We collect professional certifications, incident logs, and site activity data. This is strictly for 
                  UK Statutory Health & Safety compliance and to ensure competence for hazardous site work.
                </Text>

                <Text style={styles.sectionTitle} accessibilityRole="header">2. Secure Storage (R5)</Text>
                <Text style={styles.bodyText}>
                  All evidence is stored in a secure cloud vault using AES-256 encryption at rest. 
                  Data transmission is protected via SSL/TLS protocols.
                </Text>

                <Text style={styles.sectionTitle} accessibilityRole="header">3. Retention Policy</Text>
                <Text style={styles.bodyText}>
                  To satisfy UK HSE requirements, compliance records and incident evidence are retained for a 
                  minimum of 7 years before being scheduled for automated erasure.
                </Text>

                <Text style={styles.sectionTitle} accessibilityRole="header">4. Your Rights</Text>
                <Text style={styles.bodyText}>
                  In accordance with GDPR and internal security protocols, users may request a full export of their personal activity logs and incident reports. 
                  To initiate a Subject Access Request (SAR), please contact the Information Security Office at privacy@privacy.com.
                </Text>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity 
                  testID= "accept-btn"
                  style={styles.closeBtn} 
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="I understand and acknowledge the privacy protocol"
                >
                  <Text testID= "accept-text" style={styles.closeBtnText}>I UNDERSTAND & ACKNOWLEDGE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    padding: SPACING.m 
  },
  modalContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
    ...SHADOWS.light 
  },
  safeArea: {
    flexShrink: 1
  },
  content: { 
    padding: SPACING.l,
    height: '100%'
  },
  title: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary, 
    fontSize: 22,
    textAlign: 'center'
  },
  subtitle: { 
    ...TYPOGRAPHY.caption,
    fontWeight: '900', 
    color: COLORS.secondary, 
    marginBottom: SPACING.m, 
    letterSpacing: 1.5,
    textAlign: 'center'
  },
  scroll: { 
    flex: 1,
    marginBottom: SPACING.m
  },
  scrollContent: {
    paddingBottom: SPACING.m
  },
  sectionTitle: { 
    ...TYPOGRAPHY.body,
    fontWeight: '800', 
    color: COLORS.text, 
    marginBottom: 4, 
    marginTop: 12 
  },
  bodyText: { 
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    lineHeight: 22,
    fontSize: 15
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.m
  },
  closeBtn: { 
    backgroundColor: COLORS.primary, 
    minHeight: 60, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  closeBtnText: { 
    ...TYPOGRAPHY.body,
    color: COLORS.white, 
    fontWeight: '800', 
    letterSpacing: 1 
  }
});