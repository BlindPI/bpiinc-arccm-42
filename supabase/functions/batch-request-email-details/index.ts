
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BatchEmailRequest {
  rosterId: string;
  locationId: string;
  submittedBy: string;
  rosterData: any[];
  batchName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { rosterId, locationId, submittedBy, rosterData, batchName }: BatchEmailRequest = await req.json();

    console.log("Processing batch email notification:", { rosterId, locationId, batchName });

    // Get AP users assigned to the location
    const { data: apUsers, error: apError } = await supabase
      .from('user_location_assignments')
      .select(`
        user_id,
        profiles:profiles(
          id,
          email,
          first_name,
          last_name,
          role
        )
      `)
      .eq('location_id', locationId)
      .eq('profiles.role', 'AP');

    if (apError) {
      throw new Error(`Failed to fetch AP users: ${apError.message}`);
    }

    // Get submitter details
    const { data: submitter, error: submitterError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', submittedBy)
      .single();

    if (submitterError) {
      console.warn("Could not fetch submitter details:", submitterError);
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('name, city, state')
      .eq('id', locationId)
      .single();

    if (locationError) {
      console.warn("Could not fetch location details:", locationError);
    }

    // Create Excel file from roster data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rosterData.map(row => ({
      'Student Name': row.recipientName,
      'Email': row.email,
      'Phone': row.phone,
      'Company': row.company,
      'First Aid Level': row.firstAidLevel,
      'CPR Level': row.cprLevel,
      'Course Name': row.courseName,
      'Assessment Status': row.assessmentStatus,
      'Validation Errors': row.validationErrors.length > 0 ? row.validationErrors.map((e: any) => e.message).join('; ') : 'None',
      'Course Match': row.courseMatch?.name || 'Not matched',
      'Row Number': row.rowNumber
    })));

    XLSX.utils.book_append_sheet(workbook, worksheet, "Roster Data");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const submitterName = submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown User';
    const locationName = location ? `${location.name} (${location.city}, ${location.state})` : 'Unknown Location';

    // Send emails to all AP users
    const emailPromises = apUsers?.map(async (assignment: any) => {
      const apUser = assignment.profiles;
      if (!apUser?.email) return null;

      try {
        const emailResponse = await resend.emails.send({
          from: "Certificate System <notifications@yourdomain.com>",
          to: [apUser.email],
          subject: `New Batch Certificate Request - ${batchName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Batch Certificate Request</h2>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Batch Details</h3>
                <p><strong>Batch Name:</strong> ${batchName}</p>
                <p><strong>Roster ID:</strong> ${rosterId}</p>
                <p><strong>Total Records:</strong> ${rosterData.length}</p>
                <p><strong>Submitted By:</strong> ${submitterName}</p>
                <p><strong>Location:</strong> ${locationName}</p>
                <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="margin-top: 0; color: #92400e;">Action Required</h4>
                <p>A new batch certificate request requires your review and approval. Please log into the certificate management system to process this request.</p>
              </div>

              <div style="margin: 20px 0;">
                <h4>Summary</h4>
                <ul>
                  <li>Valid Records: ${rosterData.filter(r => r.validationErrors.length === 0).length}</li>
                  <li>Records with Errors: ${rosterData.filter(r => r.validationErrors.length > 0).length}</li>
                  <li>Course Mismatches: ${rosterData.filter(r => r.hasCourseMismatch).length}</li>
                </ul>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                This email was sent automatically by the Certificate Management System.
                Please find the complete roster data attached as an Excel file.
              </p>
            </div>
          `,
          attachments: [{
            filename: `${batchName}_roster_${new Date().toISOString().slice(0, 10)}.xlsx`,
            content: Array.from(new Uint8Array(excelBuffer))
          }]
        });

        console.log(`Email sent to ${apUser.email}:`, emailResponse);
        return { success: true, email: apUser.email, response: emailResponse };
      } catch (error) {
        console.error(`Failed to send email to ${apUser.email}:`, error);
        return { success: false, email: apUser.email, error: error.message };
      }
    }) || [];

    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(r => r?.success).length;
    const failedEmails = emailResults.filter(r => r && !r.success);

    console.log(`Batch email notification complete: ${successfulEmails} successful, ${failedEmails.length} failed`);

    return new Response(JSON.stringify({
      success: true,
      rosterId,
      emailsSent: successfulEmails,
      emailsFailed: failedEmails.length,
      results: emailResults
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("Error in batch-request-email-details function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
