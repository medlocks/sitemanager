jest.mock('../lib/supabase');
import { accidentService } from './accidentService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

jest.mock('./syncService', () => ({
  syncService: {
    enqueue: jest.fn()
  }
}));

describe('AccidentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should fetch accidents with reporter names', async () => {
    await accidentService.getAccidents();
    
    expect(supabase.from).toHaveBeenCalledWith('accidents');
    expect((supabase.from('') as any).select).toHaveBeenCalledWith(expect.stringContaining('reporter:user_id (name)'));
    expect((supabase.from('') as any).order).toHaveBeenCalledWith('date_time', { ascending: false });
  });

  it('should insert accident record when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    const mockData = { type: 'Fall', location: 'Warehouse' };

    const result = await accidentService.logAccident(mockData);

    expect(supabase.from).toHaveBeenCalledWith('accidents');
    expect((supabase.from('') as any).insert).toHaveBeenCalledWith([mockData]);
    expect(result).toBe(true);
  });

  it('should queue accident data in syncService when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    const mockData = { type: 'Cut', severity: 'Low' };

    const result = await accidentService.logAccident(mockData);

    expect(syncService.enqueue).toHaveBeenCalledWith('accidents', mockData);
    expect(result).toEqual({ offline: true });
  });

  it('should throw error if supabase insert fails', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (supabase.from('') as any).insert.mockResolvedValueOnce({ error: new Error('DB Error') });

    await expect(accidentService.logAccident({})).rejects.toThrow('DB Error');
  });
});