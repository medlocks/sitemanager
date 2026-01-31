import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

jest.mock('../lib/supabase');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should alert user of pending tasks when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    const mockSelect = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 5, error: null })
    };
    (supabase.from as jest.Mock).mockReturnValue(mockSelect);

    await notificationService.checkPendingTasks();

    expect(Alert.alert).toHaveBeenCalledWith(
      "Statutory Reminder",
      expect.stringContaining('5 pending tasks')
    );
  });

  it('should register for push notifications', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'fake-token' });
    
    await notificationService.registerForPushNotifications('u123');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect((supabase.from('') as any).update).toHaveBeenCalledWith({ push_token: 'fake-token' });
  });

  it('should fetch notification logs', async () => {
    const mockData = [{ id: '1', title: 'Test' }];
    (supabase.from('') as any).order.mockResolvedValue({ data: mockData });

    const result = await notificationService.getNotificationLog('u123');
    
    expect(supabase.from).toHaveBeenCalledWith('site_notifications');
    expect(result).toEqual(mockData);
  });

  it('should mark all as read', async () => {
    await notificationService.markAllAsRead('u123');
    expect((supabase.from('') as any).update).toHaveBeenCalledWith({ is_read: true });
    expect((supabase.from('') as any).match).toHaveBeenCalledWith({ 
      recipient_id: 'u123', 
      is_read: false 
    });
  });
});