
// Follow Deno's ES module conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
    );

    // Parse request body
    const requestData = await req.json();
    const { requestId, issuerId, batchId, batchName, withPdfGeneration = false } = requestData;

    if (!requestId || !issuerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required parameters: requestId or issuerId" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`Generating certificate for request ID: ${requestId}`);

    // 1. Get the certificate request
    const { data: request, error: requestError } = await supabase
      .from("certificate_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching certificate request:", requestError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Certificate request not found: ${requestError?.message || "Unknown error"}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // Generate a verification code
    let verificationCode = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    
    // Generate first 3 characters (letters)
    for (let i = 0; i < 3; i++) {
      verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Generate middle 5 characters (numbers)
    for (let i = 0; i < 5; i++) {
      verificationCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate last 2 characters (letters)
    for (let i = 0; i < 2; i++) {
      verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 2. Create certificate record
    const certificateData = {
      recipient_name: request.recipient_name,
      course_name: request.course_name,
      issue_date: request.issue_date,
      expiry_date: request.expiry_date,
      certificate_request_id: requestId,
      verification_code: verificationCode,
      issued_by: issuerId,
      status: "ACTIVE",
      // Include batch information
      batch_id: batchId || request.batch_id,
      batch_name: batchName || request.batch_name,
      // Pass through other useful fields
      location_id: request.location_id,
      length: request.length,
      user_id: request.user_id,
      instructor_name: request.instructor_name
    };

    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert(certificateData)
      .select()
      .single();

    if (certError) {
      console.error("Error creating certificate:", certError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to create certificate: ${certError.message}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log("Certificate created:", certificate.id);

    // 3. Log the certificate creation in the audit log
    try {
      await supabase
        .from("certificate_audit_logs")
        .insert({
          certificate_id: certificate.id,
          action: "CREATED",
          performed_by: issuerId,
        });
    } catch (logError) {
      console.error("Error logging certificate creation:", logError);
      // Non-critical error, continue processing
    }

    // 4. Generate PDF if requested (implement this later)
    if (withPdfGeneration) {
      console.log("PDF generation requested but not implemented yet");
      // TODO: Implement PDF generation
    }

    // 5. Send notification to certificate requester
    try {
      if (request.user_id) {
        const { data: user } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", request.user_id)
          .single();

        if (user?.email) {
          // Send notification through the send-notification function
          const notificationPayload = {
            userId: request.user_id,
            type: "CERTIFICATE_APPROVED",
            title: "Certificate Request Approved",
            message: `Your certificate request for ${request.recipient_name} has been approved`,
            priority: "NORMAL",
            category: "CERTIFICATE",
            recipientEmail: request.email || user.email,
            recipientName: request.recipient_name,
            courseName: request.course_name
          };

          const notificationResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify(notificationPayload)
            }
          );

          if (!notificationResponse.ok) {
            console.error("Error sending notification:", await notificationResponse.text());
          }
        }
      }
    } catch (notifyError) {
      console.error("Error sending notification:", notifyError);
      // Non-critical error, continue processing
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate: certificate,
        message: "Certificate created successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in generate-certificate function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : "Unknown error"}` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
