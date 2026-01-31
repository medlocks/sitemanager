import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { fileService } from './fileService';

const QUEUE_KEY = '@audit_sync_queue';

export const syncService = {
  async enqueue(table: string, data: any) {
    const queue = await this.getQueue();
    const newItem = { 
      id: Math.random().toString(36).substring(7), 
      table, 
      data, 
      timestamp: new Date().toISOString() 
    };
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, newItem]));
    console.log(`Action queued for ${table}`);
  },

  async getQueue() {
    const queue = await AsyncStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },

  async syncNow() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    let queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items...`);

    for (const item of queue) {
      try {
        if (item.table === 'storage_uploads') {
          if (item.data.base64Str) {
            await fileService.uploadFile(item.data.bucket, item.data.path, item.data.base64Str);
          } else if (item.data.fileUri) {
            await fileService.uploadCompetenceDocument(item.data.userId, item.data.fileUri, item.data.fileName);
          }
        } else if (item.table === 'site_settings_updates') {
          const { error } = await supabase.from('site_settings').update(item.data).eq('id', item.data.id);
          if (error) throw error;
        } else if (item.table === 'work_order_resolutions') {
          const { taskId, isAssetTask, formData } = item.data;
          const targetTable = isAssetTask ? 'assets' : 'incidents';
          const { error } = await supabase.from(targetTable).update(formData).eq('id', taskId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(item.table).insert([item.data]);
          if (error) throw error;
        }

        queue = queue.filter((i: any) => i.id !== item.id);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      } catch (e) {
        console.error(`Failed to sync item ${item.id}, staying in queue`, e);
        return; 
      }
    }

    console.log("Sync session complete.");
  }
};