import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export const Dashboard = ({ navigation }: any) => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isManager = user?.role === 'Manager';

  const fetchData = async () => {
    if (!isManager) {
      setLoading(false);
      return;
    }
    
    try {
      const [feedRes, countRes] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
      ]);
      setFeed(feedRes.data || []);
      setPendingCount(countRes.count || 0);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (isManager) {
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
    }
  }, [isManager]);

  const menuItems = [
    { id: '1', title: 'Report Fault / Hazard', icon: 'alert-circle-outline', screen: 'FaultReporting', roles: ['Manager', 'Employee'] },
    { id: '2', title: 'Log Statutory Accident', icon: 'medical-outline', screen: 'LogAccident', roles: ['Manager', 'Employee'] },
    { id: '3', title: 'Building Assets', icon: 'construct-outline', screen: 'BuildingServices', roles: ['Manager'] },
    { id: '4', title: 'Audit Evidence', icon: 'shield-checkmark-outline', screen: 'AuditReport', roles: ['Manager'] },
    { id: '5', title: 'Specialist Verification', icon: 'people-outline', screen: 'QualificationTracker', roles: ['Manager'] },
    { id: '6', title: 'Security Protocols', icon: 'options-outline', screen: 'SiteSettings', roles: ['Manager'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.greeting}>ACCESS LEVEL: {user?.role}</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        
        {isManager && pendingCount > 0 && (
          <TouchableOpacity 
            testID="manager-pending-banner"
            style={styles.summaryBanner}
            onPress={() => navigation.navigate('AuditReport')}
          >
            <Ionicons name="notifications" size={20} color={COLORS.white} />
            <Text style={styles.summaryText}>
              ACTION REQUIRED: {pendingCount} PENDING TASKS
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} style={{marginLeft: 'auto'}} />
          </TouchableOpacity>
        )}

        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              testID={`menu-item-${item.screen}`}
              style={styles.card} 
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C4CDD5" />
            </TouchableOpacity>
          ))}
        </View>

        {isManager && (
          <View style={styles.feedSection}>
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>LIVE INCIDENT FEED</Text>
              <View style={styles.pulseDot} />
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : feed.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                testID={`incident-feed-item-${index}`}
                style={styles.feedItem}
                onPress={() => navigation.navigate('IncidentDetail', { incident: item })}
              >
                <View style={[styles.statusLine, { backgroundColor: item.status === 'Resolved' ? '#00C853' : '#FFAB00' }]} />
                <View style={styles.feedContent}>
                  <View style={styles.feedTopRow}>
                    <Text style={styles.feedDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={[styles.statusTag, { color: item.status === 'Resolved' ? '#00C853' : '#FFAB00' }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.feedMeta}>
                    {item.location} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <Ionicons name="eye-outline" size={18} color="#C4CDD5" style={{marginLeft: 10}} />
              </TouchableOpacity>
            ))}
            {!loading && feed.length === 0 && (
              <Text style={styles.emptyText}>No recent site activity.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  content: { padding: 15 },
  hero: { marginBottom: 20, paddingLeft: 5 },
  greeting: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, letterSpacing: 1.5 },
  name: { fontSize: 26, color: COLORS.primary, marginTop: 4, fontWeight: 'bold' },
  summaryBanner: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    elevation: 3
  },
  summaryText: { color: COLORS.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  grid: { gap: 10, marginBottom: 30 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E1E6ED'
  },
  iconBox: { width: 44, height: 44, backgroundColor: '#F0F4F8', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.primary },
  feedSection: { marginTop: 10 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8, paddingLeft: 5 },
  feedTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4D4F' },
  feedItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E1E6ED'
  },
  statusLine: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  feedContent: { flex: 1 },
  feedTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedDesc: { fontSize: 13, fontWeight: '700', color: COLORS.primary, flex: 0.75 },
  feedMeta: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statusTag: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 20, fontSize: 12 }
});s