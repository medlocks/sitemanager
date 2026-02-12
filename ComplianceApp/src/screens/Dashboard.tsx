import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, TOUCH_TARGETS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigation: any;
}

export const Dashboard = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { id: '1', title: 'Report Fault / Hazard', icon: 'alert-circle-outline', screen: 'FaultReporting' },
    { id: '2', title: 'Log Statutory Accident', icon: 'medical-outline', screen: 'LogAccident' },
    { id: '3', title: 'Building Assets', icon: 'construct-outline', screen: 'BuildingServices' },
    { id: '4', title: 'Audit Evidence', icon: 'shield-checkmark-outline', screen: 'AuditReport' },
    { id: '5', title: 'Specialist Verification', icon: 'people-outline', screen: 'QualificationTracker' },
  ];

  const fetchData = async () => {
    try {
      const [feedRes, countRes] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
      ]);
      setFeed(feedRes.data || []);
      setPendingCount(countRes.count || 0);
    } catch (error) {
      console.warn("Dashboard sync failed - showing cached data if available");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('realtime_incidents')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'incidents' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFeed(prev => [payload.new, ...prev].slice(0, 8));
            if (payload.new.status === 'Pending') setPendingCount(c => c + 1);
          } 
          else if (payload.eventType === 'UPDATE') {
            setFeed(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
            fetchData();
          }
          else if (payload.eventType === 'DELETE') {
            setFeed(prev => prev.filter(item => item.id !== payload.old.id));
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero} accessibilityRole="summary">
        <Text style={styles.greeting}>ACCESS LEVEL: {user?.role}</Text>
        <Text style={styles.name} accessibilityRole="header">{user?.name}</Text>
      </View>
      
      {pendingCount > 0 && (
        <TouchableOpacity 
          testID="manager-pending-banner"
          style={styles.summaryBanner}
          onPress={() => navigation.navigate('AuditReport')}
          accessibilityRole="button"
          accessibilityLabel={`Action Required: ${pendingCount} pending tasks`}
          accessibilityHint="Navigates to the audit report to resolve pending items"
        >
          <Ionicons name="notifications" size={24} color={COLORS.white} />
          <Text style={styles.summaryText}>
            ACTION REQUIRED: {pendingCount} PENDING TASKS
          </Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.white} style={{marginLeft: 'auto'}} />
        </TouchableOpacity>
      )}

      <View style={styles.grid} accessibilityRole="menu">
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            testID={`menu-item-${item.screen}`}
            style={styles.card} 
            onPress={() => navigation.navigate(item.screen)}
            accessibilityRole="menuitem"
            accessibilityLabel={item.title}
          >
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.cardText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.feedSection}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle} accessibilityRole="header">LIVE INCIDENT FEED</Text>
          <View style={styles.pulseDot}/>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} accessibilityLabel="Loading feed" />
        ) : feed.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            testID={`incident-feed-item-${index}`}
            style={styles.feedItem}
            onPress={() => navigation.navigate('IncidentDetail', { incident: item })}
            accessibilityRole="button"
            accessibilityLabel={`${item.status} incident: ${item.description} at ${item.location}`}
          >
            <View style={[styles.statusLine, { backgroundColor: item.status === 'Resolved' ? COLORS.success : COLORS.warning }]} />
            <View style={styles.feedContent}>
              <View style={styles.feedTopRow}>
                <Text style={styles.feedDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={[styles.statusTag, { color: item.status === 'Resolved' ? COLORS.success : COLORS.warning }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.feedMeta}>
                {item.location} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
            <Ionicons name="eye-outline" size={24} color={COLORS.gray} style={{marginLeft: 10}} />
          </TouchableOpacity>
        ))}
        {!loading && feed.length === 0 && (
          <Text style={styles.emptyText}>No recent site activity.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.m },
  hero: { marginBottom: SPACING.l, paddingLeft: 5 },
  greeting: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.secondary, letterSpacing: 1.5 },
  name: { ...TYPOGRAPHY.header, fontSize: 28, color: COLORS.primary, marginTop: 4 },
  summaryBanner: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.min,
    padding: SPACING.s,
    borderRadius: 12,
    marginBottom: SPACING.l,
    gap: 10,
    ...SHADOWS.light
  },
  summaryText: { color: COLORS.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  grid: { gap: 12, marginBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    minHeight: TOUCH_TARGETS.min * 1.5,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    backgroundColor: COLORS.background, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.m 
  },
  cardText: { flex: 1, ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.primary },
  feedSection: { marginTop: 10 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m, gap: 8, paddingLeft: 5 },
  feedTitle: { ...TYPOGRAPHY.caption, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  feedItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.min * 1.6,
    marginBottom: 10,
    ...SHADOWS.light,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray
  },
  statusLine: { width: 6, height: 45, borderRadius: 3, marginRight: 12 },
  feedContent: { flex: 1 },
  feedTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedDesc: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.primary, flex: 0.75 },
  feedMeta: { ...TYPOGRAPHY.body, fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  statusTag: { ...TYPOGRAPHY.caption, fontWeight: '900', letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', ...TYPOGRAPHY.body, color: COLORS.textLight, marginTop: 20 }
});