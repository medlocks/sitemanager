import { settingsService } from './settingsService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

jest.mock('../lib/supabase');
jest.mock('./syncService', () => ({
  syncService: { enqueue: jest.fn() }
}));

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    });
  });

  it('should fetch settings correctly', async () => {
    const mockSettings = { strict_mode: true, global_min_clearance: '2.5m' };
    (supabase.from('') as any).single.mockResolvedValue({ data: mockSettings, error: null });

    const result = await settingsService.getSettings();

    expect(supabase.from).toHaveBeenCalledWith('site_settings');
    expect(result).toEqual(mockSettings);
  });

  it('should update settings online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (supabase.from('') as any).update.mockReturnThis(); 
    (supabase.from('') as any).eq.mockResolvedValue({ error: null });

    const result = await settingsService.updateSettings({ strict_mode: false });

    expect(result).toBe(true);
    expect((supabase.from('') as any).update).toHaveBeenCalledWith(
      expect.objectContaining({ strict_mode: false, updated_at: expect.any(String) })
    );
    expect((supabase.from('') as any).eq).toHaveBeenCalledWith('id', 1);
  });

  it('should enqueue settings update when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const result = await settingsService.updateSettings({ global_min_clearance: '3.0m' });

    expect(result).toEqual({ offline: true });
    expect(syncService.enqueue).toHaveBeenCalledWith(
      'site_settings_updates',
      expect.objectContaining({ id: 1, global_min_clearance: '3.0m' })
    );
  });

  it('should throw error on fetch failure', async () => {
    (supabase.from('') as any).single.mockResolvedValue({ data: null, error: new Error('DB Error') });

    await expect(settingsService.getSettings()).rejects.toThrow('DB Error');
  });
});