// This utility file includes functions for working with email templates
// and properly decoding HTML entities in email subjects

/**
 * Decode HTML entities in a string (for email subjects and body text)
 * @param text String to decode
 * @returns Decoded string
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&#47;/g, '/');
}

/**
 * Validate an email template for required elements
 * @param template The template object to validate
 * @returns An object with validation status and any error messages
 */
export function validateEmailTemplate(template: {
  name?: string;
  subject_template?: string;
  body_template?: string;
}) {
  const errors: string[] = [];
  
  if (!template.name || template.name.trim() === '') {
    errors.push('Template name is required');
  }
  
  if (!template.subject_template || template.subject_template.trim() === '') {
    errors.push('Subject template is required');
  }
  
  if (!template.body_template || template.body_template.trim() === '') {
    errors.push('Body template is required');
  } else {
    // Basic check for HTML validity - ensure tags are closed
    const openTags = (template.body_template.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (template.body_template.match(/<\/[^>]*>/g) || []).length;
    
    if (openTags !== closeTags) {
      errors.push('HTML template appears to have unclosed tags');
    }
  }
  
  // Check for required template variables
  const requiredVariables = ['recipient_name', 'course_name'];
  
  for (const variable of requiredVariables) {
    if (!template.body_template?.includes(`{{${variable}}}`)) {
      errors.push(`Template should include {{${variable}}} variable`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate default template text with proper variables
 * @param locationName Optional location name to include in the template
 * @returns Default template HTML
 */
export function getDefaultTemplateHtml(locationName?: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Certificate of Completion</h2>
  <p>Dear {{recipient_name}},</p>
  <p>Congratulations on successfully completing your {{course_name}} with ${locationName || '{{location_name}}'}}! Your official certificate is attached to this email for your records.</p>
  <p>This certification is valid until {{expiry_date}}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
  <p>Need additional training for yourself or your team? We offer regular courses in:</p>
  <ul>
    <li>Standard First Aid & CPR</li>
    <li>Emergency First Aid</li>
    <li>CPR/AED (Levels A, C, and BLS)</li>
    <li>Specialized workplace training</li>
  </ul>
  <p>Contact us for more information or to schedule training.</p>
  <p>Regards,</p>
  <p>${locationName || '{{location_name}}'}<br>
  {{#if location_phone}}Phone: {{location_phone}}<br>{{/if}}
  {{#if location_email}}Email: {{location_email}}<br>{{/if}}
  {{#if location_website}}Website: {{location_website}}{{/if}}</p>
  <hr>
  <p style="font-size: 12px; color: #666;">This certificate is issued through ${locationName || '{{location_name}}'} and is issued under Assured Response, WSIB authorized issuer.</p>
  <p style="font-size: 12px; color: #666;">To verify this certificate, use verification code: <strong>{{verification_code}}</strong></p>
</div>`;
}

/**
 * Load Handlebars helpers for email templates
 * This can be used to add custom Handlebars helpers for email templates
 * @param Handlebars The Handlebars instance to extend
 */
export function registerHandlebarsHelpers(Handlebars: any) {
  // Add a helper to format dates
  Handlebars.registerHelper('formatDate', function(date: string) {
    if (!date) return '';
    
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return date;
    }
  });
  
  // Helper to conditionally show content
  Handlebars.registerHelper('ifCond', function(v1: any, operator: string, v2: any, options: any) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });
  
  // Helper to decode HTML entities
  Handlebars.registerHelper('decodeHtml', function(text: string) {
    return decodeHtmlEntities(text);
  });
}

/**
 * Get template variables used in an email template
 * @param template The template string to analyze
 * @returns Array of variable names found in the template
 */
export function getTemplateVariables(template: string): string[] {
  if (!template) return [];
  
  const variableRegex = /{{([^{}]+)}}/g;
  const matches = template.match(variableRegex) || [];
  
  return matches
    .map(match => match.replace(/{{|}}/g, '').trim())
    .filter(variable => !variable.startsWith('#') && !variable.startsWith('/'));
}