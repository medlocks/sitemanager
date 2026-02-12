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
  fileService: { uploadFile: jest.fn() }
}));

describe('WorkOrderService', () => {
  const mockUserId = 'u123';
  const mockTask = { id: 'task_123', isAssetTask: true, description: 'Test Task' };
  const mockFormData = { 
    resolutionNotes: 'Fixed the broken sensor equipment', 
    remedialActions: 'Replaced wiring',
    signedByName: 'John Doe',
    nextDueDate: new Date('2027-01-01'),
    evidenceFile: { uri: 'file://img.jpg' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
      insert: mockInsert,
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis()
    });
  });

  it('should resolve task online correctly', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true }); 
    (fileService.uploadFile as jest.Mock).mockResolvedValue('https://url.com/img.jpg');

    const result = await workOrderService.resolveTask(mockUserId, mockTask, mockFormData);

    expect(result).toEqual({ success: true, offline: false });
    expect(supabase.from).toHaveBeenCalledWith('assets');
  });

  it('should enqueue task resolution when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const result = await workOrderService.resolveTask(mockUserId, mockTask, mockFormData);

    expect(result).toEqual({ success: true, offline: true });
    expect(syncService.enqueue).toHaveBeenCalled();
  });

  it('should fail validation if notes are too short', async () => {
    const result = await workOrderService.resolveTask(mockUserId, mockTask, { 
      ...mockFormData, 
      resolutionNotes: 'Fix' 
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Resolution notes are too short.');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});