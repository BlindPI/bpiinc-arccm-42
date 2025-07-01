
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { processedData, selectedLocationId, rosterName, submittedBy }: BatchUploadRequest = await req.json();

    console.log('Starting batch upload processing...', {
      totalRecords: processedData.totalCount,
      validRecords: processedData.data.filter(row => row.validationErrors.length === 0).length,
      locationId: selectedLocationId,
      rosterName
    });

    // Filter valid records only
    const validRecords = processedData.data.filter(row => 
      row.validationErrors.length === 0 && !row.hasCourseMismatch
    );

    if (validRecords.length === 0) {
      throw new Error('No valid records to process');
    }

    // Create roster entry - let database generate UUID
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
      throw new Error(`Failed to create roster: ${rosterError?.message || 'Unknown error'}`);
    }

    const rosterUUID = rosterData.id;
    console.log('Roster created successfully with ID:', rosterUUID);

    // Prepare certificate requests with proper data structure
    const certificateRequests = validRecords.map(row => ({
      user_id: submittedBy,
      recipient_name: row.recipientName,
      recipient_email: row.email,
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
      course_length: row.courseMatch?.length || null,
      expiration_months: row.courseMatch?.expiration_months || 24,
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + (row.courseMatch?.expiration_months || 24) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));

    console.log('Inserting certificate requests:', certificateRequests.length);

    // Bulk insert certificate requests
    const { data: insertedRequests, error: insertError } = await supabase
      .from('certificate_requests')
      .insert(certificateRequests)
      .select();

    if (insertError) {
      console.error('Failed to insert certificate requests:', insertError);
      // Rollback roster creation
      await supabase.from('rosters').delete().eq('id', rosterUUID);
      throw new Error(`Failed to insert certificate requests: ${insertError.message}`);
    }

    console.log('Certificate requests inserted successfully:', insertedRequests?.length);

    // Trigger email notification (separate concern)
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

    return new Response(JSON.stringify({
      success: true,
      rosterId: rosterUUID,
      rosterName,
      validRecordsProcessed: validRecords.length,
      totalRecordsSubmitted: processedData.totalCount,
      message: 'Batch upload processed successfully'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("Batch upload processing failed:", error);
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
