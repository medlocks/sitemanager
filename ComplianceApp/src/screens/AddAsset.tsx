import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { assetService, Asset } from '../services/assetService';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';

export const AddAsset = ({ route, navigation }: any) => {
  const editingAsset = route.params?.asset;
  const isEditing = !!editingAsset;

  const [name, setName] = useState(editingAsset?.asset_name || '');
  const [type, setType] = useState(editingAsset?.type || '');
  const [regulation, setRegulation] = useState(editingAsset?.regulation || '');
  const [minClearance, setMinClearance] = useState(editingAsset?.min_clearance_required || 'None');
  const [location, setLocation] = useState(editingAsset?.location || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !type || !regulation) {
      Alert.alert("Error", "Required fields missing.");
      return;
    }

    try {
      setLoading(true);
      const assetData: Asset = {
        asset_name: name,
        type: type.toUpperCase(),
        regulation: regulation,
        min_clearance_required: minClearance,
        location: location,
      };

      if (isEditing) {
        await assetService.updateAsset(editingAsset.id, assetData);
      } else {
        await assetService.createAsset(assetData);
      }

      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Remove this asset permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              await assetService.deleteAsset(editingAsset.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{isEditing ? 'Update Asset' : 'New Asset'}</Text>
        
        <Text style={styles.label}>ASSET NAME</Text>
        <TextInput 
          testID="input-asset-name"
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Name" 
        />

        <Text style={styles.label}>CATEGORY</Text>
        <TextInput 
          testID="input-asset-category"
          style={styles.input} 
          value={type} 
          onChangeText={setType} 
          placeholder="Type" 
        />

        <Text style={styles.label}>REGULATION</Text>
        <TextInput 
          testID="input-asset-regulation"
          style={styles.input} 
          value={regulation} 
          onChangeText={setRegulation} 
          placeholder="Regulation" 
        />

        <Text style={styles.label}>CLEARANCE</Text>
        <View style={styles.clearanceRow}>
          {['None', 'BPSS', 'SC', 'DV'].map(level => (
            <TouchableOpacity 
              key={level} 
              testID={`chip-clearance-${level}`}
              style={[styles.chip, minClearance === level && styles.chipActive]} 
              onPress={() => setMinClearance(level)}
            >
              <Text style={[styles.chipText, minClearance === level && styles.chipTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>LOCATION</Text>
        <TextInput 
          testID="input-asset-location"
          style={styles.input} 
          value={location} 
          onChangeText={setLocation} 
          placeholder="Location" 
        />

        <TouchableOpacity 
          testID="btn-save-asset"
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE RECORD</Text>}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            testID="btn-delete-asset"
            style={styles.deleteBtn} 
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>DELETE ASSET</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { padding: SPACING.m },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  clearanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.gray },
  chipTextActive: { color: COLORS.white, fontWeight: 'bold' },
  saveBtn: { backgroundColor: COLORS.success, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold' },
  deleteBtn: { marginTop: 20, alignItems: 'center' },
  deleteBtnText: { color: COLORS.secondary, fontWeight: 'bold' }
});