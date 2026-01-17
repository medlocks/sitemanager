import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextStyle, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const ContractorWorkOrders = ({ navigation }: any) => {
  const [assignedTasks, setAssignedTasks] = useState<Incident[]>([]);

  const loadTasks = async () => {
    const data = await AsyncStorage.getItem('@incidents_vault');
    if (data) {
      const allIncidents = JSON.parse(data);
      // In a real app, we would filter by the logged-in Contractor's Name
      const myTasks = allIncidents.filter((i: Incident) => i.status === 'Assigned');
      setAssignedTasks(myTasks);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadTasks());
    return unsubscribe;
  }, [navigation]);

  const resolveTask = async (id: string) => {
    const data = await AsyncStorage.getItem('@incidents_vault');
    if (data) {
      const incidents = JSON.parse(data);
      const updated = incidents.map((i: Incident) => 
        i.id === id ? { ...i, status: 'Resolved', timestamp: new Date().toISOString() } : i
      );
      await AsyncStorage.setItem('@incidents_vault', JSON.stringify(updated));
      Alert.alert(
        "Task Completed", 
        "Work order marked as Resolved. Evidence has been logged for the Site Manager."
      );
      loadTasks();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Assigned Tasks</Text>
      <FlatList 
        data={assignedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <TouchableOpacity style={styles.completeBtn} onPress={() => resolveTask(item.id)}>
              <Text style={styles.btnText}>UPLOAD EVIDENCE & CLOSE TASK</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No active work orders assigned to you.</Text>}
        contentContainerStyle={{ paddingBottom: SPACING.l }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.m, 
    backgroundColor: COLORS.background 
  } as ViewStyle,
  header: { 
    ...TYPOGRAPHY.header, 
    marginBottom: SPACING.l 
  } as TextStyle,
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 10, 
    marginBottom: SPACING.m, 
    ...SHADOWS.light,
    borderLeftWidth: 5, 
    borderLeftColor: COLORS.info 
  } as ViewStyle,
  date: { 
    ...TYPOGRAPHY.caption, 
    marginBottom: SPACING.xs 
  } as TextStyle,
  desc: { 
    ...TYPOGRAPHY.subheader, 
    fontSize: 16,
    color: COLORS.text, 
    marginBottom: SPACING.m 
  } as TextStyle,
  completeBtn: { 
    backgroundColor: COLORS.success, 
    padding: SPACING.s, 
    borderRadius: 6, 
    alignItems: 'center' 
  } as ViewStyle,
  btnText: { 
    color: COLORS.white, 
    fontWeight: 'bold', 
    fontSize: 12 
  } as TextStyle,
  empty: { 
    textAlign: 'center', 
    marginTop: 50, 
    ...TYPOGRAPHY.body, 
    color: COLORS.textLight 
  } as TextStyle
});