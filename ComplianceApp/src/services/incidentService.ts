import { supabase } from '../lib/supabase';
import { fileService } from './fileService';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import { InputValidator } from '../utils/InputValidator';

export interface Incident {
  id: string;
  description: string;
  location: string;
  status: 'Pending' | 'Assigned' | 'Resolved' | 'High Risk';
  type: 'Reactive' | 'Planned' | 'Statutory';
  created_at: string;
  image_url?: string | null;
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
    const cleanDescription = InputValidator.sanitize(description);
    const cleanLocation = InputValidator.sanitize(location);

    const validation = InputValidator.validateIncident(cleanDescription, cleanLocation);

    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const dataToInsert = {
      description: cleanDescription,
      location: cleanLocation,
      status,
      type: cleanDescription.includes('FRA') ? 'Statutory' : 'Reactive',
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      await syncService.enqueue('incidents', { ...dataToInsert, localImageUri: imageUri });
      return { success: true, offline: true, message: 'Incident saved to offline queue' };
    }

    let imageUrl = null;
    if (imageUri) {
      try {
        imageUrl = await fileService.uploadIncidentEvidence(userId || 'anon', imageUri);
      } catch (uploadError) {
        return { success: false, error: 'Failed to upload image.' };
      }
    }

    const { data, error } = await supabase
      .from('incidents')
      .insert([{ ...dataToInsert, image_url: imageUrl }])
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Database error. Please try again.' };
    }

    return { success: true, data, offline: false };
  }
};