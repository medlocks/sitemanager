jest.mock('../lib/supabase');
import { auditService } from './auditService';
import { supabase } from '../lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://test.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(true),
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it('should fetch related audit data from incidents and assets', async () => {
    await auditService.getAuditData();

    expect(supabase.from).toHaveBeenCalledWith('incidents');
    expect(supabase.from).toHaveBeenCalledWith('assets');
    expect((supabase.from('') as any).select).toHaveBeenCalledWith(
      expect.stringContaining('profiles!assigned_to(name, specialism)')
    );
  });

  it('should correctly calculate monthly trends from created_at dates', () => {
    const mockData = [
      { created_at: '2026-01-15T10:00:00Z' },
      { created_at: '2026-01-20T10:00:00Z' },
      { created_at: '2026-02-05T10:00:00Z' }
    ];

    const trend = auditService.getMonthlyTrend(mockData);

    expect(trend.labels).toContain('Jan');
    expect(trend.labels).toContain('Feb');
    expect(trend.values[trend.labels.indexOf('Jan')]).toBe(2);
    expect(trend.values[trend.labels.indexOf('Feb')]).toBe(1);
  });

  it('should distribute trade specialisms correctly', () => {
    const mockIncidents = [
      { profiles: { specialism: 'Electrician' } },
      { profiles: { specialism: 'Plumbing' } },
      { profiles: { specialism: 'General' } }
    ];

    const distribution = auditService.getTradeDistribution(mockIncidents);

    expect(distribution.Elec).toBe(1);
    expect(distribution.Plumb).toBe(1);
    expect(distribution.Other).toBe(1);
  });

  it('should trigger expo-print and sharing for PDF generation', async () => {
    const mockData = [{ description: 'Test', status: 'Pending', created_at: '2026-01-01' }];
    
    await auditService.generateAuditPDF('Test Report', mockData, false);

    expect(Print.printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Test Report')
      })
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file://test.pdf', expect.any(Object));
  });
});