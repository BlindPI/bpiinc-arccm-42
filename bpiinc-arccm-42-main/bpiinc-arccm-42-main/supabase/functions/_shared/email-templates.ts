
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <img src="https://picsum.photos/id/0/5616/3744" alt="Assured Response Logo" height="50">
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
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
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

// New template for certificate emails - allows customization
export const getCustomCertificateEmailTemplate = (params: {
  recipientName: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  verificationCode?: string;
  locationName: string;
  locationEmail?: string;
  locationPhone?: string;
  locationWebsite?: string;
  customMessage?: string;
}) => {
  const {
    recipientName,
    courseName,
    issueDate,
    expiryDate,
    verificationCode,
    locationName,
    locationEmail,
    locationPhone,
    locationWebsite,
    customMessage
  } = params;
  
  return getEmailTemplate({
    title: `Your ${courseName} Certificate`,
    preheader: `Your ${courseName} certificate is attached`,
    content: `
      <p>Dear ${recipientName},</p>
      <p>Congratulations on successfully completing your ${courseName} with ${locationName}! Your official certificate is attached to this email for your records.</p>
      ${customMessage ? `<p>${customMessage}</p>` : ''}
      <p>This certification is valid until ${expiryDate}. We recommend saving a digital copy and printing one for your workplace requirements.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Certificate Details:</strong></p>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${recipientName}</p>
        <p style="margin: 5px 0;"><strong>Course:</strong> ${courseName}</p>
        <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${issueDate}</p>
        <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
        ${verificationCode ? `<p style="margin: 5px 0;"><strong>Verification Code:</strong> ${verificationCode}</p>` : ''}
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
      ${locationName}
      ${locationPhone ? `<br>Phone: ${locationPhone}` : ''}
      ${locationEmail ? `<br>Email: ${locationEmail}` : ''}
      ${locationWebsite ? `<br>Website: ${locationWebsite}` : ''}
      </p>
    `,
    footerText: `© ${new Date().getFullYear()} ${locationName}. This certificate is issued through ${locationName} and is issued under Assured Response, WSIB authorized issuer.`
  });
};
