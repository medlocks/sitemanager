import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { InputValidator } from '../utils/InputValidator';

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
    const cleanUserId = InputValidator.sanitize(userId);

    await supabase.from('profiles').update({ push_token: token }).eq('id', cleanUserId);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  },

  async getNotificationLog(userId: string) {
    const cleanUserId = InputValidator.sanitize(userId);
    const { data } = await supabase
      .from('site_notifications')
      .select('*')
      .or(`recipient_id.eq.${cleanUserId},recipient_id.is.null`)
      .order('created_at', { ascending: false });
    return data;
  },

  async markAsRead(notificationId: string) {
    const cleanId = InputValidator.sanitize(notificationId);
    const { error } = await supabase
      .from('site_notifications')
      .update({ is_read: true })
      .eq('id', cleanId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const cleanUserId = InputValidator.sanitize(userId);
    const { error } = await supabase
      .from('site_notifications')
      .update({ is_read: true })
      .match({ recipient_id: cleanUserId, is_read: false });
    if (error) throw error;
  },

  async notifyManagers(title: string, message: string, type: 'WORK_ORDER' | 'ACCIDENT' | 'HAZARD', linkId?: string) {
    try {
      const cleanTitle = InputValidator.sanitize(title);
      const cleanMessage = InputValidator.sanitize(message);
      const cleanLinkId = linkId ? InputValidator.sanitize(linkId) : undefined;

      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'Manager');

      if (!managers || managers.length === 0) return;

      const notifications = managers.map(m => ({
        recipient_id: m.id,
        title: cleanTitle,
        message: cleanMessage,
        type, 
        link_id: cleanLinkId,
        is_read: false
      }));

      const { error } = await supabase.from('site_notifications').insert(notifications);
      if (error) throw error;
      
    } catch (e) {
      console.error("Error notifying managers:", e);
    }
  }
};