import { Alert, Clipboard } from 'react-native';
import { supabase } from '../lib/supabase';

export const privacyService = {
  async downloadMyData(userId: string) {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: assignments } = await supabase.from('incidents').select('*').eq('user_id', userId);

      const exportData = {
        generatedAt: new Date().toISOString(),
        profile,
        myLoggedItems: assignments || []
      };

      Clipboard.setString(JSON.stringify(exportData, null, 2));
      Alert.alert("GDPR Data Export", "Your personal data has been copied to your clipboard in JSON format.");
    } catch (error) {
      Alert.alert("Error", "Could not compile data export.");
    }
  }
};