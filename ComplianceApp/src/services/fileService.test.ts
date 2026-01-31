import { fileService } from './fileService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

jest.mock('../lib/supabase');
jest.mock('./syncService', () => ({
  syncService: { enqueue: jest.fn() }
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

    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue({ size: 1024, type: 'application/pdf' })
    });
  });

  it('should upload base64 image online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockUpload.mockResolvedValue({ data: { path: 'test' }, error: null });
    mockGetUrl.mockReturnValue({ data: { publicUrl: 'http://url.com' } });

    const result = await fileService.uploadFile('bucket', 'path.jpg', 'base64string');
    
    expect(result).toBe('http://url.com');
    expect(mockUpload).toHaveBeenCalled();
  });

  it('should upload document URI online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    mockUpload.mockResolvedValue({ data: { path: 'test' }, error: null });
    mockGetUrl.mockReturnValue({ data: { publicUrl: 'http://url.com' } });

    const result = await fileService.uploadCompetenceDocument('u1', 'file://test.pdf', 'test.pdf');
    
    expect(result).toBe('http://url.com');
    expect(global.fetch).toHaveBeenCalledWith('file://test.pdf');
  });

  it('should enqueue when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    
    await fileService.uploadFile('bucket', 'path.jpg', 'base64');
    
    expect(syncService.enqueue).toHaveBeenCalledWith('storage_uploads', expect.any(Object));
  });
});