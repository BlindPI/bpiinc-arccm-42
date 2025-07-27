import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { toast } from 'sonner';

export class PDFGenerationService {
  static async generateMissingPDFs(fontCache: Record<string, ArrayBuffer>) {
    try {
      console.log('🔍 Starting PDF generation for missing certificates...');
      
      // Get certificates without PDFs
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('*')
        .is('certificate_url', null)
        .limit(10);

      if (error) {
        throw error;
      }

      if (!certificates || certificates.length === 0) {
        console.log('✅ No certificates need PDF generation');
        return { success: true, generated: 0 };
      }

      console.log(`📋 Found ${certificates.length} certificates needing PDFs`);
      
      // Get default template
      const { data: template } = await supabase
        .from('certificate_templates')
        .select('url')
        .eq('is_default', true)
        .single();

      if (!template?.url) {
        throw new Error('No default template found');
      }

      let generated = 0;
      for (const cert of certificates) {
        try {
          console.log(`🔧 Generating PDF for certificate: ${cert.id}`);
          
          // Generate PDF
          const pdfBytes = await generateCertificatePDF(
            template.url,
            {
              name: cert.recipient_name,
              course: cert.course_name,
              issueDate: cert.issue_date,
              expiryDate: cert.expiry_date
            },
            fontCache,
            FIELD_CONFIGS
          );

          // Upload PDF to storage
          const fileName = `certificate_${cert.id}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('certification-pdfs')
            .upload(fileName, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error(`❌ Upload failed for ${cert.id}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('certification-pdfs')
            .getPublicUrl(fileName);

          // Update certificate record
          const { error: updateError } = await supabase
            .from('certificates')
            .update({ certificate_url: publicUrlData.publicUrl })
            .eq('id', cert.id);

          if (updateError) {
            console.error(`❌ Update failed for ${cert.id}:`, updateError);
            continue;
          }

          generated++;
          console.log(`✅ Generated PDF for certificate: ${cert.id}`);
          
        } catch (error) {
          console.error(`❌ Failed to generate PDF for ${cert.id}:`, error);
        }
      }

      console.log(`🎉 Successfully generated ${generated} PDFs`);
      return { success: true, generated };

    } catch (error) {
      console.error('❌ PDF generation service error:', error);
      throw error;
    }
  }

  static async generateSinglePDF(certificateId: string, fontCache: Record<string, ArrayBuffer>) {
    try {
      // Get certificate data
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (error || !cert) {
        throw new Error('Certificate not found');
      }

      // Get default template
      const { data: template } = await supabase
        .from('certificate_templates')
        .select('url')
        .eq('is_default', true)
        .single();

      if (!template?.url) {
        throw new Error('No default template found');
      }

      // Generate PDF
      const pdfBytes = await generateCertificatePDF(
        template.url,
        {
          name: cert.recipient_name,
          course: cert.course_name,
          issueDate: cert.issue_date,
          expiryDate: cert.expiry_date
        },
        fontCache,
        FIELD_CONFIGS
      );

      // Upload PDF to storage
      const fileName = `certificate_${cert.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certification-pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);

      // Update certificate record
      const { error: updateError } = await supabase
        .from('certificates')
        .update({ certificate_url: publicUrlData.publicUrl })
        .eq('id', cert.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true, url: publicUrlData.publicUrl };

    } catch (error) {
      console.error('❌ Single PDF generation failed:', error);
      throw error;
    }
  }
}