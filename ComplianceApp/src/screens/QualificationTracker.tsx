import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, SectionList, Alert } from 'react-native';
import { contractorService, Contractor } from '../services/contractorService';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme';

export const QualificationTracker = ({ navigation }: any) => {
  const [allContractors, setAllContractors] = useState<Contractor[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const data = await contractorService.getAllContractors();
      setAllContractors(data);
      formatSections(data, searchQuery);
    } catch (e: any) {
      Alert.alert("Sync Error", "Failed to load workforce data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSections = (data: Contractor[], query: string) => {
    const q = query.toLowerCase();
    const filtered = data.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.specialism?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );

    const sections = [
      { 
        title: '🟠 Awaiting Verification', 
        data: filtered.filter(c => c.competence_status === 'Pending' && c.competence_evidence_url) 
      },
      { 
        title: '🟢 Approved Specialists', 
        data: filtered.filter(c => c.competence_status === 'Approved') 
      },
      { 
        title: '⚪ Suspended / Others', 
        data: filtered.filter(c => c.competence_status !== 'Approved' && c.competence_status !== 'Pending') 
      }
    ];
    setFilteredSections(sections.filter(s => s.data.length > 0));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContractors);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => { 
    formatSections(allContractors, searchQuery); 
  }, [searchQuery, allContractors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Workforce Governance</Text>
        <TextInput 
          style={styles.searchBar} 
          placeholder="Search by name, trade, or company..." 
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!loading}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => navigation.navigate('ContractorDetail', { contractor: item })}
            >
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.specialism || 'General'} Specialist</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contractors match your search.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  mainTitle: { ...TYPOGRAPHY.header, color: COLORS.primary },
  searchBar: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 10, marginTop: 10, color: '#000' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray, marginTop: 25, marginBottom: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, ...SHADOWS.light },
  name: { fontWeight: 'bold', fontSize: 16 },
  sub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  chevron: { color: COLORS.primary, fontWeight: 'bold' },
  loader: { marginTop: 50 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray }
});