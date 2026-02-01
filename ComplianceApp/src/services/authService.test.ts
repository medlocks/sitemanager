import { authService } from './authService';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should call signInWithPassword and then fetch the user profile', async () => {
    const mockAuthUser = { id: 'u123', email: 'test@raytheon.com' };
    const mockProfile = { name: 'Blake', role: 'Manager' };

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });

    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    const result = await authService.signIn('test@raytheon.com', 'password123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@raytheon.com',
      password: 'password123',
    });
    
    expect(result.role).toBe('Manager');
    expect(result.name).toBe('Blake');
  });

  it('should throw error if auth succeeds but profile is missing', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'u999' } },
      error: null,
    });

    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    await expect(authService.signIn('bad@user.com', 'pass'))
      .rejects
      .toThrow('Access Denied: No profile associated with this account.');
  });

  it('should call signOut', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    await authService.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});