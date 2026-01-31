import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

export const fileService = {
  async uploadCompetenceDocument(userId: string, fileUri: string, fileName: string) {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      await syncService.enqueue('storage_uploads', {
        userId,
        fileUri,
        fileName,
        bucket: 'evidence'
      });
      return { offline: true, localUri: fileUri };
    }

    const fileExt = fileName.split('.').pop();
    const path = `${userId}-${Date.now()}.${fileExt}`;

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(path, blob);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('evidence')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  async uploadFile(bucket: string, path: string, base64Str: string) {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      await syncService.enqueue('storage_uploads', {
        bucket,
        path,
        base64Str,
        contentType: 'image/jpeg'
      });
      return { offline: true, path };
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64Str), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }
};