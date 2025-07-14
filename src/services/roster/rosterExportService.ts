import { supabase } from '@/integrations/supabase/client';

export interface CertificateRequestExportData {
  recipient_name: string;
  recipient_email: string;
  phone: string;
  company: string;
  city: string;
  province: string;
  postal_code: string;
  course_name: string;
  first_aid_level: string;
  cpr_level: string;
  length: number;
  instructor_name: string;
  location_id: string;
  issue_date: string;
  expiry_date: string;
  assessment_status: 'PASS' | 'FAIL' | 'PENDING';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  batch_name?: string;
  roster_id: string;
  notes?: string;
  practical_score?: number;
  written_score?: number;
  total_score?: number;
  completion_date?: string;
  online_completion_date?: string;
  practical_completion_date?: string;
}

export interface BatchUploadData {
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'Company': string;
  'City': string;
  'Province': string;
  'Postal Code': string;
  'Course Name': string;
  'First Aid Level': string;
  'CPR Level': string;
  'Course Length': number;
  'Instructor Name': string;
  'Location': string;
  'Issue Date': string;
  'Expiry Date': string;
  'Assessment Status': string;
  'Notes': string;
}

export interface ExportOptions {
  format: 'certificate_requests' | 'batch_upload' | 'csv';
  includeCompleted?: boolean;
  includePending?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  customFields?: string[];
}

export class RosterExportService {
  /**
   * Export roster data in certificate_requests format for direct database insertion
   */
  static async exportForCertificateRequests(
    rosterId: string, 
    options: Partial<ExportOptions> = {}
  ): Promise<CertificateRequestExportData[]> {
    try {
      // Get roster details
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select(`
          *,
          locations(name, city, state),
          profiles!student_rosters_instructor_id_fkey(display_name)
        `)
        .eq('id', rosterId)
        .single();

      if (rosterError) throw rosterError;

      // Get roster enrollments with student details
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('roster_enrollments')
        .select(`
          *,
          student_enrollment_profiles!inner(
            first_name,
            last_name,
            email,
            phone,
            company,
            city,
            province,
            postal_code,
            first_aid_level,
            cpr_level,
            course_length,
            instructor_name,
            assessment_status,
            completion_status,
            notes,
            online_completed_at,
            practical_completed_at
          )
        `)
        .eq('roster_id', rosterId);

      if (enrollmentsError) throw enrollmentsError;

      // Calculate expiry date (3 years from issue)
      const issueDate = new Date();
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      // Transform data to certificate requests format
      const certificateData: CertificateRequestExportData[] = enrollments
        .filter(enrollment => {
          const profile = enrollment.student_enrollment_profiles;
          if (options.includeCompleted === false && profile.completion_status === 'COMPLETED') {
            return false;
          }
          if (options.includePending === false && profile.completion_status !== 'COMPLETED') {
            return false;
          }
          return true;
        })
        .map(enrollment => {
          const profile = enrollment.student_enrollment_profiles;
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          
          return {
            recipient_name: fullName,
            recipient_email: profile.email || '',
            phone: profile.phone || '',
            company: profile.company || '',
            city: profile.city || '',
            province: profile.province || '',
            postal_code: profile.postal_code || '',
            course_name: roster.course_name,
            first_aid_level: profile.first_aid_level || '',
            cpr_level: profile.cpr_level || '',
            length: profile.course_length || 0,
            instructor_name: profile.instructor_name || roster.profiles?.display_name || '',
            location_id: roster.location_id || '',
            issue_date: issueDate.toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            assessment_status: (profile.assessment_status || 'PENDING') as 'PASS' | 'FAIL' | 'PENDING',
            status: 'PENDING' as const,
            batch_name: `${roster.roster_name}-${new Date().toISOString().split('T')[0]}`,
            roster_id: rosterId,
            notes: profile.notes || enrollment.notes || '',
            completion_date: profile.practical_completed_at || profile.online_completed_at || undefined,
            online_completion_date: profile.online_completed_at || undefined,
            practical_completion_date: profile.practical_completed_at || undefined
          };
        });

      return certificateData;
    } catch (error) {
      console.error('Error exporting for certificate requests:', error);
      throw error;
    }
  }

  /**
   * Export roster data in batch upload CSV format
   */
  static async exportForBatchUpload(
    rosterId: string, 
    options: Partial<ExportOptions> = {}
  ): Promise<BatchUploadData[]> {
    try {
      const certificateData = await this.exportForCertificateRequests(rosterId, options);

      // Transform to batch upload format
      const batchUploadData: BatchUploadData[] = certificateData.map(cert => {
        const [firstName, ...lastNameParts] = cert.recipient_name.split(' ');
        const lastName = lastNameParts.join(' ');

        return {
          'First Name': firstName || '',
          'Last Name': lastName || '',
          'Email': cert.recipient_email,
          'Phone': cert.phone,
          'Company': cert.company,
          'City': cert.city,
          'Province': cert.province,
          'Postal Code': cert.postal_code,
          'Course Name': cert.course_name,
          'First Aid Level': cert.first_aid_level,
          'CPR Level': cert.cpr_level,
          'Course Length': cert.length,
          'Instructor Name': cert.instructor_name,
          'Location': cert.location_id, // Will be resolved to location name in final export
          'Issue Date': cert.issue_date,
          'Expiry Date': cert.expiry_date,
          'Assessment Status': cert.assessment_status,
          'Notes': cert.notes || ''
        };
      });

      return batchUploadData;
    } catch (error) {
      console.error('Error exporting for batch upload:', error);
      throw error;
    }
  }

  /**
   * Generate CSV content from data
   */
  static generateCSV(data: any[], headers?: string[]): string {
    if (data.length === 0) return '';

    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = data.map(row => 
      csvHeaders.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders.join(','), ...csvRows].join('\n');
  }

  /**
   * Create certificate requests directly in database from roster
   */
  static async createCertificateRequestsFromRoster(
    rosterId: string,
    options: Partial<ExportOptions> = {}
  ): Promise<{ success: number; errors: string[] }> {
    try {
      const certificateData = await this.exportForCertificateRequests(rosterId, options);
      
      if (certificateData.length === 0) {
        return { success: 0, errors: ['No eligible students found in roster'] };
      }

      // Insert certificate requests
      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(certificateData)
        .select('id');

      if (error) throw error;

      // Log the export
      const { error: logError } = await supabase
        .from('roster_export_logs')
        .insert([{
          roster_id: rosterId,
          export_format: 'CERTIFICATE_REQUESTS',
          exported_by: (await supabase.auth.getUser()).data.user?.id,
          export_status: 'COMPLETED',
          file_name: `certificate-requests-${rosterId}-${new Date().toISOString().split('T')[0]}`,
          export_data: { 
            records_created: data?.length || 0,
            options 
          }
        }]);

      if (logError) {
        console.error('Failed to log export:', logError);
      }

      return { success: data?.length || 0, errors: [] };
    } catch (error) {
      console.error('Error creating certificate requests:', error);
      return { 
        success: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  /**
   * Export roster with full validation and options
   */
  static async exportRoster(
    rosterId: string,
    format: ExportOptions['format'] = 'csv',
    options: Partial<ExportOptions> = {}
  ): Promise<{
    data: any[];
    csvContent?: string;
    filename: string;
    recordCount: number;
  }> {
    try {
      let data: any[];
      let filename: string;

      switch (format) {
        case 'certificate_requests':
          data = await this.exportForCertificateRequests(rosterId, options);
          filename = `certificate-requests-${rosterId}-${new Date().toISOString().split('T')[0]}.json`;
          break;
        
        case 'batch_upload':
          data = await this.exportForBatchUpload(rosterId, options);
          filename = `batch-upload-${rosterId}-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        
        default: // csv
          data = await this.exportForBatchUpload(rosterId, options);
          filename = `roster-export-${rosterId}-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      const csvContent = format !== 'certificate_requests' 
        ? this.generateCSV(data) 
        : JSON.stringify(data, null, 2);

      // Log the export
      const { error: logError } = await supabase
        .from('roster_export_logs')
        .insert([{
          roster_id: rosterId,
          export_format: format.toUpperCase(),
          exported_by: (await supabase.auth.getUser()).data.user?.id,
          export_status: 'COMPLETED',
          file_name: filename,
          export_data: { 
            record_count: data.length,
            options,
            format
          }
        }]);

      if (logError) {
        console.error('Failed to log export:', logError);
      }

      return {
        data,
        csvContent,
        filename,
        recordCount: data.length
      };
    } catch (error) {
      console.error('Error exporting roster:', error);
      throw error;
    }
  }

  /**
   * Validate roster data for export readiness
   */
  static async validateRosterForExport(rosterId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    studentCount: number;
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Get roster and enrollments
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('*')
        .eq('id', rosterId)
        .single();

      if (rosterError) {
        errors.push('Roster not found');
        return { isValid: false, errors, warnings, studentCount: 0 };
      }

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('roster_enrollments')
        .select(`
          *,
          student_enrollment_profiles!inner(
            first_name,
            last_name,
            email,
            assessment_status,
            completion_status
          )
        `)
        .eq('roster_id', rosterId);

      if (enrollmentsError) {
        errors.push('Failed to fetch roster enrollments');
        return { isValid: false, errors, warnings, studentCount: 0 };
      }

      const studentCount = enrollments.length;

      if (studentCount === 0) {
        errors.push('Roster has no enrolled students');
      }

      // Validate required fields
      enrollments.forEach((enrollment, index) => {
        const profile = enrollment.student_enrollment_profiles;
        const studentRef = `Student ${index + 1}`;

        if (!profile.first_name || !profile.last_name) {
          errors.push(`${studentRef}: Missing first or last name`);
        }

        if (!profile.email) {
          errors.push(`${studentRef}: Missing email address`);
        }

        if (profile.assessment_status === 'PENDING') {
          warnings.push(`${studentRef}: Assessment status is still pending`);
        }

        if (profile.completion_status !== 'COMPLETED') {
          warnings.push(`${studentRef}: Course not marked as completed`);
        }
      });

      // Validate roster details
      if (!roster.course_name) {
        errors.push('Roster missing course name');
      }

      if (!roster.instructor_id && !roster.course_name.includes('instructor')) {
        warnings.push('No instructor assigned to roster');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        studentCount
      };
    } catch (error) {
      console.error('Error validating roster:', error);
      return {
        isValid: false,
        errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings: [],
        studentCount: 0
      };
    }
  }
}