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
      data: { bucket: 'evidence', userId: 'u123', fileUri: 'uri', fileName: 'file.pdf' }
    }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));

    await syncService.syncNow();

    expect(fileService.uploadCompetenceDocument).toHaveBeenCalledWith('u123', 'uri', 'file.pdf', true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(expect.any(String), "[]");
  });

  it('should process settings as updates', async () => {
    const mockQueue = [{
      id: '2',
      table: 'site_settings_updates',
      data: { id: 1, strict_mode: true }
    }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));
    
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

    await syncService.syncNow();

    expect(supabase.from).toHaveBeenCalledWith('site_settings');
    expect(mockEq).toHaveBeenCalledWith('id', 1);
  });

  it('should process deletions correctly', async () => {
    const mockQueue = [{
      id: '3',
      table: 'assets_deletions',
      data: { id: 'a123' }
    }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockQueue));

    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

    await syncService.syncNow();

    expect(supabase.from).toHaveBeenCalledWith('assets');
    expect(mockEq).toHaveBeenCalledWith('id', 'a123');
  });
});