import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    // Log environment configuration for debugging
    console.log("Environment configuration:", { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey, 
      hasResendApiKey: !!resendApiKey 
    });

    // Regular notification processing
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set in environment variables");
      throw new Error("Email service configuration missing: RESEND_API_KEY");
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { 
      digestType = 'daily',
      userId,
      forceProcess = false
    } = await req.json();

    console.log(`Processing ${digestType} digests${userId ? ' for user ' + userId : ''}`);

    // Initialize counters
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Get digests that are due to be sent
    const now = new Date();
    let digestQuery = supabase
      .from('notification_digests')
      .select('id, user_id, digest_type, next_scheduled_at')
      .eq('digest_type', digestType)
      .eq('is_enabled', true)
      .lte('next_scheduled_at', now.toISOString());

    // If userId is provided, only process for that user
    if (userId) {
      digestQuery = digestQuery.eq('user_id', userId);
    }

    // If forceProcess is true, ignore the next_scheduled_at check
    if (forceProcess) {
      digestQuery = supabase
        .from('notification_digests')
        .select('id, user_id, digest_type, next_scheduled_at')
        .eq('digest_type', digestType)
        .eq('is_enabled', true);
      
      if (userId) {
        digestQuery = digestQuery.eq('user_id', userId);
      }
    }

    const { data: digestsToProcess, error: digestError } = await digestQuery;

    if (digestError) {
      throw digestError;
    }

    console.log(`Found ${digestsToProcess?.length || 0} digests to process`);

    // Process each digest
    for (const digest of digestsToProcess || []) {
      try {
        processedCount++;
        
        // Get unread notifications for this user
        const { data: notifications, error: notificationError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', digest.user_id)
          .eq('read', false)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false });
        
        if (notificationError) {
          console.error(`Error fetching notifications for user ${digest.user_id}:`, notificationError);
          errorCount++;
          continue;
        }

        // Skip if no unread notifications
        if (!notifications || notifications.length === 0) {
          console.log(`No unread notifications for user ${digest.user_id}, skipping digest`);
          
          // Update next scheduled time
          await updateNextScheduledTime(supabase, digest);
          successCount++;
          continue;
        }

        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', digest.user_id)
          .single();
        
        if (userError || !userData?.email) {
          console.error(`Error fetching user data for ${digest.user_id}:`, userError);
          errorCount++;
          continue;
        }

        // Group notifications by category
        const notificationsByCategory: Record<string, any[]> = {};
        for (const notification of notifications) {
          if (!notificationsByCategory[notification.category]) {
            notificationsByCategory[notification.category] = [];
          }
          notificationsByCategory[notification.category].push(notification);
        }

        // Generate digest email content
        const digestTitle = `Your ${digest.digest_type === 'daily' ? 'Daily' : 'Weekly'} Notification Digest`;
        const digestContent = generateDigestEmailContent(notificationsByCategory, userData.display_name || 'User', digest.digest_type);

        // Send email
        const resend = new Resend(resendApiKey);
        const emailResult = await resend.emails.send({
          from: 'Assured Response <notifications@mail.bpiincworks.com>',
          to: userData.email,
          subject: digestTitle,
          html: digestContent,
        });

        if (emailResult.error) {
          console.error(`Error sending digest email to ${userData.email}:`, emailResult.error);
          errorCount++;
        } else {
          console.log(`Digest email sent successfully to ${userData.email}`);
          
          // Update last_sent_at and next_scheduled_at
          const { error: updateError } = await supabase
            .from('notification_digests')
            .update({ 
              last_sent_at: now.toISOString(),
              next_scheduled_at: calculateNextScheduledTime(digest.digest_type, now).toISOString()
            })
            .eq('id', digest.id);
          
          if (updateError) {
            console.error(`Error updating digest record for ${digest.user_id}:`, updateError);
          }
          
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing digest for user ${digest.user_id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        successful: successCount,
        failed: errorCount
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing notification digests:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

// Helper function to update the next scheduled time for a digest
async function updateNextScheduledTime(supabase: any, digest: any) {
  const now = new Date();
  const nextScheduled = calculateNextScheduledTime(digest.digest_type, now);
  
  const { error } = await supabase
    .from('notification_digests')
    .update({ 
      next_scheduled_at: nextScheduled.toISOString()
    })
    .eq('id', digest.id);
  
  if (error) {
    console.error(`Error updating next scheduled time for digest ${digest.id}:`, error);
  }
}

// Helper function to calculate the next scheduled time for a digest
function calculateNextScheduledTime(digestType: string, now: Date): Date {
  const nextScheduled = new Date(now);
  
  if (digestType === 'daily') {
    // Schedule for tomorrow at the same time
    nextScheduled.setDate(nextScheduled.getDate() + 1);
  } else if (digestType === 'weekly') {
    // Schedule for next week at the same time
    nextScheduled.setDate(nextScheduled.getDate() + 7);
  }
  
  return nextScheduled;
}

// Helper function to generate digest email content
function generateDigestEmailContent(notificationsByCategory: Record<string, any[]>, userName: string, digestType: string): string {
  const totalCount = Object.values(notificationsByCategory).reduce((sum, notifications) => sum + notifications.length, 0);
  
  let categorySections = '';
  
  // Generate content for each category
  for (const [category, notifications] of Object.entries(notificationsByCategory)) {
    const categoryTitle = getCategoryDisplayName(category);
    
    let notificationItems = '';
    for (const notification of notifications) {
      const priorityClass = getPriorityColorClass(notification.priority);
      const date = new Date(notification.created_at).toLocaleDateString();
      
      notificationItems += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 500;">${notification.title}</div>
            <div style="color: #4a5568; margin-top: 4px;">${notification.message}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
              <span style="color: #718096; font-size: 12px;">${date}</span>
              ${notification.action_url ? `<a href="${notification.action_url}" style="color: #4F46E5; font-size: 14px; text-decoration: none;">View Details</a>` : ''}
            </div>
          </td>
        </tr>
      `;
    }
    
    categorySections += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #1a202c; font-size: 18px; margin-bottom: 12px;">${categoryTitle} (${notifications.length})</h3>
        <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          ${notificationItems}
        </table>
      </div>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${digestType === 'daily' ? 'Daily' : 'Weekly'} Notification Digest</title>
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
            <h1>${digestType === 'daily' ? 'Daily' : 'Weekly'} Notification Digest</h1>
            <p>Hello ${userName},</p>
            <p>Here's a summary of your ${totalCount} unread notification${totalCount !== 1 ? 's' : ''} from the ${digestType === 'daily' ? 'past day' : 'past week'}:</p>
            
            ${categorySections}
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bpiincworks.com'}" class="button" target="_blank">View All Notifications</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Assured Response Training Center. All rights reserved.</p>
            <p>You're receiving this email because you've enabled ${digestType} notification digests. You can update your preferences in your account settings.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to get display name for a category
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'GENERAL':
      return 'General Notifications';
    case 'CERTIFICATE':
      return 'Certificate Notifications';
    case 'COURSE':
      return 'Course Notifications';
    case 'ACCOUNT':
      return 'Account Notifications';
    case 'ROLE_MANAGEMENT':
      return 'Role Management';
    case 'SUPERVISION':
      return 'Supervision Notifications';
    case 'INSTRUCTOR':
      return 'Instructor Notifications';
    case 'PROVIDER':
      return 'Provider Notifications';
    case 'SYSTEM':
      return 'System Notifications';
    default:
      return category;
  }
}

// Helper function to get color class for priority
function getPriorityColorClass(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'text-gray-500';
    case 'NORMAL':
      return 'text-blue-500';
    case 'HIGH':
      return 'text-amber-500';
    case 'URGENT':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}