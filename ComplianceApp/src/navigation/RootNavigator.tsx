import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import NetInfo from "@react-native-community/netinfo";

import { useAuth } from "../context/AuthContext";
import { syncService } from "../services/syncService";
import { notificationService } from "../services/notificationService";
import { supabase } from "../lib/supabase";
import { COLORS, TYPOGRAPHY, TOUCH_TARGETS, SPACING } from "../theme";

import { LoginScreen } from "../screens/LoginScreen";
import { PrivacyModal } from "../components/PrivacyModal";

import { ContractorWorkOrders } from "../screens/ContractorWorkOrders";
import { Dashboard } from "../screens/Dashboard";
import { EmployeeDashboard } from "../screens/EmployeeDashboard";

import { FaultReporting } from "../screens/FaultReporting";
import { BuildingServices } from "../screens/BuildingServices";
import { ContractorVerification } from "../screens/ContractorVerification";
import { AuditReport } from "../screens/AuditReport";
import { LogAccident } from "../screens/LogAccident";
import { NotificationsScreen } from "../screens/NotificationScreen";
import { AddAsset } from "../screens/AddAsset";
import { ContractorDetail } from "../screens/ContractorDetail";
import { IncidentDetail } from "../screens/IncidentDetail";
import { ContractorAssignment } from "../screens/ContractorAssignment";
import { ContractorProfile } from "../screens/ContractorProfile";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, logout, loading } = useAuth();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    setPrivacyVisible(true);

    const syncUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncService.syncNow();
    });

    NetInfo.fetch().then((state) => {
      if (state.isConnected) syncService.syncNow();
    });

    notificationService.registerForPushNotifications(user.id);

    const alertChannel = supabase
      .channel("site_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "site_notifications" },
        (payload) => {
          if (
            !payload.new.recipient_id ||
            payload.new.recipient_id === user.id
          ) {
            Notifications.scheduleNotificationAsync({
              content: { title: payload.new.title, body: payload.new.message },
              trigger: null,
            });
          }
        },
      )
      .subscribe();

    return () => {
      syncUnsubscribe();
      supabase.removeChannel(alertChannel);
    };
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getDashboardComponent = () => {
    switch (user?.role) {
      case "Manager":
        return Dashboard;
      case "Contractor":
        return ContractorWorkOrders;
      default:
        return EmployeeDashboard;
    }
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case "Manager":
        return "COMMAND DASHBOARD";
      case "Contractor":
        return "CONTRACTOR PORTAL";
      default:
        return "HOME";
    }
  };

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerStyle: { backgroundColor: COLORS.white },
            headerTitleAlign: "center",
            headerTitleStyle: {
              ...TYPOGRAPHY.header,
              fontSize: 16,
              color: COLORS.primary,
              letterSpacing: 1.2,
            },
            headerTintColor: COLORS.primary,
            headerRight: () =>
              user ? (
                <TouchableOpacity
                  onPress={logout}
                  style={styles.headerRightBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Logout"
                  accessibilityHint="Ends your current session and returns to login"
                >
                  <Text style={styles.logoutText}>LOGOUT</Text>
                </TouchableOpacity>
              ) : null,
          })}
        >
          {!user ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="Dashboard"
                component={getDashboardComponent()}
                options={({ navigation }) => ({
                  title: getDashboardTitle(),
                  headerLeft: () =>
                    user.role === "Manager" ? (
                      <TouchableOpacity
                        testID="notifications-btn"
                        onPress={() => navigation.navigate("Notifications")}
                        style={styles.headerLeftBtn}
                        accessibilityRole="button"
                        accessibilityLabel="View Site Alerts"
                      >
                        <Ionicons
                          name="notifications-outline"
                          size={28}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    ) : null,
                })}
              />

              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: "SITE ALERTS" }}
              />
              <Stack.Screen
                name="FaultReporting"
                component={FaultReporting}
                options={{ title: "REPORT FAULT" }}
              />
              <Stack.Screen
                name="LogAccident"
                component={LogAccident}
                options={{ title: "LOG ACCIDENT" }}
              />

              <Stack.Screen
                name="BuildingServices"
                component={BuildingServices}
                options={{ title: "ASSET MANAGEMENT" }}
              />
              <Stack.Screen
                name="ContractorVerification"
                component={ContractorVerification}
                options={{ title: "COMPLIANCE" }}
              />
              <Stack.Screen
                name="AuditReport"
                component={AuditReport}
                options={{ title: "AUDIT EVIDENCE" }}
              />
              <Stack.Screen
                name="AddAsset"
                component={AddAsset}
                options={{ title: "ADD NEW ASSET" }}
              />
              <Stack.Screen
                name="IncidentDetail"
                component={IncidentDetail}
                options={{ title: "INCIDENT DOSSIER" }}
              />
              <Stack.Screen
                name="ContractorDetail"
                component={ContractorDetail}
                options={{ title: "CONTRACTOR DOSSIER" }}
              />
              <Stack.Screen
                name="ContractorProfile"
                component={ContractorProfile}
                options={{ title: "CONTRACTOR PROFILE" }}
              />
              <Stack.Screen
                name="ContractorAssignment"
                component={ContractorAssignment}
                options={{ title: "CONTRACTOR ASSIGNMENT" }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <PrivacyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  headerRightBtn: {
    marginRight: SPACING.m,
    minHeight: TOUCH_TARGETS.min,
    minWidth: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeftBtn: {
    marginLeft: SPACING.m,
    minHeight: TOUCH_TARGETS.min,
    minWidth: TOUCH_TARGETS.min,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: COLORS.secondary,
    fontWeight: "800",
    fontSize: 14,
  },
});
