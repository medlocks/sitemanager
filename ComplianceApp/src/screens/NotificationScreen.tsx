import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, TOUCH_TARGETS } from "../theme";

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
      .channel("notif_screen_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_notifications" },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePress = async (item: any) => {
    if (!item.is_read) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.unreadItem]}
      onPress={() => handlePress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.is_read ? "Read" : "Unread"} alert: ${item.title}. ${item.message}`}
      accessibilityHint="Marks notification as read"
    >
      <View style={styles.dotContainer}>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={styles.empty} accessibilityRole="text">
            No site alerts or notifications yet.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listPadding: {
    paddingBottom: SPACING.xl,
  },
  item: {
    flexDirection: "row",
    padding: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
    minHeight: TOUCH_TARGETS.min * 1.5,
  },
  unreadItem: {
    backgroundColor: "#F0F7FF",
  },
  dotContainer: {
    width: 24,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
  },
  unreadText: {
    fontWeight: "900",
    color: COLORS.text,
  },
  message: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: 6,
    lineHeight: 22,
  },
  date: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 10,
    fontWeight: "700",
  },
  empty: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginTop: 60,
    color: COLORS.textLight,
  },
});
