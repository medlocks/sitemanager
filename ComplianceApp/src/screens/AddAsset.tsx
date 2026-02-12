import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { assetService, Asset } from '../services/assetService';
import { COLORS, SPACING, TYPOGRAPHY, TOUCH_TARGETS } from '../theme';

export const AddAsset = ({ route, navigation }: any) => {
  const editingAsset = route.params?.asset;
  const isEditing = !!editingAsset;

  const [name, setName] = useState(editingAsset?.asset_name || '');
  const [type, setType] = useState(editingAsset?.type || '');
  const [regulation, setRegulation] = useState(editingAsset?.regulation || '');
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
        <Text style={styles.title} accessibilityRole="header">
          {isEditing ? 'Update Asset' : 'New Asset'}
        </Text>
        
        <Text style={styles.label}>ASSET NAME</Text>
        <TextInput 
          testID="input-asset-name"
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Name" 
          placeholderTextColor={COLORS.textLight}
          accessibilityLabel="Asset Name"
          accessibilityHint="Enter the name of the statutory asset"
        />

        <Text style={styles.label}>CATEGORY</Text>
        <TextInput 
          testID="input-asset-category"
          style={styles.input} 
          value={type} 
          onChangeText={setType} 
          placeholder="Type" 
          placeholderTextColor={COLORS.textLight}
          accessibilityLabel="Category"
          accessibilityHint="Enter the asset category"
        />

        <Text style={styles.label}>REGULATION</Text>
        <TextInput 
          testID="input-asset-regulation"
          style={styles.input} 
          value={regulation} 
          onChangeText={setRegulation} 
          placeholder="Regulation" 
          placeholderTextColor={COLORS.textLight}
          accessibilityLabel="Regulation"
          accessibilityHint="Enter the applicable health and safety regulation"
        />

        <Text style={styles.label}>LOCATION</Text>
        <TextInput 
          testID="input-asset-location"
          style={styles.input} 
          value={location} 
          onChangeText={setLocation} 
          placeholder="Location" 
          placeholderTextColor={COLORS.textLight}
          accessibilityLabel="Location"
          accessibilityHint="Enter the physical location of the asset"
        />

        <TouchableOpacity 
          testID="btn-save-asset"
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Save Record"
          accessibilityHint="Finalizes and saves the asset details to the registry"
        >
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>SAVE RECORD</Text>}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity 
            testID="btn-delete-asset"
            style={styles.deleteBtn} 
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete Asset"
            accessibilityHint="Permanently removes this asset from the database"
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
  scroll: { padding: SPACING.l },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, marginBottom: SPACING.xl },
  label: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs, letterSpacing: 1 },
  input: { 
    backgroundColor: COLORS.background, 
    padding: SPACING.m, 
    borderRadius: 12, 
    marginBottom: SPACING.l, 
    borderWidth: 2, 
    borderColor: COLORS.lightGray,
    minHeight: TOUCH_TARGETS.min,
    ...TYPOGRAPHY.body,
    color: COLORS.text
  },
  saveBtn: { 
    backgroundColor: COLORS.success, 
    minHeight: TOUCH_TARGETS.min, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: SPACING.m 
  },
  saveBtnText: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.white, 
    fontWeight: '800', 
    letterSpacing: 1 
  },
  deleteBtn: { 
    marginTop: SPACING.xl, 
    alignItems: 'center',
    minHeight: TOUCH_TARGETS.min,
    justifyContent: 'center'
  },
  deleteBtnText: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.secondary, 
    fontWeight: '800',
    textDecorationLine: 'underline'
  }
});