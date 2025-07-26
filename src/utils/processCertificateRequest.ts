import { EdgeFunctionService } from '@/services/edgeFunctions/edgeFunctionService';
import { supabase } from '@/integrations/supabase/client';

export async function processCertificateRequest(requestId: string, issuerId: string) {
  try {
    console.log(`🚀 Processing certificate request: ${requestId}`);
    
    // First, update the status to APPROVED if it's still PROCESSING
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({ 
        status: 'APPROVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update certificate request status:', updateError);
      throw updateError;
    }

    // Call the edge function to generate the certificate
    console.log('🔧 Calling generate-certificate edge function...');
    const result = await EdgeFunctionService.generateCertificate(requestId, issuerId);
    
    if (!result.success) {
      console.error('Certificate generation failed:', result.error);
      throw new Error(result.error || 'Certificate generation failed');
    }

    console.log('✅ Certificate generated successfully:', result.data);
    return result.data;

  } catch (error) {
    console.error('Error processing certificate request:', error);
    throw error;
  }
}

// Quick function to process the stuck certificate
export async function processStuckCertificate() {
  return processCertificateRequest(
    '3a5ffca2-a369-4d1d-800c-7ba38a7ca58a',
    '27d8a03f-4c78-4aac-9b6e-c4a8eb99f8f2'
  );
}