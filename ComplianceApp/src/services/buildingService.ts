import { supabase } from '../lib/supabase';

export interface ServiceReport {
  id: string;
  assetName: string;
  type: string;
  regulation: string;
  location: string;
  status: string;
  lastServiceDate: string | null;
  nextServiceDueDate: string | null;
}

export const buildingService = {
  async getServiceReports(): Promise<ServiceReport[]> {
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
      lastServiceDate: item.last_service,
      nextServiceDueDate: item.next_service_due
    }));
  }
};