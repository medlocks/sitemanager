import { syncService } from './syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { fileService } from './fileService';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../lib/supabase');
jest.mock('./fileService');

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  it('should enqueue and store items', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("[]");
    await syncService.enqueue('incidents', { desc: 'test' });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('incidents'));
  });

  it('should process storage uploads via fileService', async () => {
    const mockQueue = [{
      id: '1',
      table: 'storage_uploads',
      data: { bucket: 'b', path: 'p', base64Str: 'str' }
    }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));

    await syncService.syncNow();

    expect(fileService.uploadFile).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(expect.any(String), "[]");
  });

  it('should process settings as updates', async () => {
    const mockQueue = [{
      id: '2',
      table: 'site_settings_updates',
      data: { id: 1, strict_mode: true }
    }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));
    const mockUpdate = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    (supabase.from as jest.Mock).mockReturnValue(mockUpdate);

    await syncService.syncNow();

    expect(mockUpdate.eq).toHaveBeenCalledWith('id', 1);
  });
});