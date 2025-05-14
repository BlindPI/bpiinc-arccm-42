
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertCircle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TemplateDownloadOptions() {
  const [templateExists, setTemplateExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const templateFileName = 'roster_template.xlsx';
  const bucketName = 'roster-template';
  
  useEffect(() => {
    async function checkTemplateExists() {
      try {
        setIsLoading(true);
        
        // Check if the file exists in storage
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .list('', {
            limit: 100,
            search: templateFileName
          });
        
        if (error) {
          console.error('Error checking template existence:', error);
          setTemplateExists(false);
          toast.error("Couldn't check if template exists");
        } else {
          // Check if any file matches the template name
          const fileExists = data && data.length > 0 && data.some(file => file.name === templateFileName);
          setTemplateExists(!!fileExists);
        }
      } catch (error) {
        console.error('Exception checking template:', error);
        setTemplateExists(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkTemplateExists();
  }, []);

  const getTemplateUrl = () => {
    return supabase.storage.from(bucketName).getPublicUrl(templateFileName).data.publicUrl;
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
        ) : templateExists ? (
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={getTemplateUrl()} target="_blank" rel="noopener noreferrer" download>
                <FileSpreadsheet className="w-4 h-4" />
                Download Template
              </a>
            </Button>
            <span className="text-xs text-muted-foreground text-center">Excel format (.xlsx)</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Template is not available. Please contact the administrator to upload a template.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
