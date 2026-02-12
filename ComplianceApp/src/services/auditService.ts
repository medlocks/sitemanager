import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../theme';
import { InputValidator } from '../utils/InputValidator';

export type TradeKey = 'Elec' | 'Plumb' | 'Fire' | 'Gas' | 'Other';

export const auditService = {
  async getAuditData() {
    const { data: incidents, error: incError } = await supabase
      .from('incidents')
      .select('*, profiles!assigned_to(name, specialism)')
      .order('created_at', { ascending: false });

    const { data: assets, error: astError } = await supabase
      .from('assets')
      .select('*, profiles!assigned_to(name, specialism)')
      .order('next_service_due', { ascending: true });

    const { data: accidents, error: accError } = await supabase
      .from('accidents')
      .select('*, profiles:user_id(name)')
      .order('date_time', { ascending: false });

    if (incError) throw incError;
    if (astError) throw astError;
    if (accError) throw accError;

    return { 
      incidents: incidents || [], 
      assets: assets || [],
      accidents: accidents || [] 
    };
  },

  getMonthlyTrend(data: any[]) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at || item.date_time);
      if (!isNaN(date.getTime())) {
        const month = months[date.getMonth()];
        counts[month] = (counts[month] || 0) + 1;
      }
    });

    return {
      labels: Object.keys(counts),
      values: Object.values(counts)
    };
  },

  getTradeDistribution(incidents: any[]) {
    const counts: Record<TradeKey, number> = { 'Elec': 0, 'Plumb': 0, 'Fire': 0, 'Gas': 0, 'Other': 0 };
    incidents.forEach(item => {
      const spec = (item.profiles?.specialism || '').toLowerCase();
      if (spec.includes('elec')) counts['Elec']++;
      else if (spec.includes('plumb')) counts['Plumb']++;
      else if (spec.includes('fire')) counts['Fire']++;
      else if (spec.includes('gas')) counts['Gas']++;
      else counts['Other']++;
    });
    return counts;
  },

  async generateAuditPDF(title: string, data: any[], isAsset: boolean) {
  const cleanTitle = InputValidator.sanitize(title);

  if (!data || data.length === 0) {
    Alert.alert("Export Error", "No data available to export. Please check your internet or RLS settings.");
    return;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB');
  };

  const html = `
    <html>
      <body style="font-family: Arial; padding: 40px;">
        <h1 style="color: ${COLORS.primary};">${cleanTitle}</h1>
        <p>Generated: ${new Date().toLocaleString('en-GB')}</p>
        <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px;">Subject</th>
            <th style="padding: 10px;">Logged/Last Done</th>
            <th style="padding: 10px;">Location/Specialist</th>
            <th style="padding: 10px;">Status</th>
          </tr>
          ${data.map(item => {
            const subject = item.injured_person_name || item.asset_name || item.description || 'General Log';
            
            const primaryDate = item.date_time || item.last_service || item.created_at;
            
            const thirdCol = isAsset 
              ? formatDate(item.next_service_due) 
              : (item.location || item.profiles?.name || 'Site');

            return `
              <tr>
                <td style="padding: 8px;">${InputValidator.sanitize(String(subject))}</td>
                <td style="padding: 8px;">${formatDate(primaryDate)}</td>
                <td style="padding: 8px;">${InputValidator.sanitize(String(thirdCol))}</td>
                <td style="padding: 8px;">${InputValidator.sanitize(item.status || 'Reported')}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (e) {
    Alert.alert("Export Error", "Failed to generate PDF.");
  }
}
};