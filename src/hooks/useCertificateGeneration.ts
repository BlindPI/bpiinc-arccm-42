
import { useState } from 'react';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { toast } from 'sonner';
import { FontCache } from '@/hooks/useFontLoader';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CertificateData {
  name: string;
  course: string;
  locationId?: string;
  issueDate: string;
  expiryDate: string;
}

export function useCertificateGeneration(fontCache: FontCache) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCertificate = async (certificateData: CertificateData, templateUrl: string) => {
    if (!templateUrl) {
      toast.error('No template URL provided. Please check template configuration.');
      return;
    }
    
    setIsGenerating(true);
    console.log('Starting certificate generation with data:', certificateData);

    try {
      // Ensure dates are properly formatted
      let issueDate = certificateData.issueDate;
      let expiryDate = certificateData.expiryDate;
      
      // Check if dates need formatting to "Month d, yyyy" format
      if (!issueDate.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
        // Try to parse and format the date
        try {
          const dateObj = new Date(issueDate);
          if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid issue date format');
          }
          issueDate = format(dateObj, 'MMMM d, yyyy');
        } catch (error) {
          toast.error('Invalid issue date format. Please use YYYY-MM-DD format.');
          setIsGenerating(false);
          return;
        }
      }
      
      if (!expiryDate.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
        try {
          const dateObj = new Date(expiryDate);
          if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid expiry date format');
          }
          expiryDate = format(dateObj, 'MMMM d, yyyy');
        } catch (error) {
          toast.error('Invalid expiry date format. Please use YYYY-MM-DD format.');
          setIsGenerating(false);
          return;
        }
      }
      
      const formattedCertificateData = {
        ...certificateData,
        issueDate,
        expiryDate
      };
      
      // Convert FontCache to Record<string, ArrayBuffer> as needed by generateCertificatePDF
      const convertedFontCache: Record<string, ArrayBuffer> = fontCache;
      
      // 1. Generate the PDF using the template and certificate data
      const pdfBytes = await generateCertificatePDF(
        templateUrl,
        formattedCertificateData,
        convertedFontCache,
        FIELD_CONFIGS
      );

      // 2. Get course information for proper naming
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('name')
        .eq('id', certificateData.course)
        .single();
      
      if (courseError) {
        throw new Error(`Error fetching course information: ${courseError.message}`);
      }

      const courseName = courseData?.name || certificateData.course;
      
      // 3. Create a certificate record in the database
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          recipient_name: certificateData.name,
          course_name: courseName,
          location_id: certificateData.locationId || null,
          issue_date: issueDate,
          expiry_date: expiryDate,
          verification_code: generateVerificationCode(),
          issued_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'ACTIVE'
        })
        .select()
        .single();
      
      if (certError) {
        throw new Error(`Error creating certificate record: ${certError.message}`);
      }
      
      // 4. Upload the PDF to storage
      const fileName = `certificate_${certificate.id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certification-pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(`Error uploading certificate PDF: ${uploadError.message}`);
      }
      
      // 5. Get the public URL and update the certificate record
      const { data: publicUrlData } = supabase.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);
      
      if (!publicUrlData) {
        throw new Error('Failed to get public URL for certificate PDF');
      }
      
      const { error: updateError } = await supabase
        .from('certificates')
        .update({
          certificate_url: publicUrlData.publicUrl
        })
        .eq('id', certificate.id);
      
      if (updateError) {
        throw new Error(`Error updating certificate with PDF URL: ${updateError.message}`);
      }
      
      // 6. Log the certificate creation
      try {
        await supabase
          .from('certificate_audit_logs')
          .insert({
            certificate_id: certificate.id,
            action: 'CREATED',
            performed_by: (await supabase.auth.getUser()).data.user?.id,
          });
      } catch (logError) {
        console.error('Error logging certificate creation:', logError);
        // Don't fail the process if just logging fails
      }

      // 7. Send notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_APPROVED',
            title: 'Certificate Generated',
            message: `Your certificate for ${courseName} has been generated and is ready for download.`,
            recipientName: certificateData.name,
            courseName,
            sendEmail: true
          }
        });
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail if just sending notification fails
      }

      toast.success('Certificate generated and stored successfully');
      
      // 8. Download the certificate for the user
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `certificate-${certificateData.name.replace(/\s+/g, '_')}-${certificateData.course.replace(/\s+/g, '_')}.pdf`;
      link.click();
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      let errorMessage = 'Error generating certificate.';
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to generate a verification code
  const generateVerificationCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code = '';
    
    // Generate first 3 characters (letters)
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Generate middle 5 characters (numbers)
    for (let i = 0; i < 5; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate last 2 characters (letters)
    for (let i = 0; i < 2; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  };

  return { generateCertificate, isGenerating };
}
