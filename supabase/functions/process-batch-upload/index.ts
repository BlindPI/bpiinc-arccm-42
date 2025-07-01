
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface BatchUploadRequest {
  processedData: {
    data: any[];
    totalCount: number;
    errorCount: number;
  };
  selectedLocationId: string;
  rosterName: string;
  submittedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase;
  
  try {
    // Initialize Supabase client
    supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (!supabase) {
      throw new Error("Failed to initialize Supabase client");
    }

    // Parse and validate request body
    let requestBody: BatchUploadRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request body format'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { processedData, selectedLocationId, rosterName, submittedBy } = requestBody;

    // Validate required fields
    if (!processedData || !selectedLocationId || !rosterName || !submittedBy) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: processedData, selectedLocationId, rosterName, submittedBy'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('Starting batch upload processing...', {
      totalRecords: processedData.totalCount || processedData.data?.length || 0,
      locationId: selectedLocationId,
      rosterName
    });

    // Safely filter valid records - handle cases where properties might not exist
    const validRecords = (processedData.data || []).filter(row => {
      // Handle different possible structures
      const hasValidationErrors = Array.isArray(row.validationErrors) && row.validationErrors.length > 0;
      const hasCourseMismatch = row.hasCourseMismatch === true;
      
      return !hasValidationErrors && !hasCourseMismatch;
    });

    console.log('Valid records filtered:', validRecords.length);

    if (validRecords.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid records to process'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Create roster entry
    const { data: rosterData, error: rosterError } = await supabase
      .from('rosters')
      .insert({
        name: rosterName,
        location_id: selectedLocationId,
        created_by: submittedBy,
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        total_count: validRecords.length
      })
      .select()
      .single();

    if (rosterError || !rosterData) {
      console.error('Failed to create roster:', rosterError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to create roster: ${rosterError?.message || 'Unknown error'}`
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const rosterUUID = rosterData.id;
    console.log('Roster created successfully with ID:', rosterUUID);

    // Prepare certificate requests with safe property access
    const certificateRequests = validRecords.map(row => {
      // Calculate expiry date (default to 24 months if not specified)
      const expirationMonths = row.courseMatch?.expiration_months || 24;
      const expiryDate = new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return {
        user_id: submittedBy,
        recipient_name: row.recipientName || row.name || '',
        recipient_email: row.email || '',
        recipient_phone: row.phone || null,
        company: row.company || null,
        course_name: row.courseMatch?.name || row.courseName || 'Unknown Course',
        course_id: row.courseMatch?.id || null,
        location_id: selectedLocationId,
        roster_id: rosterUUID,
        batch_id: rosterUUID,
        batch_name: rosterName,
        status: 'PENDING',
        assessment_status: row.assessmentStatus === 'PASS' ? 'PASS' : 'FAIL',
        length: row.courseMatch?.length || null, // Use 'length' not 'course_length'
        expiration_months: expirationMonths,
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: expiryDate
      };
    });

    console.log('Inserting certificate requests:', certificateRequests.length);

    // Bulk insert certificate requests
    const { data: insertedRequests, error: insertError } = await supabase
      .from('certificate_requests')
      .insert(certificateRequests)
      .select();

    if (insertError) {
      console.error('Failed to insert certificate requests:', insertError);
      
      // Attempt rollback - delete the roster
      try {
        await supabase.from('rosters').delete().eq('id', rosterUUID);
        console.log('Rollback: Roster deleted successfully');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to insert certificate requests: ${insertError.message}`
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log('Certificate requests inserted successfully:', insertedRequests?.length);

    // Try to trigger email notification (non-critical)
    try {
      console.log('Triggering batch email notification...');
      const emailResult = await supabase.functions.invoke('batch-request-email-details', {
        body: {
          rosterId: rosterUUID,
          locationId: selectedLocationId,
          submittedBy: submittedBy,
          rosterData: processedData.data,
          batchName: rosterName
        }
      });

      if (emailResult.error) {
        console.warn('Email notification failed (non-critical):', emailResult.error);
      } else {
        console.log('Email notification sent successfully');
      }
    } catch (emailError) {
      console.warn('Email notification error (non-critical):', emailError);
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      rosterId: rosterUUID,
      rosterName,
      validRecordsProcessed: validRecords.length,
      totalRecordsSubmitted: processedData.totalCount || processedData.data?.length || 0,
      message: 'Batch upload processed successfully'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("Batch upload processing failed:", error);
    
    // Always return a response with CORS headers, even on error
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred during batch processing'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
