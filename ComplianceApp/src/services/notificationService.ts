import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident } from '../types';

export const checkPendingTasks = async () => {
  const data = await AsyncStorage.getItem('@incidents_vault');
  if (data) {
    const incidents: Incident[] = JSON.parse(data);
    const pendingCount = incidents.filter(i => i.status === 'Pending').length;

    if (pendingCount > 0) {
      Alert.alert(
        "Compliance Reminder",
        `You have ${pendingCount} unsynced incident reports. Please sync to head office to ensure audit readiness (R7).`
      );
    }
  }
};