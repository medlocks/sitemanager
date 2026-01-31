import { supabase } from '../lib/supabase';
import { Alert, Clipboard } from 'react-native'; // Use standard RN Clipboard

export const privacyService = {
  async downloadMyData(userId: string | undefined) {
    if (!userId) {
      Alert.alert("Error", "User ID not found.");
      return;
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: assignments } = await supabase.from('incidents').select('*').eq('assigned_to', userId);
      
      const fullData = JSON.stringify({ 
        export_date: new Date().toISOString(),
        profile, 
        assignments 
      }, null, 2);

      Clipboard.setString(fullData);
      
      Alert.alert(
        "Data Exported", 
        "Your statutory data has been copied to your clipboard. You can now paste this into an email or document for your records."
      );
    } catch (e) {
      Alert.alert("Export Error", "Could not fetch data.");
    }
  }
};