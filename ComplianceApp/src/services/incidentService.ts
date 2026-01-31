import { supabase } from '../lib/supabase';
import { fileService } from './fileService';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export interface Incident {
  id: string;
  description: string;
  location: string;
  status: 'Pending' | 'Assigned' | 'Resolved' | 'High Risk';
  type: 'Reactive' | 'Planned' | 'Statutory';
  created_at: string;
  image_url?: string;
  user_id?: string;
  resolved_at?: string;
  resolved_image_url?: string;
  resolution_notes?: string;
  remedial_actions?: string;
  signed_off_by?: string;
}

export const incidentService = {
  async getIncidents(): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createIncident(
    description: string, 
    location: string, 
    imageUri?: string, 
    userId?: string, 
    status: Incident['status'] = 'Pending'
  ) {
    const dataToInsert: any = {
      description,
      location,
      status,
      type: description.includes('FRA') ? 'Statutory' : 'Reactive',
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      // Note: If offline, we pass the local imageUri to the queue. 
      // The syncService flusher must handle the file upload before the database insert.
      await syncService.enqueue('incidents', { ...dataToInsert, localImageUri: imageUri });
      return { offline: true };
    }

    let publicUrl = null;
    if (imageUri) {
      const fileName = `fault_${Date.now()}.jpg`;
      publicUrl = await fileService.uploadFile('incident-evidence', fileName, imageUri);
    }

    const { data, error } = await supabase
      .from('incidents')
      .insert([{ ...dataToInsert, image_url: publicUrl }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};