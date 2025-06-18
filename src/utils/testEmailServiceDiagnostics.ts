import { EmailServiceDiagnostics } from './emailServiceDiagnostics';
import { supabase } from '@/integrations/supabase/client';

/**
 * Test script to validate email service functionality and identify issues
 */
export class EmailServiceDiagnosticsTest {
  
  /**
   * Run comprehensive email service diagnostics
   */
  static async runComprehensiveDiagnostics(): Promise<void> {
    console.log('🚀 Starting comprehensive email service diagnostics...');
    
    try {
      // 1. Check email service configuration
      console.log('\n📋 Step 1: Validating email service configuration...');
      const configReport = await EmailServiceDiagnostics.validateEmailServiceConfiguration();
      console.log('Configuration Report:', configReport);
      
      // 2. Generate full diagnostic report
      console.log('\n📋 Step 2: Generating diagnostic report...');
      const diagnosticReport = await EmailServiceDiagnostics.generateDiagnosticReport();
      console.log('Diagnostic Report:', diagnosticReport);
      
      // 3. Test with sample certificates (if any exist)
      console.log('\n📋 Step 3: Testing with sample certificates...');
      await this.testSampleCertificates();
      
      // 4. Check for common email issues
      console.log('\n📋 Step 4: Checking for common email issues...');
      await this.checkCommonEmailIssues();
      
      console.log('\n✅ Comprehensive diagnostics completed!');
      
    } catch (error) {
      console.error('❌ Error running diagnostics:', error);
      throw error;
    }
  }
  
  /**
   * Test email validation with sample certificates
   */
  static async testSampleCertificates(): Promise<void> {
    try {
      // Get a few recent certificates for testing
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('id, recipient_name, recipient_email, course_name')
        .limit(5)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('⚠️ Could not fetch sample certificates:', error.message);
        return;
      }
      
      if (!certificates || certificates.length === 0) {
        console.log('⚠️ No certificates found for testing');
        return;
      }
      
      console.log(`📊 Testing ${certificates.length} sample certificates...`);
      
      for (const cert of certificates) {
        if (cert.recipient_email) {
          console.log(`\n🔍 Testing certificate ${cert.id} for ${cert.recipient_name}...`);
          
          try {
            const validation = await EmailServiceDiagnostics.validateCertificateEmail(
              cert.id,
              cert.recipient_email
            );
            
            console.log(`📊 Validation result:`, {
              recipientName: validation.recipientName,
              emailMatch: validation.isEmailMatch,
              hasAuditTrail: validation.hasAuditTrail,
              issuesCount: validation.potentialIssues.length,
              issues: validation.potentialIssues
            });
            
            if (validation.potentialIssues.length > 0) {
              console.log(`⚠️ Issues found for ${cert.recipient_name}:`, validation.potentialIssues);
            }
            
          } catch (validationError) {
            console.error(`❌ Error validating certificate ${cert.id}:`, validationError);
          }
        } else {
          console.log(`⚠️ Certificate ${cert.id} for ${cert.recipient_name} has no email address`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing sample certificates:', error);
    }
  }
  
  /**
   * Check for common email-related issues
   */
  static async checkCommonEmailIssues(): Promise<void> {
    try {
      console.log('🔍 Checking for common email issues...');
      
      // Check for certificates with missing emails
      const { data: certsWithoutEmail, error: emailError } = await supabase
        .from('certificates')
        .select('id, recipient_name, course_name')
        .is('recipient_email', null)
        .limit(10);
      
      if (!emailError && certsWithoutEmail && certsWithoutEmail.length > 0) {
        console.log(`⚠️ Found ${certsWithoutEmail.length} certificates without email addresses:`);
        certsWithoutEmail.forEach(cert => {
          console.log(`  - ${cert.recipient_name} (${cert.course_name}) - ID: ${cert.id}`);
        });
      }
      
      // Check for duplicate email addresses
      const { data: duplicateEmails, error: dupError } = await supabase
        .from('certificates')
        .select('recipient_email, recipient_name, id')
        .not('recipient_email', 'is', null)
        .order('recipient_email');
      
      if (!dupError && duplicateEmails) {
        const emailGroups = duplicateEmails.reduce((acc, cert) => {
          if (!acc[cert.recipient_email]) acc[cert.recipient_email] = [];
          acc[cert.recipient_email].push(cert);
          return acc;
        }, {} as Record<string, any[]>);
        
        const duplicates = Object.entries(emailGroups).filter(([_, certs]) => certs.length > 1);
        
        if (duplicates.length > 0) {
          console.log(`⚠️ Found ${duplicates.length} email addresses with multiple certificates:`);
          duplicates.slice(0, 5).forEach(([email, certs]) => {
            console.log(`  - ${email}: ${certs.length} certificates`);
            certs.forEach(cert => {
              console.log(`    * ${cert.recipient_name} - ID: ${cert.id}`);
            });
          });
        }
      }
      
      // Check recent email batch operations
      const { data: recentBatches, error: batchError } = await supabase
        .from('email_batch_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!batchError && recentBatches) {
        console.log(`📊 Recent email batch operations (${recentBatches.length}):`);
        recentBatches.forEach(batch => {
          console.log(`  - ${batch.batch_name}: ${batch.status} (${batch.successful_emails}/${batch.total_certificates} sent)`);
          if (batch.error_message) {
            console.log(`    Error: ${batch.error_message}`);
          }
        });
      }
      
      // Check recent audit logs
      const { data: recentAudits, error: auditError } = await supabase
        .from('certificate_audit_logs')
        .select('*')
        .eq('action', 'EMAILED')
        .order('performed_at', { ascending: false })
        .limit(10);
      
      if (!auditError && recentAudits) {
        console.log(`📊 Recent email audit logs (${recentAudits.length}):`);
        recentAudits.forEach(audit => {
          console.log(`  - Certificate ${audit.certificate_id}: sent to ${audit.email_recipient}`);
          if (audit.reason) {
            console.log(`    Reason: ${audit.reason}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking common email issues:', error);
    }
  }
  
  /**
   * Test email validation for a specific certificate ID
   */
  static async testSpecificCertificate(certificateId: string, testEmail?: string): Promise<void> {
    try {
      console.log(`🔍 Testing specific certificate: ${certificateId}`);
      
      // Get certificate details
      const { data: certificate, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();
      
      if (error || !certificate) {
        console.error(`❌ Certificate ${certificateId} not found:`, error?.message);
        return;
      }
      
      console.log(`📊 Certificate details:`, {
        id: certificate.id,
        recipientName: certificate.recipient_name,
        recipientEmail: certificate.recipient_email,
        courseName: certificate.course_name,
        emailStatus: certificate.email_status,
        lastEmailed: certificate.last_emailed_at
      });
      
      // Test with stored email
      if (certificate.recipient_email) {
        console.log(`\n🔍 Testing with stored email: ${certificate.recipient_email}`);
        const validation = await EmailServiceDiagnostics.validateCertificateEmail(
          certificateId,
          certificate.recipient_email
        );
        console.log('Validation result:', validation);
      }
      
      // Test with custom email if provided
      if (testEmail && testEmail !== certificate.recipient_email) {
        console.log(`\n🔍 Testing with custom email: ${testEmail}`);
        const customValidation = await EmailServiceDiagnostics.validateCertificateEmail(
          certificateId,
          testEmail
        );
        console.log('Custom email validation result:', customValidation);
      }
      
    } catch (error) {
      console.error(`❌ Error testing certificate ${certificateId}:`, error);
    }
  }
}

// Export a simple function to run diagnostics from console
export const runEmailDiagnostics = () => EmailServiceDiagnosticsTest.runComprehensiveDiagnostics();
export const testCertificateEmail = (certificateId: string, testEmail?: string) => 
  EmailServiceDiagnosticsTest.testSpecificCertificate(certificateId, testEmail);