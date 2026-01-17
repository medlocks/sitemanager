import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, Button, TextStyle, ViewStyle } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from './src/theme';

import { Dashboard } from './src/screens/Dashboard';
import { ContractorWorkOrders } from './src/screens/ContractorWorkOrders';
import { FaultReporting } from './src/screens/FaultReporting';
import { FireRiskAssessment } from './src/screens/FireRiskAssessment';
import { BuildingServices } from './src/screens/BuildingServices';
import { QualificationTracker } from './src/screens/QualificationTracker';
import { AuditReport } from './src/screens/AuditReport';
import { ContractorAssignment } from './src/screens/ContractorAssignment';
import { LogIncident } from './src/screens/LogIncident';

const Stack = createNativeStackNavigator();

const LoginScreen = () => {
  const { login } = useAuth();

  return (
    <View style={styles.center}>
      <Text style={styles.brand}>Raytheon</Text>
      <Text style={styles.title}>Compliance System</Text>
      <Text style={styles.subtitle}>Secure Site Access Portal</Text>
      
      <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary }]} onPress={() => login('SiteManager')}>
        <Text style={styles.btnText}>Login as Site Manager</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.gray }]} onPress={() => login('Contractor')}>
        <Text style={styles.btnText}>Login as Contractor</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.accent }]} onPress={() => login('Employee')}>
        <Text style={styles.btnText}>Login as Employee (Report Fault)</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v2.0 | Bulletproof Compliance Logic</Text>
    </View>
  );
};

const AuthenticatedApp = () => {
  const { user, logout } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerRight: () => <Button title="Logout" onPress={logout} color={COLORS.secondary} />,
          headerStyle: { backgroundColor: COLORS.background },
          headerTitleStyle: { 
            fontWeight: 'bold', 
            fontSize: 16, 
            color: COLORS.primary 
          }
        }}
      >
        {user?.role === 'SiteManager' || user?.role === 'Employee' ? (
          <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Raytheon Command' }} />
        ) : (
          <Stack.Screen name="ContractorDashboard" component={ContractorWorkOrders} options={{ title: 'Contractor Portal' }} />
        )}
        
        <Stack.Screen name="ContractorAssignment" component={ContractorAssignment} options={{ title: 'Assign Specialist' }} />
        <Stack.Screen name="FireRiskAssessment" component={FireRiskAssessment} options={{ title: 'Fire Safety Walkthrough' }} />
        <Stack.Screen name="BuildingServices" component={BuildingServices} options={{ title: 'Assets (TR19 / Gas)' }} />
        <Stack.Screen name="QualificationTracker" component={QualificationTracker} options={{ title: 'Contractor Verification' }} />
        <Stack.Screen name="AuditReport" component={AuditReport} options={{ title: 'Audit Evidence' }} />
        <Stack.Screen name="FaultReporting" component={FaultReporting} options={{ title: 'Report Fault / Hazard' }} />
        <Stack.Screen name="LogIncident" component={LogIncident} options={{ title: 'Manual Incident Log' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const MainContent = () => {
    const { user } = useAuth();
    return user ? <AuthenticatedApp /> : <LoginScreen />;
  };

  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SPACING.xl, 
    backgroundColor: COLORS.white 
  } as ViewStyle,
  brand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase'
  } as TextStyle,
  title: { 
    ...TYPOGRAPHY.header,
    fontSize: 28, 
    marginBottom: SPACING.xs 
  } as TextStyle,
  subtitle: { 
    ...TYPOGRAPHY.body,
    color: COLORS.textLight, 
    marginBottom: 40 
  } as TextStyle,
  btn: { 
    width: '100%', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: SPACING.m, 
    alignItems: 'center',
    ...SHADOWS.light
  } as ViewStyle,
  btnText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  } as TextStyle,
  version: {
    marginTop: SPACING.l,
    ...TYPOGRAPHY.caption,
    color: COLORS.lightGray
  } as TextStyle
});