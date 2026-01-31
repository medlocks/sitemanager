import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export const buildingService = {
  async getServiceReports() {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('next_service_due', { ascending: true });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      assetName: item.asset_name,
      type: item.type,
      regulation: item.regulation,
      location: item.location,
      status: item.status,
      lastServiceDate: item.last_service_date,
      nextServiceDueDate: item.next_service_due,
      minClearance: item.min_clearance_required
    }));
  }
};