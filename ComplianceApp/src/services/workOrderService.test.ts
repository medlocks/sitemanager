import { workOrderService } from './workOrderService';
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
    uploadFile: jest.fn()
  }
}));

describe('WorkOrderService', () => {
  const mockUserId = 'u123';
  
  const mockTask = { 
    id: 'task_123', 
    isAssetTask: true, 
    description: 'Test Task', 
    evidence_url: null 
  };
  
  const mockFormData = { 
    resolutionNotes: 'Fixed it', 
    nextDueDate: new Date('2027-01-01'),
    evidenceFile: { uri: 'file://img.jpg', name: 'img.jpg' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should resolve task online correctly', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true }); 
    (fileService.uploadFile as jest.Mock).mockResolvedValue('https://vault.url/img.jpg');

    await workOrderService.resolveTask(mockUserId, mockTask, mockFormData);

    expect(fileService.uploadFile).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('assets');
    expect(supabase.from).toHaveBeenCalledWith('maintenance_logs');
  });

  it('should enqueue task resolution when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    await workOrderService.resolveTask(mockUserId, mockTask, mockFormData);

    expect(syncService.enqueue).toHaveBeenCalledWith(
      'work_order_resolutions', 
      expect.objectContaining({ userId: mockUserId })
    );
  });
});