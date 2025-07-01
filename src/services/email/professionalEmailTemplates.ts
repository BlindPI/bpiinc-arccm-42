/**
 * Professional Email Templates for Training & Certification Company
 * Enterprise-grade templates with professional branding and compliance
 */

export interface ProfessionalEmailTemplate {
  id: string;
  name: string;
  category: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  variables: string[];
  description: string;
}

export const PROFESSIONAL_EMAIL_TEMPLATES: ProfessionalEmailTemplate[] = [
  {
    id: 'welcome-professional',
    name: 'Professional Welcome Email',
    category: 'welcome',
    subject_template: 'Welcome to {{company_name}} - Your Professional Development Journey Begins',
    html_template: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Professional Development</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .header-subtitle { color: #e0e7ff; font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
        .message { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 25px; }
        .highlight-box { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .benefits { background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .benefit-item { display: flex; align-items: center; margin-bottom: 15px; }
        .benefit-icon { color: #10b981; margin-right: 12px; font-weight: bold; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
        .footer-links { margin: 20px 0; }
        .footer-link { color: #60a5fa; text-decoration: none; margin: 0 15px; }
        .unsubscribe { font-size: 12px; color: #6b7280; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{company_name}}</div>
            <div class="header-subtitle">Professional Training & Certification Excellence</div>
        </div>
        
        <div class="content">
            <div class="greeting">Welcome, {{first_name}}!</div>
            
            <div class="message">
                We're thrilled to welcome you to {{company_name}}, where professional excellence meets career advancement. Your journey toward industry-leading certification and expertise begins today.
            </div>
            
            <div class="highlight-box">
                <strong>🎯 Your Professional Development Advantage:</strong><br>
                As a valued member, you now have access to industry-recognized training programs, expert-led instruction, and certifications that advance careers and drive results.
            </div>
            
            <div class="benefits">
                <h3 style="color: #1f2937; margin-bottom: 20px;">What's Next in Your Journey:</h3>
                <div class="benefit-item">
                    <span class="benefit-icon">✓</span>
                    <span>Access to comprehensive training programs and resources</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">✓</span>
                    <span>Expert guidance from industry-certified instructors</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">✓</span>
                    <span>Networking opportunities with fellow professionals</span>
                </div>
                <div class="benefit-item">
                    <span class="benefit-icon">✓</span>
                    <span>Career advancement through recognized certifications</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{website_url}}/dashboard" class="cta-button">Access Your Learning Dashboard</a>
            </div>
            
            <div class="message">
                Our dedicated support team is here to ensure your success. If you have any questions or need assistance, don't hesitate to reach out to us at {{contact_email}}.
            </div>
            
            <div class="message">
                <strong>Welcome to excellence,</strong><br>
                The {{company_name}} Team
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="{{website_url}}" class="footer-link">Training Programs</a>
                <a href="{{website_url}}/certifications" class="footer-link">Certifications</a>
                <a href="{{website_url}}/support" class="footer-link">Support</a>
            </div>
            
            <div>
                {{company_name}}<br>
                Professional Training & Certification<br>
                {{contact_email}} | {{website_url}}
            </div>
            
            <div class="unsubscribe">
                <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | 
                <a href="{{website_url}}/privacy" style="color: #6b7280;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`,
    text_template: `Welcome to {{company_name}} - Your Professional Development Journey Begins

Dear {{first_name}},

We're thrilled to welcome you to {{company_name}}, where professional excellence meets career advancement. Your journey toward industry-leading certification and expertise begins today.

Your Professional Development Advantage:
As a valued member, you now have access to industry-recognized training programs, expert-led instruction, and certifications that advance careers and drive results.

What's Next in Your Journey:
✓ Access to comprehensive training programs and resources
✓ Expert guidance from industry-certified instructors  
✓ Networking opportunities with fellow professionals
✓ Career advancement through recognized certifications

Access Your Learning Dashboard: {{website_url}}/dashboard

Our dedicated support team is here to ensure your success. If you have any questions or need assistance, don't hesitate to reach out to us at {{contact_email}}.

Welcome to excellence,
The {{company_name}} Team

{{company_name}}
{{contact_email}} | {{website_url}}

Unsubscribe: {{unsubscribe_url}}`,
    variables: ['company_name', 'first_name', 'website_url', 'contact_email', 'unsubscribe_url'],
    description: 'Professional welcome email for new clients and contacts'
  },

  {
    id: 'training-program-promotion',
    name: 'Training Program Promotion',
    category: 'marketing',
    subject_template: 'Advance Your Career with {{program_name}} - Limited Enrollment Open',
    html_template: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{program_name}} Training Program</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; color: white; }
        .program-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; }
        .program-highlight { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: #1f2937; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 15px 0; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="program-title">{{program_name}}</div>
            <div>Transform Your Career with Industry-Leading Training</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{first_name}},</div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                Are you ready to take your professional skills to the next level? Our <strong>{{program_name}}</strong> program is designed for ambitious professionals like you who are committed to excellence and career advancement.
            </p>
            
            <div class="program-highlight">
                <h3 style="color: #059669;">🎯 Career-Defining Opportunity</h3>
                <p>Join industry leaders who have transformed their careers through our comprehensive {{program_name}} certification program.</p>
            </div>
            
            <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e40af;">📅 Program Details:</h3>
                <ul style="color: #374151; line-height: 1.8;">
                    <li><strong>Start Date:</strong> {{start_date}}</li>
                    <li><strong>Duration:</strong> 8 weeks of intensive training</li>
                    <li><strong>Format:</strong> Live online sessions + self-paced modules</li>
                    <li><strong>Instructor:</strong> {{instructor_name}}</li>
                    <li><strong>Benefits:</strong> {{benefits}}</li>
                </ul>
            </div>
            
            <div style="text-align: center; background-color: #1f2937; color: white; padding: 40px 30px; margin: 30px 0; border-radius: 12px;">
                <h2 style="margin-bottom: 15px;">Ready to Transform Your Career?</h2>
                <p style="margin-bottom: 20px;">Limited seats available - secure your spot today!</p>
                <a href="{{website_url}}/enroll/{{program_name}}" class="cta-button">Enroll Now - Reserve Your Seat</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Questions? Contact our enrollment team at {{contact_email}}</p>
            <p>{{company_name}} | Professional Training Excellence</p>
            <div style="margin-top: 20px; font-size: 12px;">
                <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | 
                <a href="{{website_url}}/privacy" style="color: #6b7280;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`,
    text_template: `Advance Your Career with {{program_name}} - Limited Enrollment Open

Hello {{first_name}},

Are you ready to take your professional skills to the next level? Our {{program_name}} program is designed for ambitious professionals like you who are committed to excellence and career advancement.

CAREER-DEFINING OPPORTUNITY
Join industry leaders who have transformed their careers through our comprehensive {{program_name}} certification program.

PROGRAM DETAILS:
• Start Date: {{start_date}}
• Duration: 8 weeks of intensive training
• Format: Live online sessions + self-paced modules
• Instructor: {{instructor_name}}
• Benefits: {{benefits}}

READY TO TRANSFORM YOUR CAREER?
Limited seats available - secure your spot today!

Enroll Now: {{website_url}}/enroll/{{program_name}}

Questions? Contact our enrollment team at {{contact_email}}

{{company_name}} | Professional Training Excellence
Unsubscribe: {{unsubscribe_url}}`,
    variables: ['program_name', 'first_name', 'start_date', 'benefits', 'instructor_name', 'website_url', 'contact_email', 'company_name', 'unsubscribe_url'],
    description: 'Professional training program promotion email'
  },

  {
    id: 'certification-achievement',
    name: 'Certification Achievement',
    category: 'achievement',
    subject_template: '🎉 Congratulations! Your {{certification_name}} Certificate is Ready',
    html_template: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certification Achievement</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 50px 30px; text-align: center; color: white; }
        .achievement-title { font-size: 32px; font-weight: bold; margin-bottom: 15px; }
        .content { padding: 40px 30px; }
        .congratulations { font-size: 24px; color: #1f2937; text-align: center; margin-bottom: 30px; font-weight: 600; }
        .certificate-section { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 3px solid #f59e0b; }
        .download-button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <div class="achievement-title">CERTIFICATION ACHIEVED!</div>
            <div>Professional Excellence Recognized</div>
        </div>
        
        <div class="content">
            <div class="congratulations">
                Congratulations, {{first_name}}!<br>
                You've Successfully Earned Your Certification
            </div>
            
            <div class="certificate-section">
                <div style="font-size: 48px; margin-bottom: 15px;">🏆</div>
                <h2 style="color: #92400e; margin-bottom: 15px;">{{certification_name}}</h2>
                <p style="color: #78350f; font-size: 16px; margin-bottom: 20px;">
                    Achieved on {{achievement_date}}
                </p>
                <a href="{{certificate_url}}" class="download-button">Download Your Certificate</a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Your dedication, hard work, and commitment to professional excellence have paid off. This certification represents not just knowledge gained, but your readiness to make a significant impact in your field.
            </p>
            
            <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e40af; margin-bottom: 15px;">🎯 What This Certification Means:</h3>
                <ul style="color: #374151; line-height: 1.8;">
                    <li><strong>Industry Recognition:</strong> Your expertise is now formally recognized</li>
                    <li><strong>Career Advancement:</strong> Open doors to new opportunities</li>
                    <li><strong>Professional Credibility:</strong> Demonstrate your commitment to learning</li>
                    <li><strong>Competitive Edge:</strong> Stand out in the job market</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #1f2937; font-weight: 600;">
                    Celebrating your success,<br>
                    The {{company_name}} Team
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>Continue your professional development journey with {{company_name}}</p>
            <p>{{contact_email}} | {{website_url}}</p>
            <div style="margin-top: 20px; font-size: 12px;">
                <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | 
                <a href="{{website_url}}/privacy" style="color: #6b7280;">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`,
    text_template: `🎉 Congratulations! Your {{certification_name}} Certificate is Ready

CERTIFICATION ACHIEVED!

Congratulations, {{first_name}}!
You've Successfully Earned Your Certification

{{certification_name}}
Achieved on {{achievement_date}}

Download Your Certificate: {{certificate_url}}

Your dedication, hard work, and commitment to professional excellence have paid off. This certification represents not just knowledge gained, but your readiness to make a significant impact in your field.

WHAT THIS CERTIFICATION MEANS:
🎯 Industry Recognition - Your expertise is now formally recognized
📈 Career Advancement - Open doors to new opportunities  
🏆 Professional Credibility - Demonstrate your commitment to learning
⚡ Competitive Edge - Stand out in the job market

Celebrating your success,
The {{company_name}} Team

{{contact_email}} | {{website_url}}
Unsubscribe: {{unsubscribe_url}}`,
    variables: ['first_name', 'certification_name', 'achievement_date', 'certificate_url', 'company_name', 'website_url', 'contact_email', 'unsubscribe_url'],
    description: 'Celebration email for certification achievement'
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): ProfessionalEmailTemplate | undefined {
  return PROFESSIONAL_EMAIL_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): ProfessionalEmailTemplate[] {
  return PROFESSIONAL_EMAIL_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(PROFESSIONAL_EMAIL_TEMPLATES.map(template => template.category))];
}