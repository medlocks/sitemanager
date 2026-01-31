import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export interface Asset {
  id?: string;
  asset_name: string;
  type: string;
  regulation: string;
  min_clearance_required: string;
  location: string;
  status?: string;
  next_service_due?: string;
}

export const assetService = {
  async createAsset(asset: Asset) {
    const dataToInsert = {
      ...asset,
      status: 'Non-Compliant',
      next_service_due: new Date().toISOString().split('T')[0]
    };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('assets', dataToInsert);
      return { offline: true };
    }

    const { data, error } = await supabase
      .from('assets')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAsset(id: string, asset: Asset) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      // For updates, the syncService enqueue would need logic to handle UPDATE actions vs INSERT
      // For current logic consistency:
      await syncService.enqueue('assets_updates', { id, ...asset });
      return { offline: true };
    }

    const { data, error } = await supabase
      .from('assets')
      .update(asset)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAsset(id: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('assets_deletions', { id });
      return { offline: true };
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async duplicateAsset(item: any) {
    const dataToInsert = {
      asset_name: `${item.assetName} (Copy)`,
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
      return { offline: true };
    }

    const { error } = await supabase
      .from('assets')
      .insert([dataToInsert]);

    if (error) throw error;
    return true;
  }
};