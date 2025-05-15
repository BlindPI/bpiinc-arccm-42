
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertCircle, Info, Loader2, RefreshCw, ServerOff, FileX, LockKeyhole } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { checkTemplateAvailability } from './template-utils';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [errorType, setErrorType] = useState<'connection' | 'file' | 'permission' | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Enhanced template verification with detailed error handling
  const checkTemplate = async () => {
    try {
      setIsLoading(true);
      setErrorType(null);
      setErrorDetails(null);
      
      console.log(`Checking template availability: ${bucketName}/${fileName} (Attempt ${retryCount + 1})`);
      
      // First check - verify bucket exists
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketError) {
        console.error('Error accessing storage buckets:', bucketError);
        setErrorType('connection');
        setErrorDetails(`Storage service unavailable: ${bucketError.message}`);
        setTemplateExists(false);
        setTemplateUrl(null);
        return;
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.error(`Bucket does not exist: ${bucketName}`);
        setErrorType('permission');
        setErrorDetails(`Template storage location '${bucketName}' does not exist`);
        setTemplateExists(false);
        setTemplateUrl(null);
        return;
      }
      
      // Second check - check if the template exists in Supabase storage
      const result = await checkTemplateAvailability(bucketName, fileName);
      
      if (result.exists && result.url) {
        console.log('Template found in Supabase:', result.url);
        
        // Third check - verify file can be accessed
        try {
          const response = await fetch(result.url, { method: 'HEAD' });
          
          if (!response.ok) {
            console.error(`Template file exists but is not accessible: ${response.status} ${response.statusText}`);
            setErrorType('file');
            setErrorDetails(`File exists but is not accessible: HTTP ${response.status}`);
            setTemplateExists(false);
            setTemplateUrl(null);
            return;
          }
          
          // Final check - verify content type for file integrity
          const contentType = response.headers.get('content-type');
          const isValidContentType = templateType === 'roster' 
            ? contentType?.includes('spreadsheet') || contentType?.includes('excel') || contentType?.includes('openxmlformats')
            : contentType?.includes('pdf');
            
          if (!isValidContentType) {
            console.warn(`File may be corrupted. Unexpected content type: ${contentType}`);
          }
          
          // Template exists and is accessible
          setTemplateUrl(result.url);
          setTemplateExists(true);
        } catch (fetchError) {
          console.error('Network error accessing template:', fetchError);
          setErrorType('connection');
          setErrorDetails('Network error accessing template file');
          setTemplateExists(false);
          setTemplateUrl(null);
        }
      } else {
        console.log('Template not found in Supabase');
        setErrorType('file');
        setErrorDetails(`Template file '${fileName}' not found in storage`);
        setTemplateExists(false);
        setTemplateUrl(null);
      }
    } catch (error) {
      console.error('Exception checking template:', error);
      setErrorType('connection');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error occurred');
      setTemplateExists(false);
      setTemplateUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTemplate();
  }, [bucketName, fileName, retryCount]);

  const handleRefreshCheck = () => {
    toast.info('Checking template availability...');
    setRetryCount(prev => prev + 1);
  };

  // Render appropriate error message and icon based on error type
  const renderErrorContent = () => {
    switch (errorType) {
      case 'connection':
        return (
          <Alert variant="destructive">
            <ServerOff className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>Server Connection Error</strong></p>
              <p>{errorDetails || 'Unable to connect to template service'}</p>
              <p className="text-xs">This is likely a temporary issue. Try again in a few moments or contact support if the problem persists.</p>
            </AlertDescription>
          </Alert>
        );
      case 'file':
        return (
          <Alert variant="destructive">
            <FileX className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>Template File Error</strong></p>
              <p>{errorDetails || 'Template file is missing or corrupted'}</p>
              <p className="text-xs">Please contact your administrator to upload a valid template file.</p>
            </AlertDescription>
          </Alert>
        );
      case 'permission':
        return (
          <Alert variant="destructive">
            <LockKeyhole className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>Access Permission Error</strong></p>
              <p>{errorDetails || 'You do not have permission to access this template'}</p>
              <p className="text-xs">Contact your system administrator to resolve permission issues.</p>
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Template is not available. Please contact the administrator to upload a template.
            </AlertDescription>
          </Alert>
        );
    }
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="gap-2 bg-green-50 hover:bg-green-100 transition-colors">
                    <a 
                      href={templateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      download
                      onClick={() => toast.success(`Downloading ${templateType} template...`)}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template
                    </a>
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">
                    {templateType === 'roster' ? 'Excel format (.xlsx)' : 'PDF format (.pdf)'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Template verified and ready for download</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex flex-col gap-4">
            {renderErrorContent()}
            {!isLoading && (
              <Button variant="outline" size="sm" onClick={handleRefreshCheck} className="gap-2 w-fit">
                <RefreshCw className="w-4 h-4" />
                Retry Check
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
