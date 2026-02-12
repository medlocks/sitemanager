import { supabase } from '../lib/supabase';
import { InputValidator } from '../utils/InputValidator';

export type UserRole = 'Manager' | 'Employee' | 'Contractor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAuthorised: boolean;
}

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    const cleanEmail = InputValidator.sanitize(email);
    
    if (!InputValidator.isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed: No user found.');

    const profile = await this.getProfile(authData.user.id);
    
    if (!profile) {
      throw new Error('Access Denied: No profile associated with this account.');
    }

    return {
      ...profile,
      email: authData.user.email || profile.email
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(uid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.id === uid ? user.email : '';

    return {
      id: uid,
      email: email || '',
      name: data.name || 'User',
      role: data.role as UserRole,
      isAuthorised: true
    };
  }
};