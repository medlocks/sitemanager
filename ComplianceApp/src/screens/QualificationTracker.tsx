import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TextStyle, 
  ViewStyle 
} from 'react-native';
import { Contractor } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: 'C001',
    name: 'James Smith',
    company: 'BuildSafe Ltd',
    specialism: 'GENERAL',
    qualifications: [
      { id: 'Q1', type: 'Working at Height', expiryDate: '2026-12-01', isValid: true },
      { id: 'Q2', type: 'CSCS Card', expiryDate: '2027-05-15', isValid: true }
    ]
  },
  {
    id: 'C002',
    name: 'Sarah Jones',
    company: 'Electra-Fix',
    specialism: 'ELECTRICAL',
    qualifications: [
      { id: 'Q3', type: 'High Voltage Specialist', expiryDate: '2025-01-01', isValid: false }
    ]
  },
  {
    id: 'C003',
    name: 'Sarah Vent',
    company: 'Air-Flow Hygiene',
    specialism: 'TR19_DUCTWORK',
    qualifications: [
      { id: 'Q4', type: 'TR19 Certified', expiryDate: '2026-05-01', isValid: true }
    ]
  }
];

export const QualificationTracker = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(MOCK_CONTRACTORS);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = MOCK_CONTRACTORS.filter(c => 
      c.name.toLowerCase().includes(text.toLowerCase()) || 
      c.company.toLowerCase().includes(text.toLowerCase()) ||
      c.specialism.toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  const renderContractor = ({ item }: { item: Contractor }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.specBadge}>
          <Text style={styles.specText}>{item.specialism.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.company}>{item.company}</Text>
      
      <View style={styles.qualList}>
        {item.qualifications.map(q => (
          <View 
            key={q.id} 
            style={[
              styles.qualTag, 
              { backgroundColor: q.isValid ? '#d4edda' : '#f8d7da' } 
            ]}
          >
            <Text style={[
              styles.tagText, 
              { color: q.isValid ? COLORS.success : COLORS.secondary }
            ]}>
              {q.type}: {q.isValid ? 'VALID' : 'EXPIRED'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.searchBar}
        placeholder="Search Name, Company, or Specialism..."
        placeholderTextColor={COLORS.textLight}
        value={search}
        onChangeText={handleSearch}
      />
      <FlatList 
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderContractor}
        ListEmptyComponent={<Text style={styles.empty}>No contractors found.</Text>}
        contentContainerStyle={{ paddingBottom: SPACING.l }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: SPACING.m, 
    backgroundColor: COLORS.background 
  } as ViewStyle,
  searchBar: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.s, 
    borderRadius: 8, 
    marginBottom: SPACING.m, 
    borderWidth: 1, 
    borderColor: COLORS.lightGray,
    color: COLORS.text 
  } as TextStyle,
  card: { 
    backgroundColor: COLORS.white, 
    padding: SPACING.m, 
    borderRadius: 8, 
    marginBottom: SPACING.s, 
    ...SHADOWS.light 
  } as ViewStyle,
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: SPACING.xs 
  } as ViewStyle,
  name: { 
    ...TYPOGRAPHY.subheader,
    color: COLORS.primary 
  } as TextStyle,
  specBadge: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: SPACING.s, 
    paddingVertical: 4, 
    borderRadius: 4 
  } as ViewStyle,
  specText: { 
    color: COLORS.white, 
    fontSize: 10, 
    fontWeight: 'bold' 
  } as TextStyle,
  company: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 14, 
    marginBottom: SPACING.s 
  } as TextStyle,
  qualList: { 
    borderTopWidth: 1, 
    borderTopColor: COLORS.lightGray, 
    paddingTop: SPACING.s 
  } as ViewStyle,
  qualTag: { 
    padding: SPACING.xs, 
    borderRadius: 4, 
    marginBottom: SPACING.xs 
  } as ViewStyle,
  tagText: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  } as TextStyle,
  empty: { 
    textAlign: 'center', 
    marginTop: SPACING.l, 
    color: COLORS.textLight 
  } as TextStyle
});