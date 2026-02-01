import { incidentService } from './incidentService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { fileService } from './fileService';
import { syncService } from './syncService';

jest.mock('../lib/supabase');
jest.mock('./syncService', () => ({
  syncService: { enqueue: jest.fn() }
}));

jest.mock('./fileService', () => ({
  fileService: {
    uploadIncidentEvidence: jest.fn().mockResolvedValue('test-image-url'),
    uploadFile: jest.fn().mockResolvedValue('test-path'),
  }
}));

describe('IncidentService', () => {
  const mockSupabaseChain = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  it('should upload image and insert record when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    await incidentService.createIncident('Leaking Valve', 'Plant Room', 'file://img.jpg', 'u123');

    expect(fileService.uploadIncidentEvidence).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('incidents');
    expect(mockSupabaseChain.insert).toHaveBeenCalled();
  });

  it('should queue locally when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    await incidentService.createIncident('Leaking Valve', 'Plant Room', 'file://img.jpg', 'u123');

    expect(syncService.enqueue).toHaveBeenCalledWith('incidents', expect.objectContaining({
      description: 'Leaking Valve',
      location: 'Plant Room'
    }));
    expect(fileService.uploadIncidentEvidence).not.toHaveBeenCalled();
  });
});