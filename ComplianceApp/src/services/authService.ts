import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
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