import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import { fileService } from './fileService';

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
    const state = await NetInfo.fetch();
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];
    
    let nextDueStr = null;
    if (formData.nextDueDate) {
      const d = new Date(formData.nextDueDate);
      nextDueStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
    }

    if (!state.isConnected) {
      await syncService.enqueue('work_order_resolutions', {
        userId,
        taskId: task.id,
        isAssetTask: task.isAssetTask,
        formData: { ...formData, resolvedAt: nowISO, nextDueStr }
      });
      return { offline: true };
    }

    let publicUrl = task.evidence_url || task.resolved_image_url;

    if (formData.evidenceFile) {
      const fileExt = formData.evidenceFile.uri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
      const fileName = `res_${task.id}_${Date.now()}.${fileExt}`;
      publicUrl = await fileService.uploadFile('incident-evidence', fileName, formData.evidenceFile.uri);
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
          signed_by_name: formData.signedByName
        })
        .eq('id', task.id);

      if (assetError) throw assetError;

      const { error: logError } = await supabase.from('maintenance_logs').insert([{
        asset_id: task.id,
        performed_by: userId,
        service_type: task.type || 'Statutory Maintenance',
        service_date: nowISO,
        next_due_date: nextDueStr || todayStr,
        notes: formData.resolutionNotes,
        remedial_actions: formData.remedialActions,
        evidence_url: publicUrl,
        certificate_url: publicUrl, // Matches your schema
        signature_url: formData.signedByName
      }]);
      
      if (logError) console.error("Maintenance Log Error:", logError);

    } else {
      const { error: resolveError } = await supabase
        .from('incidents')
        .update({ 
          status: 'Resolved', 
          resolution_notes: formData.resolutionNotes,
          remedial_actions: formData.remedialActions,
          signed_off_by: formData.signedByName,
          resolved_image_url: publicUrl,
          resolved_at: nowISO
        })
        .eq('id', task.id);

      if (resolveError) throw resolveError;
    }
    return true;
  }
};