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
    const resolvedAt = new Date().toISOString();
    const nextDueStr = formData.nextDueDate.toISOString().split('T')[0];

    if (!state.isConnected) {
      const offlinePayload = {
        userId,
        taskId: task.id,
        isAssetTask: task.isAssetTask,
        formData: {
          ...formData,
          resolvedAt,
          nextDueStr,
          evidenceFileUri: formData.evidenceFile?.uri
        }
      };
      await syncService.enqueue('work_order_resolutions', offlinePayload);
      return { offline: true };
    }

    let publicUrl = task.evidence_url;

    if (formData.evidenceFile) {
      const fileName = `resolution_${task.id}_${Date.now()}.${formData.evidenceFile.name.split('.').pop()}`;
      publicUrl = await fileService.uploadFile('incident-evidence', fileName, formData.evidenceFile.uri);
    }

    if (task.isAssetTask) {
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: 'Compliant', 
          last_service_date: resolvedAt.split('T')[0],
          next_service_due: nextDueStr,
          evidence_url: publicUrl 
        })
        .eq('id', task.id);

      if (assetError) throw assetError;

      await supabase.from('maintenance_logs').insert([{
        asset_id: task.id,
        performed_by: userId,
        notes: formData.resolutionNotes,
        next_due_date: nextDueStr,
        evidence_url: publicUrl
      }]);

    } else {
      const { error: resolveError } = await supabase
        .from('incidents')
        .update({ 
          status: 'Resolved', 
          resolution_notes: formData.resolutionNotes,
          remedial_actions: formData.remedialActions,
          signed_off_by: formData.signedByName,
          resolved_image_url: publicUrl,
          resolved_at: resolvedAt
        })
        .eq('id', task.id);

      if (resolveError) throw resolveError;

      if (formData.requiresNextService) {
        await supabase.from('incidents').insert([{
          description: `PLANNED RENEWAL: ${task.description.replace('STATUTORY: ', '')}`,
          location: task.location,
          status: 'Pending',
          due_date: nextDueStr,
          type: 'Planned',
          user_id: userId
        }]);
      }
    }
    return true;
  }
};