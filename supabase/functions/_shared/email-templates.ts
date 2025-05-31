
// Email template utility functions for consistent and customized email templates
export const getEmailTemplate = (options: {
  title: string;
  preheader?: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
}) => {
  const {
    title,
    preheader = '',
    content,
    actionUrl,
    actionText,
    footerText = '© 2025 Assured Response Training Center. All rights reserved.'
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <style>
        @media only screen and (max-width: 600px) {
          .inner-body {
            width: 100% !important;
          }
          .footer {
            width: 100% !important;
          }
        }
        
        @media only screen and (max-width: 500px) {
          .button {
            width: 100% !important;
          }
        }
        
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }
        
        body {
          background-color: #f8fafc;
          color: #4a5568;
          height: 100%;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          width: 100%;
        }
        
        .container {
          background-color: #f8fafc;
          margin: 0 auto;
          padding: 40px 0;
          max-width: 600px;
          width: 100%;
        }
        
        .content {
          margin: 0;
          padding: 0;
          width: 100%;
        }
        
        .header {
          padding: 25px 0;
          text-align: center;
        }
        
        .header img {
          max-height: 60px;
        }
        
        .inner-body {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin: 0 auto;
          padding: 40px;
          width: 570px;
        }
        
        h1 {
          color: #2d3748;
          font-size: 24px;
          font-weight: bold;
          margin-top: 0;
          margin-bottom: 16px;
          text-align: left;
        }
        
        p {
          color: #4a5568;
          font-size: 16px;
          line-height: 1.5em;
          margin-top: 0;
          margin-bottom: 16px;
          text-align: left;
        }
        
        .button {
          border-radius: 6px;
          color: #ffffff;
          display: inline-block;
          font-size: 16px;
          font-weight: bold;
          padding: 12px 24px;
          text-align: center;
          text-decoration: none;
          background-color: #4F46E5;
          margin: 16px 0;
        }
        
        .footer {
          color: #718096;
          font-size: 14px;
          margin: 0 auto;
          padding: 32px 0;
          text-align: center;
          width: 570px;
        }
        
        .address {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <img src="https://mail.bpiincworks.com/images/logo.png" alt="Assured Response Logo" height="50">
          </div>
          
          <div class="inner-body">
            <h1>${title}</h1>
            ${content}
            
            ${actionUrl && actionText ? `
            <div style="text-align: center;">
              <a href="${actionUrl}" class="button" target="_blank">${actionText}</a>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>${footerText}</p>
            <div class="address">
              <p>Assured Response Training Center<br>
              123 Training Avenue<br>
              Toronto, ON M5V 3A8<br>
              Canada</p>
              <p><a href="mailto:unsubscribe@mail.bpiincworks.com" style="color: #9ca3af;">Unsubscribe</a> | 
              <a href="https://mail.bpiincworks.com/privacy" style="color: #9ca3af;">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plain text version of email template
export const getEmailTemplateText = (options: {
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  footerText?: string;
}) => {
  const {
    title,
    content,
    actionUrl,
    actionText,
    footerText = '© 2025 Assured Response Training Center. All rights reserved.'
  } = options;

  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return `
${title}

${cleanContent}

${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}

${footerText}

Assured Response Training Center
123 Training Avenue
Toronto, ON M5V 3A8
Canada

Unsubscribe: mailto:unsubscribe@mail.bpiincworks.com
Privacy Policy: https://mail.bpiincworks.com/privacy
  `.trim();
};

// Email templates for different notification types
export const getWelcomeEmailTemplate = (name: string, actionUrl?: string) => {
  return getEmailTemplate({
    title: 'Welcome to Assured Response Training Center',
    preheader: 'Your account has been created successfully',
    content: `
      <p>Hello ${name},</p>
      <p>Welcome to Assured Response Training Center! Your account has been created successfully.</p>
      <p>Our platform offers a comprehensive certification management system where you can:</p>
      <ul>
        <li>Access your training certificates</li>
        <li>Submit certification requests</li>
        <li>Track your training progress</li>
        <li>Manage your profile and notification preferences</li>
      </ul>
      <p>We're excited to have you on board!</p>
    `,
    actionUrl,
    actionText: actionUrl ? 'Access Your Account' : undefined
  });
};

export const getWelcomeEmailTemplateText = (name: string, actionUrl?: string) => {
  return getEmailTemplateText({
    title: 'Welcome to Assured Response Training Center',
    content: `Hello ${name},

Welcome to Assured Response Training Center! Your account has been created successfully.

Our platform offers a comprehensive certification management system where you can:
- Access your training certificates
- Submit certification requests
- Track your training progress
- Manage your profile and notification preferences

We're excited to have you on board!`,
    actionUrl,
    actionText: actionUrl ? 'Access Your Account' : undefined
  });
};

export const getInvitationEmailTemplate = (name: string, role: string, actionUrl: string) => {
  return getEmailTemplate({
    title: 'You\'ve Been Invited to Assured Response',
    preheader: 'Join Assured Response Training Center',
    content: `
      <p>Hello${name ? ' ' + name : ''},</p>
      <p>You have been invited to join the Assured Response Training Center as a <strong>${role}</strong>.</p>
      <p>Click the button below to accept the invitation and set up your account:</p>
    `,
    actionUrl,
    actionText: 'Accept Invitation'
  });
};

export const getInvitationEmailTemplateText = (name: string, role: string, actionUrl: string) => {
  return getEmailTemplateText({
    title: 'You\'ve Been Invited to Assured Response',
    content: `Hello${name ? ' ' + name : ''},

You have been invited to join the Assured Response Training Center as a ${role}.

Click the link below to accept the invitation and set up your account:`,
    actionUrl,
    actionText: 'Accept Invitation'
  });
};

export const getCertificateRequestEmailTemplate = (name: string, courseName: string, message: string) => {
  return getEmailTemplate({
    title: 'Certificate Request Submitted',
    preheader: 'Your certificate request has been received',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      <p>Your certificate request has been submitted and is pending approval. You will receive another notification once your request has been processed.</p>
    `
  });
};

export const getCertificateRequestEmailTemplateText = (name: string, courseName: string, message: string) => {
  return getEmailTemplateText({
    title: 'Certificate Request Submitted',
    content: `Hello ${name},

${message}

Course: ${courseName}

Your certificate request has been submitted and is pending approval. You will receive another notification once your request has been processed.`
  });
};

export const getCertificateApprovedEmailTemplate = (name: string, courseName: string, message: string, downloadUrl?: string) => {
  return getEmailTemplate({
    title: 'Certificate Approved',
    preheader: 'Your certificate request has been approved',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
      </div>
      <p>You can download your certificate using the button below or from your account dashboard.</p>
    `,
    actionUrl: downloadUrl,
    actionText: downloadUrl ? 'Download Certificate' : undefined
  });
};

export const getCertificateApprovedEmailTemplateText = (name: string, courseName: string, message: string, downloadUrl?: string) => {
  return getEmailTemplateText({
    title: 'Certificate Approved',
    content: `Hello ${name},

${message}

Course: ${courseName}

You can download your certificate using the link below or from your account dashboard.`,
    actionUrl: downloadUrl,
    actionText: downloadUrl ? 'Download Certificate' : undefined
  });
};

export const getCertificateRejectedEmailTemplate = (name: string, courseName: string, message: string, rejectionReason?: string) => {
  return getEmailTemplate({
    title: 'Certificate Request Declined',
    preheader: 'Your certificate request has been declined',
    content: `
      <p>Hello ${name},</p>
      <p>${message}</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Course:</strong> ${courseName}</p>
        ${rejectionReason ? `<p style="margin-top: 10px;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      </div>
      <p>If you believe this decision was made in error or need further information, please contact your training administrator.</p>
    `
  });
};

export const getCertificateRejectedEmailTemplateText = (name: string, courseName: string, message: string, rejectionReason?: string) => {
  return getEmailTemplateText({
    title: 'Certificate Request Declined',
    content: `Hello ${name},

${message}

Course: ${courseName}
${rejectionReason ? `Reason: ${rejectionReason}` : ''}

If you believe this decision was made in error or need further information, please contact your training administrator.`
  });
};

// Updated template for certificate emails with correct variable references
export const getCustomCertificateEmailTemplate = (params: {
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code?: string;
  location_name: string;
  location_email?: string;
  location_phone?: string;
  location_website?: string;
  custom_message?: string;
}) => {
  const {
    recipient_name,
    course_name,
    issue_date,
    expiry_date,
    verification_code,
    location_name,
    location_email,
    location_phone,
    location_website,
    custom_message
  } = params;
  
  return getEmailTemplate({
    title: `Your ${course_name} Certificate`,
    preheader: `Your ${course_name} certificate is attached`,
    content: `
      <p>Dear ${recipient_name},</p>
      <p>Congratulations on successfully completing your ${course_name} with ${location_name}! Your official certificate is attached to this email for your records.</p>
      ${custom_message ? `<p>${custom_message}</p>` : ''}
      <p>This certification is valid until ${expiry_date}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Certificate Details:</strong></p>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${recipient_name}</p>
        <p style="margin: 5px 0;"><strong>Course:</strong> ${course_name}</p>
        <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${issue_date}</p>
        <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${expiry_date}</p>
        ${verification_code ? `<p style="margin: 5px 0;"><strong>Verification Code:</strong> ${verification_code}</p>` : ''}
      </div>
      
      <p>Need additional training for yourself or your team? We offer regular courses in:</p>
      <ul>
        <li>Standard First Aid & CPR</li>
        <li>Emergency First Aid</li>
        <li>CPR/AED (Levels A, C, and BLS)</li>
        <li>Specialized workplace training</li>
      </ul>
      
      <p>Contact us for more information or to schedule training.</p>
      
      <p>Regards,<br>
      ${location_name}
      ${location_phone ? `<br>Phone: ${location_phone}` : ''}
      ${location_email ? `<br>Email: ${location_email}` : ''}
      ${location_website ? `<br>Website: ${location_website}` : ''}
      </p>
    `,
    footerText: `© ${new Date().getFullYear()} ${location_name}. This certificate is issued through ${location_name} and is issued under Assured Response, WSIB authorized issuer.`
  });
};

export const getCustomCertificateEmailTemplateText = (params: {
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code?: string;
  location_name: string;
  location_email?: string;
  location_phone?: string;
  location_website?: string;
  custom_message?: string;
}) => {
  const {
    recipient_name,
    course_name,
    issue_date,
    expiry_date,
    verification_code,
    location_name,
    location_email,
    location_phone,
    location_website,
    custom_message
  } = params;
  
  return getEmailTemplateText({
    title: `Your ${course_name} Certificate`,
    content: `Dear ${recipient_name},

Congratulations on successfully completing your ${course_name} with ${location_name}! Your official certificate is attached to this email for your records.

${custom_message ? `${custom_message}` : ''}

This certification is valid until ${expiry_date}. We recommend saving a digital copy and printing one for your workplace requirements.

Certificate Details:
- Name: ${recipient_name}
- Course: ${course_name}
- Issue Date: ${issue_date}
- Expiry Date: ${expiry_date}
${verification_code ? `- Verification Code: ${verification_code}` : ''}

Need additional training for yourself or your team? We offer regular courses in:
- Standard First Aid & CPR
- Emergency First Aid
- CPR/AED (Levels A, C, and BLS)
- Specialized workplace training

Contact us for more information or to schedule training.

Regards,
${location_name}
${location_phone ? `Phone: ${location_phone}` : ''}
${location_email ? `Email: ${location_email}` : ''}
${location_website ? `Website: ${location_website}` : ''}`,
    footerText: `© ${new Date().getFullYear()} ${location_name}. This certificate is issued through ${location_name} and is issued under Assured Response, WSIB authorized issuer.`
  });
};
