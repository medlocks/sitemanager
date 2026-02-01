import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { syncService } from './syncService';

export const fileService = {
  getMimeType(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    return 'image/jpeg';
  },

  async uploadFile(bucket: string, path: string, fileUri: string) {
    const state = await NetInfo.fetch();
    const contentType = this.getMimeType(path);

    if (!state.isConnected) {
      await syncService.enqueue('storage_uploads', {
        bucket,
        path,
        fileUri,
        contentType
      });
      // Return object for consistent offline state detection
      return { offline: true, path }; 
    }

    try {
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64Data), {
          contentType: contentType,
          upsert: true
        });

      if (error) throw error;
      return path;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  },

  async uploadIncidentEvidence(userId: string, fileUri: string, isSyncing = false) {
    const fileExt = fileUri.split('.').pop()?.split('?')[0].toLowerCase() || 'jpg';
    const fileName = `fault_${Date.now()}.${fileExt}`;
    return await this.uploadFile('incident-evidence', fileName, fileUri);
  },

  async uploadCompetenceDocument(userId: string, fileUri: string, originalName: string, isSyncing = false) {
    const state = await NetInfo.fetch();
    const bucket = 'evidence'; 
    const path = `${userId}-${Date.now()}.pdf`;

    if (!state.isConnected && !isSyncing) {
      await syncService.enqueue('storage_uploads', {
        userId,
        fileUri,
        fileName: path,
        bucket
      });
      return { offline: true, path };
    }

    try {
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64Data), {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) throw error;
      return path;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};