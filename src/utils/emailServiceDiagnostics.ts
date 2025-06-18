import { supabase } from '@/integrations/supabase/client';

export interface EmailValidationResult {
  certificateId: string;
  recipientName: string;
  storedEmail: string | null;
  requestedEmail: string;
  isEmailMatch: boolean;
  hasAuditTrail: boolean;
  lastEmailSent: string | null;
  potentialIssues: string[];
}

export class EmailServiceDiagnostics {
  /**
   * Validate email sending for a specific certificate
   */
  static async validateCertificateEmail(
    certificateId: string, 
    requestedEmail: string
  ): Promise<EmailValidationResult> {
    console.log('🔍 Validating certificate email:', { certificateId, requestedEmail });

    try {
      // Fetch certificate details
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (certError || !certificate) {
        throw new Error(`Certificate not found: ${certError?.message}`);
      }

      // Check audit trail for this certificate
      const { data: auditLogs, error: auditError } = await supabase
        .from('certificate_audit_logs')
        .select('*')
        .eq('certificate_id', certificateId)
        .eq('action', 'EMAILED')
        .order('performed_at', { ascending: false })
        .limit(5);

      const potentialIssues: string[] = [];
      
      // Validate email consistency
      const isEmailMatch = certificate.recipient_email === requestedEmail;
      if (!isEmailMatch && certificate.recipient_email) {
        potentialIssues.push(`Requested email (${requestedEmail}) differs from stored email (${certificate.recipient_email})`);
      }

      // Check for missing email
      if (!certificate.recipient_email) {
        potentialIssues.push('Certificate has no stored email address');
      }

      // Check for suspicious email patterns
      if (requestedEmail && !requestedEmail.includes('@')) {
        potentialIssues.push('Invalid email format');
      }

      // Check audit trail consistency
      const hasInconsistentAuditTrail = auditLogs?.some(log => 
        log.email_recipient && log.email_recipient !== requestedEmail
      );
      
      if (hasInconsistentAuditTrail) {
        potentialIssues.push('Previous emails sent to different addresses');
      }

      // Check for recent email activity
      const recentEmailLog = auditLogs?.[0];
      if (recentEmailLog && recentEmailLog.performed_at) {
        const timeSinceLastEmail = Date.now() - new Date(recentEmailLog.performed_at).getTime();
        if (timeSinceLastEmail < 60000) { // Less than 1 minute
          potentialIssues.push('Email sent very recently - possible duplicate');
        }
      }

      const result: EmailValidationResult = {
        certificateId,
        recipientName: certificate.recipient_name,
        storedEmail: certificate.recipient_email,
        requestedEmail,
        isEmailMatch,
        hasAuditTrail: (auditLogs?.length || 0) > 0,
        lastEmailSent: recentEmailLog?.performed_at || null,
        potentialIssues
      };

      console.log('📊 Email validation result:', result);
      return result;

    } catch (error) {
      console.error('❌ Error validating certificate email:', error);
      throw error;
    }
  }

  /**
   * Validate batch email operation
   */
  static async validateBatchEmailOperation(
    certificateIds: string[]
  ): Promise<EmailValidationResult[]> {
    console.log('🔍 Validating batch email operation:', { certificateCount: certificateIds.length });

    const results: EmailValidationResult[] = [];
    
    for (const certificateId of certificateIds) {
      try {
        // Get certificate details
        const { data: certificate } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', certificateId)
          .single();

        if (certificate && certificate.recipient_email) {
          const validation = await this.validateCertificateEmail(
            certificateId, 
            certificate.recipient_email
          );
          results.push(validation);
        }
      } catch (error) {
        console.error(`Error validating certificate ${certificateId}:`, error);
      }
    }

    // Check for duplicate emails in batch
    const emailCounts = results.reduce((acc, result) => {
      acc[result.requestedEmail] = (acc[result.requestedEmail] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Flag duplicates
    results.forEach(result => {
      if (emailCounts[result.requestedEmail] > 1) {
        result.potentialIssues.push(`Duplicate email in batch (${emailCounts[result.requestedEmail]} certificates)`);
      }
    });

    console.log('📊 Batch validation summary:', {
      totalCertificates: results.length,
      issuesFound: results.filter(r => r.potentialIssues.length > 0).length,
      duplicateEmails: Object.values(emailCounts).filter(count => count > 1).length
    });

    return results;
  }

  /**
   * Check for email service configuration issues
   */
  static async validateEmailServiceConfiguration(): Promise<{
    hasResendConfig: boolean;
    hasVerifiedDomain: boolean;
    hasBatchOperationsTable: boolean;
    hasAuditLogsTable: boolean;
    issues: string[];
  }> {
    console.log('🔍 Validating email service configuration...');

    const issues: string[] = [];

    // Check if batch operations table exists and is accessible
    let hasBatchOperationsTable = false;
    try {
      const { error } = await supabase
        .from('email_batch_operations')
        .select('id')
        .limit(1);
      hasBatchOperationsTable = !error;
    } catch (error) {
      issues.push('email_batch_operations table not accessible');
    }

    // Check if audit logs table exists and is accessible
    let hasAuditLogsTable = false;
    try {
      const { error } = await supabase
        .from('certificate_audit_logs')
        .select('id')
        .limit(1);
      hasAuditLogsTable = !error;
    } catch (error) {
      issues.push('certificate_audit_logs table not accessible');
    }

    // Check for recent failed batch operations
    try {
      const { data: failedBatches } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('status', 'FAILED')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      if (failedBatches && failedBatches.length > 0) {
        issues.push(`${failedBatches.length} failed batch operations in last 24 hours`);
      }
    } catch (error) {
      console.error('Error checking failed batches:', error);
    }

    const result = {
      hasResendConfig: true, // Assume true since we can't check env vars from client
      hasVerifiedDomain: true, // Assume true since domain is hardcoded
      hasBatchOperationsTable,
      hasAuditLogsTable,
      issues
    };

    console.log('📊 Email service configuration:', result);
    return result;
  }

  /**
   * Generate comprehensive email service diagnostic report
   */
  static async generateDiagnosticReport(): Promise<{
    configuration: any;
    recentActivity: any;
    recommendations: string[];
  }> {
    console.log('🔍 Generating comprehensive email service diagnostic report...');

    const configuration = await this.validateEmailServiceConfiguration();

    // Check recent email activity
    const { data: recentBatches } = await supabase
      .from('email_batch_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentAudits } = await supabase
      .from('certificate_audit_logs')
      .select('*')
      .eq('action', 'EMAILED')
      .order('performed_at', { ascending: false })
      .limit(20);

    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (!configuration.hasBatchOperationsTable) {
      recommendations.push('Create email_batch_operations table for proper batch tracking');
    }

    if (!configuration.hasAuditLogsTable) {
      recommendations.push('Create certificate_audit_logs table for email audit trail');
    }

    if (configuration.issues.length > 0) {
      recommendations.push('Address configuration issues: ' + configuration.issues.join(', '));
    }

    // Check for patterns in recent activity
    const emailAddresses = recentAudits?.map(audit => audit.email_recipient).filter(Boolean) || [];
    const uniqueEmails = new Set(emailAddresses);
    
    if (emailAddresses.length > uniqueEmails.size * 2) {
      recommendations.push('High number of duplicate email sends detected - review recipient validation');
    }

    const report = {
      configuration,
      recentActivity: {
        recentBatches: recentBatches?.length || 0,
        recentAudits: recentAudits?.length || 0,
        uniqueEmailsSent: uniqueEmails.size,
        totalEmailsSent: emailAddresses.length
      },
      recommendations
    };

    console.log('📊 Diagnostic report generated:', report);
    return report;
  }
}