import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import { InputValidator } from '../utils/InputValidator';

export interface Asset {
  id?: string;
  asset_name: string;
  type: string;
  regulation: string;
  location: string;
  status?: string;
  next_service_due?: string;
  min_clearance_required?: string | number;
}

export const assetService = {
  async createAsset(asset: Asset) {
    const cleanName = InputValidator.sanitize(asset.asset_name);
    const cleanLocation = InputValidator.sanitize(asset.location);
    const cleanType = InputValidator.sanitize(asset.type);
    const cleanRegulation = InputValidator.sanitize(asset.regulation);

    const today = new Date().toISOString().split('T')[0];
    const validation = InputValidator.validateAsset(cleanName, today);

    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const dataToInsert = {
      ...asset,
      asset_name: cleanName,
      location: cleanLocation,
      type: cleanType,
      regulation: cleanRegulation,
      status: 'Non-Compliant',
      next_service_due: today
    };

    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      await syncService.enqueue('assets', dataToInsert);
      return { success: true, offline: true, message: 'Saved to offline queue' };
    }

    const { data, error } = await supabase
      .from('assets')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Database error. Please try again.' };
    }
    return { success: true, data, offline: false };
  },

  async updateAsset(id: string, asset: Partial<Asset>) {
    const cleanAsset = { ...asset };
    if (asset.asset_name) cleanAsset.asset_name = InputValidator.sanitize(asset.asset_name);
    if (asset.location) cleanAsset.location = InputValidator.sanitize(asset.location);

    if (asset.next_service_due) {
      const nameToCheck = cleanAsset.asset_name || "Placeholder";
      const validation = InputValidator.validateAsset(nameToCheck, asset.next_service_due);
      
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('assets_updates', { id, ...cleanAsset });
      return { success: true, offline: true, message: 'Update queued (Offline)' };
    }

    const { data, error } = await supabase
      .from('assets')
      .update(cleanAsset)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Update failed. Please try again.' };
    }
    return { success: true, data, offline: false };
  },

  async deleteAsset(id: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('assets_deletions', { id });
      return { success: true, offline: true };
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: 'Delete failed.' };
    }
    return { success: true, offline: false };
  },

  async duplicateAsset(item: any) {
    const rawName = `${item.assetName} (Copy)`;
    const cleanName = InputValidator.sanitize(rawName);

    const dataToInsert = {
      asset_name: cleanName,
      type: item.type,
      regulation: item.regulation,
      location: item.location,
      status: 'Non-Compliant',
      next_service_due: new Date().toISOString().split('T')[0],
      min_clearance_required: item.minClearance
    };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('assets', dataToInsert);
      return { success: true, offline: true };
    }

    const { error } = await supabase
      .from('assets')
      .insert([dataToInsert]);

    if (error) {
      return { success: false, error: 'Duplication failed.' };
    }
    return { success: true, offline: false };
  }
};