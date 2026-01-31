import { incidentService } from './incidentService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { fileService } from './fileService'; // Changed
import { syncService } from './syncService';

jest.mock('../lib/supabase');
jest.mock('./syncService', () => ({
  syncService: { enqueue: jest.fn() }
}));

// Changed mock
jest.mock('./fileService', () => ({
  fileService: {
    uploadFile: jest.fn()
  }
}));

describe('IncidentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should upload image and insert record when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (fileService.uploadFile as jest.Mock).mockResolvedValue('https://fake.url/img.jpg');

    await incidentService.createIncident('Leaking Valve', 'Plant Room', 'file://img.jpg', 'u123');

    expect(fileService.uploadFile).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('incidents');
  });
});