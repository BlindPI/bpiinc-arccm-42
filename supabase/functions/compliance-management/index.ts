
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

interface ComplianceData {
  isCompliant: boolean;
  notes?: string;
  lastCheck?: string;
  submittedDocuments: number;
  requiredDocuments: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract URL parameters for GET requests
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Starting compliance check for user:', userId);

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Get document requirements for the user's role
    const { data: requirements, error: reqError } = await supabaseClient
      .from('document_requirements')
      .select('id')
      .eq('required_for_role', profile.role);

    if (reqError) {
      console.error('Error fetching requirements:', reqError);
      throw new Error('Failed to fetch document requirements');
    }

    // Get approved document submissions
    const { data: submissions, error: subError } = await supabaseClient
      .from('document_submissions')
      .select('id, expiry_date, status')
      .eq('instructor_id', userId)
      .eq('status', 'APPROVED');

    if (subError) {
      console.error('Error fetching submissions:', subError);
      throw new Error('Failed to fetch document submissions');
    }

    // Check for expired documents
    const now = new Date();
    const expiredDocs = submissions?.filter(sub => 
      sub.expiry_date && new Date(sub.expiry_date) < now
    ) || [];

    // Calculate compliance
    const requiredCount = requirements?.length || 0;
    const validSubmissions = submissions?.length || 0;
    const isCompliant = validSubmissions >= requiredCount && expiredDocs.length === 0;

    // Update compliance status in profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        compliance_status: isCompliant,
        compliance_notes: isCompliant ? null : `Missing ${requiredCount - validSubmissions} required documents. ${expiredDocs.length} expired documents.`,
        last_compliance_check: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating compliance status:', updateError);
      throw new Error('Failed to update compliance status');
    }

    // Record compliance check in history
    const { error: historyError } = await supabaseClient
      .from('compliance_check_history')
      .insert({
        instructor_id: userId,
        status: isCompliant,
        details: {
          required_documents: requiredCount,
          valid_submissions: validSubmissions,
          expired_documents: expiredDocs.length,
          notes: isCompliant ? 'All requirements met' : `Missing or expired documents`
        }
      });

    if (historyError) {
      console.error('Error recording compliance history:', historyError);
      throw new Error('Failed to record compliance check history');
    }

    // Check for documents nearing expiration (30 days warning)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocs = submissions?.filter(sub => 
      sub.expiry_date && 
      new Date(sub.expiry_date) > now &&
      new Date(sub.expiry_date) <= thirtyDaysFromNow
    ) || [];

    // Create notifications for expiring documents
    for (const doc of expiringDocs) {
      const { error: notifError } = await supabaseClient
        .from('notifications')
        .insert({
          recipient_id: userId,
          type: 'DOCUMENT_EXPIRING',
          title: 'Document Expiring Soon',
          message: `You have a document that will expire on ${new Date(doc.expiry_date).toLocaleDateString()}`,
          metadata: {
            document_id: doc.id,
            expiry_date: doc.expiry_date
          }
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't throw here, continue processing other documents
      }
    }

    // Prepare response data
    const complianceData: ComplianceData = {
      isCompliant,
      notes: isCompliant ? undefined : `Missing ${requiredCount - validSubmissions} required documents. ${expiredDocs.length} expired documents.`,
      lastCheck: new Date().toISOString(),
      submittedDocuments: validSubmissions,
      requiredDocuments: requiredCount
    };

    return new Response(
      JSON.stringify({ data: complianceData }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in compliance management:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: { 
          message: errorMessage
        }
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
