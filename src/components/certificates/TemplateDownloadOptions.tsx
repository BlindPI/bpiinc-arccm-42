import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { checkTemplateAvailability, getLocalTemplateUrl, addCacheBuster } from './template-utils';

export function TemplateDownloadOptions() {
  const [templateExists, setTemplateExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const templateFileName = 'roster_template.xlsx';
  const bucketName = 'roster-template';
  
  const checkTemplate = async () => {
    try {
      setIsLoading(true);
      
      // Check if the template exists in Supabase storage
      const result = await checkTemplateAvailability(bucketName, templateFileName);
      
      if (result.exists && result.url) {
        console.log('Template found in Supabase:', result.url);
        setTemplateUrl(result.url);
        setTemplateExists(true);
      } else {
        console.log('Template not found in Supabase, checking local fallback');
        // If not found in Supabase, try the local fallback
        const localUrl = getLocalTemplateUrl(templateFileName);
        
        // Attempt to fetch the local file to see if it exists
        try {
          const response = await fetch(localUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log('Found local fallback template');
            setTemplateUrl(localUrl);
            setTemplateExists(true);
          } else {
            console.log('No local fallback template found');
            setTemplateExists(false);
            setTemplateUrl(null);
          }
        } catch (err) {
          console.error('Error checking local template:', err);
          setTemplateExists(false);
          setTemplateUrl(null);
        }
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
  }, []);

  const handleRefreshCheck = () => {
    toast.info('Checking template availability...');
    checkTemplate();
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The roster template includes columns for First Aid Level, CPR Level, and Course Length 
          to enable automatic course matching. Fill these fields to ensure students are assigned to the correct certificates.
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
                Download Template
              </a>
            </Button>
            <span className="text-xs text-muted-foreground text-center">Excel format (.xlsx)</span>
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
