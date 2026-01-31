import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export const accidentService = {
  async logAccident(data: any) {
    const state = await NetInfo.fetch();
    
    if (!state.isConnected) {
      await syncService.enqueue('accidents', data);
      return { offline: true };
    }

    const { error } = await supabase
      .from('accidents')
      .insert([data]);
    if (error) throw error;
    return true;
  },

  async getAccidents() {
    const { data, error } = await supabase
      .from('accidents')
      .select(`
        *,
        reporter:user_id (name) 
      `)
      .order('date_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};