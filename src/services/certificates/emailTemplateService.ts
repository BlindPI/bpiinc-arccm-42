
import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example: string;
}

export interface TemplateValidationResult {
  isValid: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  suggestions: string[];
}

export const EMAIL_TEMPLATE_VARIABLES: EmailTemplateVariable[] = [
  // Required variables
  {
    name: '{{verification_code}}',
    description: 'Certificate verification code for authenticity checking',
    required: true,
    example: 'ABC12345DE'
  },
  {
    name: '{{recipient_name}}',
    description: 'Name of the certificate recipient',
    required: true,
    example: 'John Smith'
  },
  {
    name: '{{course_name}}',
    description: 'Name of the completed course',
    required: true,
    example: 'Standard First Aid & CPR-C'
  },
  
  // Recommended variables
  {
    name: '{{verification_portal_url}}',
    description: 'URL to the public certificate verification portal',
    required: false,
    example: 'https://yourdomain.com/verify'
  },
  {
    name: '{{location_name}}',
    description: 'Name of the issuing training location',
    required: false,
    example: 'Toronto Training Center'
  },
  {
    name: '{{certificate_url}}',
    description: 'Direct link to download the certificate PDF',
    required: false,
    example: 'https://storage.example.com/certificate_123.pdf'
  },
  
  // Optional variables
  {
    name: '{{issue_date}}',
    description: 'Date the certificate was issued',
    required: false,
    example: 'January 15, 2024'
  },
  {
    name: '{{expiry_date}}',
    description: 'Date the certificate expires',
    required: false,
    example: 'January 15, 2026'
  },
  {
    name: '{{instructor_name}}',
    description: 'Name of the course instructor',
    required: false,
    example: 'Sarah Johnson'
  }
];

export class EmailTemplateService {
  static validateTemplate(subjectTemplate: string, bodyTemplate: string): TemplateValidationResult {
    const requiredVariables = EMAIL_TEMPLATE_VARIABLES
      .filter(v => v.required)
      .map(v => v.name);
    
    const recommendedVariables = EMAIL_TEMPLATE_VARIABLES
      .filter(v => !v.required && ['{{verification_portal_url}}', '{{location_name}}', '{{certificate_url}}'].includes(v.name))
      .map(v => v.name);

    const allContent = `${subjectTemplate} ${bodyTemplate}`;
    
    const missingRequired = requiredVariables.filter(variable => 
      !allContent.includes(variable)
    );
    
    const missingRecommended = recommendedVariables.filter(variable => 
      !allContent.includes(variable)
    );

    const suggestions = [];
    
    if (missingRequired.includes('{{verification_code}}')) {
      suggestions.push('Add verification code display for certificate authenticity');
    }
    
    if (missingRecommended.includes('{{verification_portal_url}}')) {
      suggestions.push('Include verification portal URL for recipients to verify their certificate');
    }
    
    if (!allContent.includes('Assured Response') && !allContent.includes('{{location_name}}')) {
      suggestions.push('Include company branding (Assured Response Training & Consulting)');
    }

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      missingRecommended,
      suggestions
    };
  }

  static generateSampleTemplate(): { subject: string; body: string } {
    const subject = 'Your {{course_name}} Certificate - Verification Code: {{verification_code}}';
    
    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1e40af; margin: 0;">Certificate Issued</h1>
    <p style="color: #6b7280; margin: 5px 0;">Assured Response Training & Consulting</p>
    <p style="color: #6b7280; margin: 0; font-size: 14px;">WSIB Approved Training Provider</p>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello {{recipient_name}},</h2>
    <p style="color: #374151; line-height: 1.6;">
      Congratulations! Your certificate for <strong>{{course_name}}</strong> has been successfully issued by {{location_name}}.
    </p>
  </div>
  
  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin: 0 0 10px 0;">Certificate Verification</h3>
    <p style="margin: 5px 0; color: #1e40af;"><strong>Verification Code:</strong> {{verification_code}}</p>
    <p style="margin: 5px 0; color: #374151;">
      To verify this certificate's authenticity, visit: 
      <a href="{{verification_portal_url}}" style="color: #2563eb;">{{verification_portal_url}}</a>
    </p>
    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
      <em>Anyone can verify this certificate using the verification code above.</em>
    </p>
  </div>
  
  {{#if certificate_url}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{certificate_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Download Your Certificate
    </a>
  </div>
  {{/if}}
  
  <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4 style="color: #374151; margin: 0 0 10px 0;">Certificate Details</h4>
    <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
      <li>Course: {{course_name}}</li>
      <li>Issue Date: {{issue_date}}</li>
      <li>Expiry Date: {{expiry_date}}</li>
      {{#if instructor_name}}<li>Instructor: {{instructor_name}}</li>{{/if}}
      <li>Training Location: {{location_name}}</li>
    </ul>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
    <p><strong>Assured Response Training & Consulting</strong><br/>
    WSIB Approved Training Provider<br/>
    {{location_name}}</p>
    <p style="margin-top: 15px;">
      <em>This certificate is valid and verifiable through our secure verification system. 
      Keep your verification code safe for future reference.</em>
    </p>
  </div>
</div>
    `.trim();

    return { subject, body };
  }

  static async updateAllTemplatesWithVerification(): Promise<{
    updated: number;
    errors: string[];
  }> {
    const result = { updated: 0, errors: [] as string[] };

    try {
      // Get all email templates
      const { data: templates, error: fetchError } = await supabase
        .from('location_email_templates')
        .select('*');

      if (fetchError) throw fetchError;

      for (const template of templates || []) {
        try {
          const validation = this.validateTemplate(template.subject_template, template.body_template);
          
          if (!validation.isValid) {
            // Template needs updating
            const sampleTemplate = this.generateSampleTemplate();
            
            const updates: any = {};
            
            // Update subject if verification code is missing
            if (!template.subject_template.includes('{{verification_code}}')) {
              updates.subject_template = sampleTemplate.subject;
            }
            
            // Update body if required variables are missing
            if (validation.missingRequired.length > 0) {
              updates.body_template = sampleTemplate.body;
            }
            
            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from('location_email_templates')
                .update(updates)
                .eq('id', template.id);
              
              if (updateError) throw updateError;
              result.updated++;
            }
          }
        } catch (error) {
          result.errors.push(`Template ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static getVerificationPortalUrl(): string {
    // Get the current domain and construct verification URL
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/verify`;
    }
    // Fallback for server-side or when window is not available
    return 'https://your-domain.com/verify';
  }
}
