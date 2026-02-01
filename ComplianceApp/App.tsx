import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import NetInfo from "@react-native-community/netinfo";

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from './src/theme';
import { syncService } from "./src/services/syncService";
import { notificationService } from "./src/services/notificationService";
import { supabase } from './src/lib/supabase';

import { PrivacyModal } from './src/components/PrivacyModal';
import { Dashboard } from './src/screens/Dashboard';
import { ContractorWorkOrders } from './src/screens/ContractorWorkOrders';
import { FaultReporting } from './src/screens/FaultReporting';
import { BuildingServices } from './src/screens/BuildingServices';
import { QualificationTracker } from './src/screens/QualificationTracker';
import { AuditReport } from './src/screens/AuditReport';
import { LogIncident } from './src/screens/LogIncident';
import { SiteSettings } from './src/screens/SiteSettings';
import { LogAccident } from './src/screens/LogAccident';
import { NotificationsScreen } from './src/screens/NotificationScreen';
import { AddAsset } from './src/screens/AddAsset';
import { ContractorDetail } from './src/screens/ContractorDetail';
import { IncidentDetail } from './src/screens/IncidentDetail';
import { ContractorAssignment } from './src/screens/ContractorAssignment';

const Stack = createNativeStackNavigator();

const LoginScreen = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Authentication", "Please enter valid credentials");
      return;
    }
    await login(email, password);
  };

  return (
    <SafeAreaView style={styles.center}>
      <View style={styles.loginCard}>
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

        <Text style={styles.version}>v4.0 | Statutory Security Protocol</Text>
      </View>
    </SafeAreaView>
  );
};

const AuthenticatedApp = () => {
  const { user, logout } = useAuth();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPrivacyVisible(true);

    NetInfo.fetch().then(state => {
      if (state.isConnected) syncService.syncNow();
    });

    const syncUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) syncService.syncNow();
    });

    notificationService.registerForPushNotifications(user.id);

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
          screenOptions={({ navigation, route }) => ({ 
            headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
            headerTitleAlign: route.name === 'Dashboard' ? 'center' : 'left',
            headerTitleStyle: { ...TYPOGRAPHY.header, fontSize: 13, color: COLORS.primary, letterSpacing: 1 },
            headerTintColor: COLORS.primary,
            headerLeft: () => (
              route.name === 'Dashboard' ? (
                <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginLeft: 15 }}>
                  <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null
            ),
            headerRight: () => (
              <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
                <Text style={{ color: COLORS.secondary, fontWeight: '700', fontSize: 11 }}>LOGOUT</Text>
              </TouchableOpacity>
            ),
          })}
        >
          {user?.role === 'Contractor' ? (
            <Stack.Screen name="Dashboard" component={ContractorWorkOrders} options={{ title: 'CONTRACTOR PORTAL' }} />
          ) : (
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'COMMAND DASHBOARD' }} />
          )}
          
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'SITE ALERTS' }} />
          <Stack.Screen name="BuildingServices" component={BuildingServices} options={{ title: 'ASSET MANAGEMENT' }} />
          <Stack.Screen name="SiteSettings" component={SiteSettings} options={{ title: 'SECURITY PROTOCOLS' }} />
          <Stack.Screen name="QualificationTracker" component={QualificationTracker} options={{ title: 'COMPLIANCE' }} />
          <Stack.Screen name="AuditReport" component={AuditReport} options={{ title: 'AUDIT EVIDENCE' }} />
          <Stack.Screen name="FaultReporting" component={FaultReporting} options={{ title: 'REPORT FAULT' }} />
          <Stack.Screen name="LogAccident" component={LogAccident} options={{ title: 'LOG ACCIDENT' }} />
          <Stack.Screen name="LogIncident" component={LogIncident} options={{ title: 'INCIDENT LOG' }} />
          <Stack.Screen name="AddAsset" component={AddAsset} options={{ title: 'ADD NEW ASSET' }} />
          <Stack.Screen name="IncidentDetail" component={IncidentDetail} options={{ title: 'INCIDENT DOSSIER' }} />
          <Stack.Screen name="ContractorDetail" component={ContractorDetail} options={{ title: 'CONTRACTOR DOSSIER' }} />
          <Stack.Screen name="ContractorAssignment" component={ContractorAssignment} options={{ title: 'CONTRACTOR ASSIGNMENT' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FA' },
  loginCard: { width: '85%', padding: 30, backgroundColor: COLORS.white, borderRadius: 20, ...SHADOWS },
  brand: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center' },
  title: { ...TYPOGRAPHY.header, fontSize: 22, textAlign: 'center', marginTop: 10, color: COLORS.primary },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textLight, textAlign: 'center', marginBottom: 30 },
  input: { width: '100%', height: 55, backgroundColor: '#F8F9FB', borderWidth: 1, borderColor: '#E1E6ED', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  btn: { width: '100%', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  version: { marginTop: 25, textAlign: 'center', fontSize: 10, color: COLORS.lightGray, fontWeight: '600' }
});