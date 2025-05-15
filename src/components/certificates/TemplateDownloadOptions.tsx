
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, AlertCircle, Info, Loader2, RefreshCw, ServerOff, FileX, LockKeyhole } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { checkTemplateAvailability, getLocalTemplateUrl } from './template-utils';
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
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  
  // List of bucket names to try in order
  const bucketVariations = [
    bucketName,
    bucketName === 'roster-template' ? 'certificate-template' : 'roster-template',
    'templates',
    'template',
    'training-templates',
    'public-templates'
  ];
  
  // Enhanced template verification with detailed error handling and multiple fallbacks
  const checkTemplate = async () => {
    try {
      setIsLoading(true);
      setErrorType(null);
      setErrorDetails(null);
      setUsingLocalFallback(false);
      
      console.log(`Checking template availability: ${bucketName}/${fileName} (Attempt ${retryCount + 1})`);
      
      // Try to list all available buckets first to debug what's available
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (!bucketsError && buckets) {
        console.log('Available buckets:', buckets.map(b => b.name));
        // If the specified bucket doesn't exist, try finding an appropriate one
        if (!buckets.some(b => b.name === bucketName)) {
          const possibleBucket = buckets.find(b => 
            b.name.includes('template') || 
            b.name.includes('roster') || 
            b.name.includes('certificate')
          );
          
          if (possibleBucket) {
            console.log(`Specified bucket "${bucketName}" not found, trying "${possibleBucket.name}" instead`);
            const result = await checkTemplateAvailability(possibleBucket.name, fileName);
            
            if (result.exists && result.url) {
              console.log(`Template found in alternate bucket: ${result.url}`);
              setTemplateUrl(result.url);
              setTemplateExists(true);
              setIsLoading(false);
              return;
            }
          }
        }
      } else {
        console.error('Error listing buckets:', bucketsError);
      }
      
      // Try each bucket variation until we find a working one
      for (const currentBucket of bucketVariations) {
        console.log(`Trying bucket: ${currentBucket}`);
        const result = await checkTemplateAvailability(currentBucket, fileName);
        
        if (result.exists && result.url) {
          console.log(`Template found in bucket ${currentBucket}: ${result.url}`);
          setTemplateUrl(result.url);
          setTemplateExists(true);
          setIsLoading(false);
          return;
        }
      }
      
      // If all buckets failed, try the local fallback template
      console.log('No template found in any Supabase bucket, falling back to local template');
      const localTemplateUrl = getLocalTemplateUrl(fileName);
      
      // Check if local template exists
      try {
        const response = await fetch(localTemplateUrl, { method: 'HEAD' });
        
        if (response.ok) {
          console.log('Local template is accessible:', localTemplateUrl);
          setTemplateUrl(localTemplateUrl);
          setTemplateExists(true);
          setUsingLocalFallback(true);
          
          // Show helpful toast about using local template
          toast.info('Using local template file. Upload to Supabase for production use.');
        } else {
          console.error('Local template is not accessible:', response.status, response.statusText);
          setErrorType('file');
          setErrorDetails('Template not found in storage or local fallback');
          setTemplateExists(false);
          setTemplateUrl(null);
        }
      } catch (fetchError) {
        console.error('Error accessing local template:', fetchError);
        setErrorType('connection');
        setErrorDetails('Network error accessing template files');
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className={`gap-2 ${usingLocalFallback ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-green-50 hover:bg-green-100'} transition-colors`}
                  >
                    <a 
                      href={templateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      download
                      onClick={() => toast.success(`Downloading ${templateType} template...`)}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Download {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template
                      {usingLocalFallback && ' (Local)'}
                    </a>
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">
                    {templateType === 'roster' ? 'Excel format (.xlsx)' : 'PDF format (.pdf)'}
                    {usingLocalFallback && ' - Using local file'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {usingLocalFallback 
                    ? 'Using local template file. For production, upload to Supabase storage.' 
                    : 'Template verified and ready for download'}
                </p>
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
