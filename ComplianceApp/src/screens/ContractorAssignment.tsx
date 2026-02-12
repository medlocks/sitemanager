import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { contractorService, Contractor } from '../services/contractorService';
import { COLORS, TYPOGRAPHY, SHADOWS, TOUCH_TARGETS, SPACING } from '../theme';

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
      <Text style={styles.title} accessibilityRole="header">Dispatch Specialist</Text>
      <TextInput 
        testID="input-contractor-search"
        style={styles.search} 
        placeholder="Filter by name or specialism (e.g. Gas)..." 
        placeholderTextColor={COLORS.textLight}
        value={search} 
        onChangeText={setSearch} 
        accessibilityLabel="Search Contractors"
        accessibilityHint="Filters the list of specialists by name or trade"
      />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} testID="loading-contractors" />
        </View>
      ) : (
        <FlatList 
          testID="contractor-list"
          data={filtered} 
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              testID={`contractor-item-${index}`}
              style={styles.card} 
              onPress={() => handleAssign(item)}
              accessibilityRole="button"
              accessibilityLabel={`Assign ${item.name}, ${item.specialism || 'General'} specialist`}
              accessibilityHint="Dispatches the work order to this contractor"
            >
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagTxt}>{item.specialism?.toUpperCase() || 'GENERAL'}</Text>
                </View>
              </View>
              <Text style={styles.assignLink}>SELECT →</Text>
            </TouchableOpacity>
          )} 
          ListEmptyComponent={
            <Text style={styles.emptyTxt} accessibilityRole="text">
              No approved specialists found.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: SPACING.m, 
    backgroundColor: COLORS.background 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary, 
    marginVertical: SPACING.m 
  },
  search: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 12, 
    marginBottom: SPACING.m, 
    borderWidth: 2, 
    borderColor: COLORS.lightGray, 
    color: COLORS.text,
    minHeight: TOUCH_TARGETS.min,
    ...TYPOGRAPHY.body
  },
  list: {
    paddingBottom: SPACING.xl
  },
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 12, 
    marginBottom: SPACING.s, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    minHeight: TOUCH_TARGETS.min * 1.5,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray
  },
  info: {
    flex: 1
  },
  name: { 
    ...TYPOGRAPHY.subheader,
    color: COLORS.text 
  },
  tag: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 8, 
    alignSelf: 'flex-start' 
  },
  tagTxt: { 
    color: COLORS.white, 
    fontSize: 12, 
    fontWeight: '900',
    letterSpacing: 0.5 
  },
  assignLink: { 
    ...TYPOGRAPHY.body,
    color: COLORS.primary, 
    fontWeight: '800',
    marginLeft: SPACING.s
  },
  emptyTxt: { 
    textAlign: 'center', 
    ...TYPOGRAPHY.body,
    color: COLORS.textLight, 
    marginTop: SPACING.xl 
  }
});