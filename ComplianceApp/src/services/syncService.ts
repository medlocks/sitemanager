import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../lib/supabase";
import { fileService } from "./fileService";
import { InputValidator } from "../utils/InputValidator";

const QUEUE_KEY = "@audit_sync_queue";

interface SyncItem {
  id: string;
  table: string;
  data: any;
  timestamp: string;
}

export const syncService = {
  async enqueue(table: string, data: any) {
    const cleanTable = InputValidator.sanitize(table);
    const queue = await this.getQueue();

    const newItem: SyncItem = {
      id: Math.random().toString(36).substring(7),
      table: cleanTable,
      data,
      timestamp: new Date().toISOString(),
    };

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, newItem]));
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

    const failedIds: string[] = [];

    for (const item of queue) {
      try {
        if (item.table === "storage_uploads") {
          if (item.data.bucket === "incident-evidence") {
            await fileService.uploadIncidentEvidence(
              item.data.userId,
              item.data.fileUri,
              true,
            );
          } else {
            await fileService.uploadCompetenceDocument(
              item.data.userId,
              item.data.fileUri,
              item.data.fileName,
              true,
            );
          }
        } else if (item.table === "work_order_resolutions") {
          const { taskId, isAssetTask, formData } = item.data;
          const targetTable = isAssetTask ? "assets" : "incidents";
          const { error } = await supabase
            .from(targetTable)
            .update(formData)
            .eq("id", taskId);
          if (error) throw error;
        } else if (item.table.endsWith("_updates")) {
          const realTable = item.table.replace("_updates", "");
          const { id, ...updates } = item.data;
          const { error } = await supabase
            .from(realTable)
            .update(updates)
            .eq("id", id);
          if (error) throw error;
        } else if (item.table.endsWith("_deletions")) {
          const realTable = item.table.replace("_deletions", "");
          const { error } = await supabase
            .from(realTable)
            .delete()
            .eq("id", item.data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(item.table).insert([item.data]);
          if (error) throw error;
        }
      } catch (e) {
        failedIds.push(item.id);
      }
    }

    const finalQueue = queue.filter((i: SyncItem) => failedIds.includes(i.id));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(finalQueue));
  },
};
