import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export interface SiteSettingsData {
  strict_mode: boolean;
  global_min_clearance: string;
}

export const settingsService = {
  async getSettings(): Promise<SiteSettingsData> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('strict_mode, global_min_clearance')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSettings(settings: Partial<SiteSettingsData>) {
    const updateData = {
      ...settings,
      updated_at: new Date().toISOString()
    };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('site_settings_updates', { id: 1, ...updateData });
      return { offline: true };
    }

    const { error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', 1);

    if (error) throw error;
    return true;
  }
};