import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, TOUCH_TARGETS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

export const EmployeeDashboard = ({ navigation }: Props) => {
  const { user } = useAuth();
  const menuItems = [
    { id: '1', title: 'Report Fault / Hazard', icon: 'alert-circle-outline', screen: 'FaultReporting' },
    { id: '2', title: 'Log Statutory Accident', icon: 'medical-outline', screen: 'LogAccident' },
  ];

  return (
    <ScrollView 
      contentContainerStyle={styles.content}
    >
      <View style={styles.hero} accessibilityRole="summary">
        <Text style={styles.greeting}>ACCESS LEVEL: {user?.role}</Text>
        <Text style={styles.name} accessibilityRole="header">{user?.name}</Text>
        <Text style={styles.subtext}>Use the options below to log an accident or report a hazard.</Text>
      </View>

      <View style={styles.grid} accessibilityRole="menu">
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            testID={`menu-item-${item.screen}`}
            style={styles.card} 
            onPress={() => navigation.navigate(item.screen)}
            accessibilityRole="menuitem"
            accessibilityLabel={item.title}
            accessibilityHint={`Mapss to the ${item.title} screen`}
          >
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.cardText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray}/>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.l },
  hero: { marginBottom: SPACING.xl, paddingLeft: 5 },
  greeting: { 
    ...TYPOGRAPHY.caption, 
    fontWeight: '800', 
    color: COLORS.secondary, 
    letterSpacing: 1.5 
  },
  name: { 
    ...TYPOGRAPHY.header, 
    fontSize: 28, 
    color: COLORS.primary, 
    marginTop: 4 
  },
  subtext: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.textLight, 
    marginTop: 8,
    lineHeight: 20 
  },
  grid: { gap: SPACING.m },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.min * 2,
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: COLORS.lightGray
  },
  iconBox: { 
    width: 60, 
    height: 60, 
    backgroundColor: COLORS.background, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.m 
  },
  cardText: { 
    flex: 1, 
    ...TYPOGRAPHY.body, 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.primary 
  }
});