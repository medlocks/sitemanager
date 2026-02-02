import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { contractorService, Contractor } from '../services/contractorService';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme';

export const ContractorAssignment = ({ route, navigation }: any) => {
  const { incidentId, isAsset } = route.params;
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filtered, setFiltered] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const data = await contractorService.getApprovedContractors();
      setContractors(data);
      setFiltered(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      contractors.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.specialism?.toLowerCase().includes(q)
      )
    );
  }, [search, contractors]);

  const handleAssign = async (contractor: Contractor) => {
    try {
      setLoading(true);
      await contractorService.assignToJob(incidentId, contractor.id, isAsset);
      Alert.alert("Assigned", `Job dispatched to ${contractor.name}`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Assignment Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispatch Specialist</Text>
      <TextInput 
        testID="input-contractor-search"
        style={styles.search} 
        placeholder="Filter by name or specialism (e.g. Gas)..." 
        placeholderTextColor="#999"
        value={search} 
        onChangeText={setSearch} 
      />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} testID="loading-contractors" />
      ) : (
        <FlatList 
          testID="contractor-list"
          data={filtered} 
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              testID={`contractor-item-${index}`}
              style={styles.card} 
              onPress={() => handleAssign(item)}
            >
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagTxt}>{item.specialism || 'General'}</Text>
                </View>
              </View>
              <Text style={styles.assignLink}>SELECT →</Text>
            </TouchableOpacity>
          )} 
          ListEmptyComponent={
            <Text style={styles.emptyTxt}>No approved specialists found.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, marginBottom: 15 },
  search: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee', color: '#000' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.light },
  name: { fontWeight: 'bold', fontSize: 16 },
  tag: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  tagTxt: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  assignLink: { color: COLORS.primary, fontWeight: 'bold' },
  emptyTxt: { textAlign: 'center', color: '#999', marginTop: 20 }
});