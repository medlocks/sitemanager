import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const NotificationsScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const data = await notificationService.getNotificationLog(user.id);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    const channel = supabase
      .channel('notif_screen_sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_notifications' }, 
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePress = async (item: any) => {
    if (!item.is_read) {
      await notificationService.markAsRead(item.id);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.item, !item.is_read && styles.unreadItem]} 
      onPress={() => handlePress(item)}
    >
      <View style={styles.dotContainer}>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{flex:1}} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  item: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray 
  },
  unreadItem: { backgroundColor: '#f0f7ff' },
  dotContainer: { width: 20, justifyContent: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  unreadText: { fontWeight: 'bold' },
  message: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  date: { fontSize: 12, color: COLORS.lightGray, marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 50, color: COLORS.gray }
});