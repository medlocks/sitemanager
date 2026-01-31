import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export const notificationService = {
  async checkPendingTasks() {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;

      const { count } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      if (count && count > 0) {
        Alert.alert(
          "Statutory Reminder",
          `There are ${count} pending tasks awaiting action.`
        );
      }
    } catch (e) {
      console.error("Fallback Check Error:", e);
    }
  },

  async registerForPushNotifications(userId: string) {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  },

  async getNotificationLog(userId: string) {
    const { data } = await supabase
      .from('site_notifications')
      .select('*')
      .or(`recipient_id.eq.${userId},recipient_id.is.null`)
      .order('created_at', { ascending: false });
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('site_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('site_notifications')
      .update({ is_read: true })
      .match({ recipient_id: userId, is_read: false });
    if (error) throw error;
  }
};