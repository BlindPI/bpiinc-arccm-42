
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { checkTemplateAvailability } from './template-utils';
import { supabase } from '@/integrations/supabase/client';

interface TemplateDownloadOptionsProps {
  templateType?: 'roster' | 'certificate';
  bucketName?: string;
  fileName?: string;
}

export function TemplateDownloadOptions({
  templateType = 'roster',
  bucketName = 'roster-template',
  fileName = 'roster_template.xlsx'
}: TemplateDownloadOptionsProps) {
  const [templateExists, setTemplateExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  
  const checkTemplate = async () => {
    try {
      setIsLoading(true);
      
      // Check if the template exists in Supabase storage
      const result = await checkTemplateAvailability(bucketName, fileName);
      
      if (result.exists && result.url) {
        console.log('Template found in Supabase:', result.url);
        setTemplateUrl(result.url);
        setTemplateExists(true);
      } else {
        console.log('Template not found in Supabase');
        // No fallback to local files anymore
        setTemplateExists(false);
        setTemplateUrl(null);
      }
    } catch (error) {
      console.error('Exception checking template:', error);
      setTemplateExists(false);
      setTemplateUrl(null);
      toast.error('Failed to check template availability');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTemplate();
  }, [bucketName, fileName]);

  const handleRefreshCheck = () => {
    toast.info('Checking template availability...');
    checkTemplate();
  };

  // Display based on template type
  const templateDescription = templateType === 'roster' 
    ? 'The roster template includes columns for First Aid Level, CPR Level, and Course Length to enable automatic course matching.'
    : 'Download the certificate template to see the available fields and layout.';

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {templateDescription}
          {templateType === 'roster' && ' Fill these fields to ensure students are assigned to the correct certificates.'}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-wrap gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking template availability...
          </div>
        ) : templateExists && templateUrl ? (
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={templateUrl} target="_blank" rel="noopener noreferrer" download>
                <FileSpreadsheet className="w-4 h-4" />
                Download {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template
              </a>
            </Button>
            <span className="text-xs text-muted-foreground text-center">
              {templateType === 'roster' ? 'Excel format (.xlsx)' : 'PDF format (.pdf)'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Template is not available. Please contact the administrator to upload a template.
              </AlertDescription>
            </Alert>
            {isLoading ? null : (
              <Button variant="outline" size="sm" onClick={handleRefreshCheck} className="gap-2 w-fit">
                <RefreshCw className="w-4 h-4" />
                Refresh Check
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
