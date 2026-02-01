import { fileService } from './fileService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../lib/supabase');
jest.mock('./syncService', () => ({
  syncService: { enqueue: jest.fn() }
}));
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data')
}));

describe('FileService', () => {
  const mockUpload = jest.fn();
  const mockGetUrl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetUrl
    });
  });

  it('should upload incident evidence online and return filename', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockUpload.mockResolvedValue({ data: { path: 'fault_123.jpg' }, error: null });

    const result = await fileService.uploadIncidentEvidence('user123', 'file://test-image.jpg');
    
    // Result should be a string (the path) when online
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^fault_\d+\.jpg$/);
    expect(supabase.storage.from).toHaveBeenCalledWith('incident-evidence');
  });

  it('should upload base64 file and return path', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockUpload.mockResolvedValue({ data: { path: 'path.jpg' }, error: null });

    const result = await fileService.uploadFile('incident-evidence', 'path.jpg', 'file://path.jpg');
    
    expect(result).toBe('path.jpg');
    expect(mockUpload).toHaveBeenCalled();
  });

  it('should enqueue to incident-evidence bucket when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    
    const result = await fileService.uploadIncidentEvidence('user123', 'file://test.jpg');
    
    // Check that we received the offline object
    expect(result).toHaveProperty('offline', true);
    expect(result).toHaveProperty('path', expect.stringMatching(/^fault_\d+\.jpg$/));
    
    expect(syncService.enqueue).toHaveBeenCalledWith('storage_uploads', expect.objectContaining({
      bucket: 'incident-evidence'
    }));
  });

  it('should handle PDF content type correctly', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockUpload.mockResolvedValue({ data: { path: 'fault_123.pdf' }, error: null });

    await fileService.uploadIncidentEvidence('user123', 'file://test.pdf');

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('.pdf'),
      expect.any(Object),
      expect.objectContaining({ contentType: 'application/pdf' })
    );
  });
});