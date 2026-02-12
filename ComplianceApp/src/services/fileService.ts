import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { syncService } from './syncService';
import { InputValidator } from '../utils/InputValidator';

export const fileService = {
  getMimeType(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    return 'image/jpeg';
  },

  async uploadFile(bucket: string, path: string, fileUri: string) {
    const cleanBucket = InputValidator.sanitize(bucket);
    const cleanPath = InputValidator.sanitize(path);
    
    const state = await NetInfo.fetch();
    const contentType = this.getMimeType(cleanPath);

    if (!state.isConnected) {
      await syncService.enqueue('storage_uploads', {
        bucket: cleanBucket,
        path: cleanPath,
        fileUri,
        contentType
      });
      return { offline: true, path: cleanPath }; 
    }

    try {
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      const { error } = await supabase.storage
        .from(cleanBucket)
        .upload(cleanPath, decode(base64Data), {
          contentType: contentType,
          upsert: true
        });

      if (error) throw error;
      return cleanPath;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  },

  async uploadIncidentEvidence(userId: string, fileUri: string, isSyncing = false) {
    const fileExt = fileUri.split('.').pop()?.split('?')[0].toLowerCase() || 'jpg';
    
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(fileExt)) {
      throw new Error('Invalid file type. Only images (JPG, PNG) are allowed.');
    }

    const fileName = `fault_${Date.now()}.${fileExt}`;
    return await this.uploadFile('incident-evidence', fileName, fileUri);
  },

  async uploadCompetenceDocument(userId: string, fileUri: string, originalName: string, isSyncing = false) {
    const cleanUserId = InputValidator.sanitize(userId);
    const state = await NetInfo.fetch();
    const bucket = 'evidence'; 
    const path = `${cleanUserId}-${Date.now()}.pdf`;

    if (!state.isConnected && !isSyncing) {
      await syncService.enqueue('storage_uploads', {
        userId: cleanUserId,
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