import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import { fileService } from './fileService';
import { InputValidator } from '../utils/InputValidator';

export const workOrderService = {
  async getAssignedTasks(userId: string) {
    const { data: incidents, error: incError } = await supabase
      .from('incidents')
      .select('*')
      .eq('assigned_to', userId)
      .neq('status', 'Resolved');

    const { data: assets, error: astError } = await supabase
      .from('assets')
      .select('*')
      .eq('assigned_to', userId)
      .neq('status', 'Compliant');

    if (incError) throw incError;
    if (astError) throw astError;

    return [
      ...(incidents || []).map(i => ({ ...i, isAssetTask: false })),
      ...(assets || []).map(a => ({ 
        ...a, 
        isAssetTask: true, 
        description: `STATUTORY: ${a.asset_name}`, 
        location: a.location || 'Site Facility' 
      }))
    ];
  },

  async resolveTask(userId: string, task: any, formData: any) {
    const cleanNotes = InputValidator.sanitize(formData.resolutionNotes);
    const cleanActions = InputValidator.sanitize(formData.remedialActions);
    const cleanSignedBy = InputValidator.sanitize(formData.signedByName);

    if (cleanNotes.length < 5) {
      return { success: false, error: 'Resolution notes are too short.' };
    }
    if (!cleanSignedBy) {
      return { success: false, error: 'Signature name is required.' };
    }

    const state = await NetInfo.fetch();
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];
    
    let nextDueStr = null;
    if (formData.nextDueDate) {
      const d = new Date(formData.nextDueDate);
      if (!isNaN(d.getTime())) {
        nextDueStr = d.toISOString().split('T')[0];
        
        const validation = InputValidator.validateAsset('Task', nextDueStr);
        if (!validation.isValid) {
           return { success: false, error: validation.errors[0] };
        }
      }
    }

    const cleanFormData = {
      ...formData,
      resolutionNotes: cleanNotes,
      remedialActions: cleanActions,
      signedByName: cleanSignedBy,
      resolvedAt: nowISO,
      nextDueStr
    };

    if (!state.isConnected) {
      await syncService.enqueue('work_order_resolutions', {
        userId,
        taskId: task.id,
        isAssetTask: task.isAssetTask,
        formData: cleanFormData
      });
      return { success: true, offline: true };
    }

    let publicUrl = task.evidence_url || task.resolved_image_url;

    if (formData.evidenceFile) {
      try {
        const fileExt = formData.evidenceFile.uri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
        const fileName = `res_${task.id}_${Date.now()}.${fileExt}`;
        publicUrl = await fileService.uploadFile('incident-evidence', fileName, formData.evidenceFile.uri);
      } catch (e) {
        return { success: false, error: 'Failed to upload evidence.' };
      }
    }

    if (task.isAssetTask) {
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: 'Compliant', 
          last_service: todayStr,
          next_service_due: nextDueStr,
          evidence_url: publicUrl,
          signed_off_by: userId,
          signed_by_name: cleanSignedBy
        })
        .eq('id', task.id);

      if (assetError) throw assetError;

      const { error: logError } = await supabase.from('maintenance_logs').insert([{
        asset_id: task.id,
        performed_by: userId,
        service_type: task.type || 'Statutory Maintenance',
        service_date: nowISO,
        next_due_date: nextDueStr || todayStr,
        notes: cleanNotes,
        remedial_actions: cleanActions,
        evidence_url: publicUrl,
        certificate_url: publicUrl,
        signature_url: cleanSignedBy
      }]);
      
      if (logError) console.error("Maintenance Log Error:", logError);

    } else {
      const { error: resolveError } = await supabase
        .from('incidents')
        .update({ 
          status: 'Resolved', 
          resolution_notes: cleanNotes,
          remedial_actions: cleanActions,
          signed_off_by: cleanSignedBy,
          resolved_image_url: publicUrl,
          resolved_at: nowISO
        })
        .eq('id', task.id);

      if (resolveError) throw resolveError;
    }
    
    return { success: true, offline: false };
  }
};