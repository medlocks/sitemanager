import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export interface Contractor {
  id: string;
  name: string;
  company?: string;
  specialism: string;
  qualifications?: string[];
  competence_status?: string;
  email?: string;
  competence_evidence_url?: string;
  rejection_reason?: string | null;
}

export const contractorService = {
  async getProfile(userId: string): Promise<Contractor> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSpecialism(userId: string, specialism: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('profiles_updates', { id: userId, specialism });
      return { offline: true };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ specialism })
      .eq('id', userId);

    if (error) throw error;
  },

  async submitCompetence(userId: string, url: string) {
    const updateData = { 
      competence_evidence_url: url, 
      competence_status: 'Pending', 
      rejection_reason: null 
    };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('profiles_updates', { id: userId, ...updateData });
      return { offline: true };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  },

  async getAllContractors(): Promise<Contractor[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Contractor');

    if (error) throw error;
    return data;
  },

  async updateContractorStatus(id: string, newStatus: string) {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue('profiles_updates', { id, competence_status: newStatus });
      return { offline: true };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ competence_status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getApprovedContractors(): Promise<Contractor[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Contractor')
      .eq('competence_status', 'Approved');

    if (error) throw error;
    return data;
  },

  async assignToJob(id: string, contractorId: string, isAsset: boolean) {
    const table = isAsset ? 'assets' : 'incidents';
    const updateData = { assigned_to: contractorId, status: 'Assigned' };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue(`${table}_updates`, { id, ...updateData });
      return { offline: true };
    }

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }
};