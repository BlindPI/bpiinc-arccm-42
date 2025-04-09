
import { useState } from 'react';
import { generateCertificatePDF } from '@/utils/pdfUtils';
import { FIELD_CONFIGS } from '@/types/certificate';
import { toast } from 'sonner';
import { FontCache } from '@/hooks/useFontLoader';

interface CertificateData {
  name: string;
  course: string;
  issueDate: string;
  expiryDate: string;
}

export function useCertificateGeneration(fontCache: FontCache) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCertificate = async (certificateData: CertificateData) => {
    setIsGenerating(true);

    try {
      const templateUrl = 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/certificate-template/default-template.pdf';
      const pdfBytes = await generateCertificatePDF(
        templateUrl,
        certificateData,
        fontCache,
        FIELD_CONFIGS
      );

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `certificate-${certificateData.name}.pdf`;
      link.click();

      toast.success('Certificate generated successfully');
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

  return { generateCertificate, isGenerating };
}
