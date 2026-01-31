import { authService } from './authService';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should call signInWithPassword with correct credentials', async () => {
    const email = 'test@raytheon.com';
    const password = 'password123';
    
    await authService.signIn(email, password);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password,
    });
  });

  it('should fetch and format profile data correctly', async () => {
    const mockProfile = { name: 'Blake', role: 'Manager' };
    
    (supabase.from('') as any).maybeSingle.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    });

    const result = await authService.getProfile('uid_123');

    expect(result).toEqual({
      id: 'uid_123',
      name: 'Blake',
      role: 'Manager',
      isAuthorized: true
    });
  });

  it('should return null if no profile exists', async () => {
    (supabase.from('') as any).maybeSingle.mockResolvedValue({ 
      data: null, 
      error: null 
    });

    const result = await authService.getProfile('missing_uid');
    expect(result).toBeNull();
  });
});