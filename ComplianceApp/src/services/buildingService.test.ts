jest.mock('../lib/supabase');
import { buildingService } from './buildingService';
import { supabase } from '../lib/supabase';

describe('BuildingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should fetch assets and map them to service report format', async () => {
    const mockAssets = [
      {
        id: '1',
        asset_name: 'Boiler A',
        type: 'HVAC',
        regulation: 'Gas Safe',
        location: 'Plant Room',
        status: 'Compliant',
        last_service: '2025-01-01',
        next_service_due: '2026-01-01'
      }
    ];

    (supabase.from('') as any).select.mockReturnThis();
    (supabase.from('') as any).order.mockResolvedValue({ data: mockAssets, error: null });

    const reports = await buildingService.getServiceReports();

    expect(supabase.from).toHaveBeenCalledWith('assets');
    expect((supabase.from('') as any).order).toHaveBeenCalledWith('next_service_due', { ascending: true });
    
    expect(reports[0]).toEqual({
      id: '1',
      assetName: 'Boiler A',
      type: 'HVAC',
      regulation: 'Gas Safe',
      location: 'Plant Room',
      status: 'Compliant',
      lastServiceDate: '2025-01-01',
      nextServiceDueDate: '2026-01-01'
    });
  });

  it('should throw error if supabase fetch fails', async () => {
    (supabase.from('') as any).order.mockResolvedValueOnce({ 
      data: null, 
      error: new Error('Network Failure') 
    });

    await expect(buildingService.getServiceReports()).rejects.toThrow('Network Failure');
  });
});