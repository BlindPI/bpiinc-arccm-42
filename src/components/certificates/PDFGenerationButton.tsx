import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PDFGenerationService } from '@/services/certificates/pdfGenerationService';
import { useFontLoader } from '@/hooks/useFontLoader';

interface PDFGenerationButtonProps {
  certificateId?: string;
  onSuccess?: () => void;
}

export function PDFGenerationButton({ certificateId, onSuccess }: PDFGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { fontCache, isFontLoading: fontsLoading } = useFontLoader();

  const handleGenerate = async () => {
    if (fontsLoading || !fontCache) {
      toast.error('Fonts are still loading, please wait...');
      return;
    }

    setIsGenerating(true);
    try {
      if (certificateId) {
        await PDFGenerationService.generateSinglePDF(certificateId, fontCache);
        toast.success('Certificate PDF generated successfully!');
      } else {
        const result = await PDFGenerationService.generateMissingPDFs(fontCache);
        toast.success(`Generated ${result.generated} certificate PDFs!`);
      }
      onSuccess?.();
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || fontsLoading}
      variant="outline"
      size="sm"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isGenerating 
        ? 'Generating...' 
        : certificateId 
          ? 'Generate PDF' 
          : 'Generate Missing PDFs'
      }
    </Button>
  );
}