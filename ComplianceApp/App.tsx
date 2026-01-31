import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Button, 
  TextInput, 
  ActivityIndicator, 
  TextStyle, 
  ViewStyle,
  Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from './src/theme';
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./src/services/syncService";
import { notificationService } from "./src/services/notificationService";
import { supabase } from './src/lib/supabase';

import { PrivacyModal } from './src/components/PrivacyModal';
import { Dashboard } from './src/screens/Dashboard';
import { ContractorWorkOrders } from './src/screens/ContractorWorkOrders';
import { FaultReporting } from './src/screens/FaultReporting';
import { FireRiskAssessment } from './src/screens/FireRiskAssessment';
import { BuildingServices } from './src/screens/BuildingServices';
import { QualificationTracker } from './src/screens/QualificationTracker';
import { AuditReport } from './src/screens/AuditReport';
import { ContractorAssignment } from './src/screens/ContractorAssignment';
import { LogIncident } from './src/screens/LogIncident';
import { SiteSettings } from './src/screens/SiteSettings';
import { ContractorProfile } from './src/screens/ContractorProfile';
import { AddAsset } from './src/screens/AddAsset'; 
import { ContractorDetail } from './src/screens/ContractorDetail';
import { LogAccident } from './src/screens/LogAccident';
import { NotificationsScreen } from './src/screens/NotificationScreen';

const Stack = createNativeStackNavigator();

const LoginScreen = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter credentials");
      return;
    }
    await login(email, password);
  };

  return (
    <View style={styles.center}>
      <Text style={styles.brand}>Raytheon</Text>
      <Text style={styles.title}>Compliance System</Text>
      <Text style={styles.subtitle}>Secure Site Access Portal</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: COLORS.primary }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.btnText}>Sign In to Live Vault</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>v4.0 | Statutory Security & Org Integration</Text>
    </View>
  );
};

const AuthenticatedApp = () => {
  const { user, logout } = useAuth();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    setPrivacyVisible(true);

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        syncService.syncNow();
      }
    });

    const syncUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncService.syncNow();
      }
    });

    notificationService.registerForPushNotifications(user.id);
    notificationService.checkPendingTasks();

    const channel = supabase
      .channel('site_alerts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'site_notifications' }, 
        (payload) => {
          if (!payload.new.recipient_id || payload.new.recipient_id === user.id) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: payload.new.title,
                body: payload.new.message,
                data: { linkId: payload.new.link_id },
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      syncUnsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return (
    <>
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
          {user?.role === 'Manager' || user?.role === 'Employee' ? (
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Raytheon Command' }} />
          ) : (
            <Stack.Screen name="ContractorDashboard" component={ContractorWorkOrders} options={{ title: 'Contractor Portal' }} />
          )}
          
          <Stack.Screen name="ContractorAssignment" component={ContractorAssignment} options={{ title: 'Assign Specialist' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Site Alerts' }} />
          <Stack.Screen name="BuildingServices" component={BuildingServices} options={{ title: 'Assets (TR19 / Gas)' }} />
          <Stack.Screen name="AddAsset" component={AddAsset} options={{ title: 'Manage Statutory Asset' }} />
          <Stack.Screen name="ContractorProfile" component={ContractorProfile} options={{ title: 'Compliance Profile' }} />
          <Stack.Screen name="SiteSettings" component={SiteSettings} options={{ title: 'Security Protocols' }} />
          <Stack.Screen name="FireRiskAssessment" component={FireRiskAssessment} options={{ title: 'Fire Safety Walkthrough' }} />
          <Stack.Screen name="QualificationTracker" component={QualificationTracker} options={{ title: 'Contractor Verification' }} />
          <Stack.Screen name="ContractorDetail" component={ContractorDetail} options={{title: 'Contractor Details'}} />
          <Stack.Screen name="AuditReport" component={AuditReport} options={{ title: 'Audit Evidence' }} />
          <Stack.Screen name="FaultReporting" component={FaultReporting} options={{ title: 'Report Fault / Hazard' }} />
          <Stack.Screen name="LogIncident" component={LogIncident} options={{ title: 'Manual Incident Log' }} />
          <Stack.Screen name="LogAccident" component={LogAccident} options={{ title: 'Log Statutory Accident' }} />
        </Stack.Navigator>
      </NavigationContainer>

      <PrivacyModal 
        visible={privacyVisible} 
        onClose={() => setPrivacyVisible(false)} 
      />
    </>
  );
};

export default function App() {
  const MainContent = () => {
    const { user, loading } = useAuth();

    if (loading && !user) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{marginTop: 10, ...TYPOGRAPHY.caption}}>Authenticating with Site Vault...</Text>
        </View>
      );
    }

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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: COLORS.background
  } as ViewStyle,
  btn: { 
    width: '100%', 
    padding: 18, 
    borderRadius: 12, 
    marginTop: SPACING.s,
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