import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed: No user found.');

    const profile = await this.getProfile(authData.user.id);
    
    if (!profile) {
      throw new Error('Access Denied: No profile associated with this account.');
    }

    return profile;
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

    return {
      id: uid,
      name: data.name || 'User',
      role: data.role as UserRole,
      isAuthorized: true
    };
  }
};