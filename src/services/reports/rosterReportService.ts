import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { Roster } from '@/types/roster';
import { format } from 'date-fns';

export interface RosterReportData {
  roster: Roster;
  certificates: Certificate[];
  statistics: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    emailed: number;
    emailSuccessRate: number;
  };
  courseBreakdown: Array<{
    courseName: string;
    count: number;
    percentage: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export class RosterReportService {
  static async generateRosterReport(rosterId: string): Promise<RosterReportData> {
    try {
      // Fetch roster details - no joins since there are no foreign keys
      const { data: rosterData, error: rosterError } = await supabase
        .from('rosters')
        .select('*')
        .eq('id', rosterId)
        .single();

      if (rosterError) throw rosterError;

      // Type the roster data properly and set related fields to undefined
      const roster: Roster = {
        ...rosterData,
        status: rosterData.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
        course: undefined,
        location: undefined,
        creator: undefined
      };

      // Fetch certificates for this roster
      const { data: certificates, error: certsError } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', rosterId);

      if (certsError) throw certsError;

      // Calculate statistics
      const stats = this.calculateStatistics(certificates || []);
      const courseBreakdown = this.calculateCourseBreakdown(certificates || []);
      const statusBreakdown = this.calculateStatusBreakdown(certificates || []);

      return {
        roster,
        certificates: certificates || [],
        statistics: stats,
        courseBreakdown,
        statusBreakdown
      };
    } catch (error) {
      console.error('Error generating roster report:', error);
      throw error;
    }
  }

  private static calculateStatistics(certificates: Certificate[]) {
    const total = certificates.length;
    const active = certificates.filter(c => c.status === 'ACTIVE').length;
    const expired = certificates.filter(c => c.status === 'EXPIRED').length;
    const revoked = certificates.filter(c => c.status === 'REVOKED').length;
    const emailed = certificates.filter(c => c.is_batch_emailed || c.email_status === 'SENT').length;
    
    return {
      total,
      active,
      expired,
      revoked,
      emailed,
      emailSuccessRate: total > 0 ? Math.round((emailed / total) * 100) : 0
    };
  }

  private static calculateCourseBreakdown(certificates: Certificate[]) {
    const courseCount = new Map<string, number>();
    const total = certificates.length;

    certificates.forEach(cert => {
      const courseName = cert.course_name;
      courseCount.set(courseName, (courseCount.get(courseName) || 0) + 1);
    });

    return Array.from(courseCount.entries()).map(([courseName, count]) => ({
      courseName,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  private static calculateStatusBreakdown(certificates: Certificate[]) {
    const statusCount = new Map<string, number>();
    const total = certificates.length;

    certificates.forEach(cert => {
      const status = cert.status;
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    return Array.from(statusCount.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  static async exportRosterReportToCSV(reportData: RosterReportData): Promise<string> {
    const { roster, certificates } = reportData;
    
    // CSV Header
    const headers = [
      'Recipient Name',
      'Course Name',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Email Status',
      'Verification Code',
      'Email Address'
    ];

    // CSV Rows
    const rows = certificates.map(cert => [
      cert.recipient_name,
      cert.course_name,
      cert.issue_date,
      cert.expiry_date,
      cert.status,
      (cert.is_batch_emailed || cert.email_status === 'SENT') ? 'Sent' : 'Not Sent',
      cert.verification_code,
      cert.recipient_email || ''
    ]);

    // Convert to CSV string
    const csvContent = [
      `# Roster Report: ${roster.name}`,
      `# Generated: ${format(new Date(), 'PPP p')}`,
      `# Total Certificates: ${certificates.length}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  static downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
