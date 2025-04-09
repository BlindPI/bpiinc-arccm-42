
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle, Upload, RefreshCw, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { FONT_FILES, STORAGE_BUCKETS } from '@/types/certificate';

export const FontDiagnostics = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<'checking' | 'exists' | 'not-exists' | 'error'>('checking');
  const [fontStatuses, setFontStatuses] = useState<Record<string, 'checking' | 'exists' | 'not-exists' | 'error'>>({});
  const [uploadingFont, setUploadingFont] = useState<string | null>(null);
  const [bucketFiles, setBucketFiles] = useState<string[]>([]);

  const checkBucketAndFonts = async () => {
    setIsChecking(true);
    setBucketStatus('checking');
    
    const requiredFonts = Object.values(FONT_FILES);
    const initialStatuses: Record<string, 'checking' | 'exists' | 'not-exists' | 'error'> = {};
    requiredFonts.forEach(font => {
      initialStatuses[font] = 'checking';
    });
    setFontStatuses(initialStatuses);

    try {
      // Check if fonts bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        setBucketStatus('error');
        toast.error(`Error checking storage buckets: ${bucketsError.message}`);
        return;
      }

      const fontBucket = buckets?.find(b => b.name === STORAGE_BUCKETS.fonts);
      
      if (!fontBucket) {
        setBucketStatus('not-exists');
        toast.error(`Font bucket '${STORAGE_BUCKETS.fonts}' does not exist. Please create it in Supabase.`);
        return;
      }

      setBucketStatus('exists');
      
      // Check each required font
      const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.fonts)
        .list();
      
      if (listError) {
        toast.error(`Error listing fonts: ${listError.message}`);
        return;
      }

      // Store the list of files in the bucket for display
      setBucketFiles(files?.map(file => file.name) || []);
      
      const newStatuses = { ...initialStatuses };
      
      // Check each required font with case-insensitive matching
      for (const font of requiredFonts) {
        const exists = files?.some(file => 
          file.name.toLowerCase() === font.toLowerCase() || 
          file.name.toLowerCase() === encodeURIComponent(font).toLowerCase()
        );
        newStatuses[font] = exists ? 'exists' : 'not-exists';
      }
      
      setFontStatuses(newStatuses);
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error(`Error running diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const uploadFont = async (fontName: string, file: File) => {
    setUploadingFont(fontName);
    
    try {
      // Use the exact font name from FONT_FILES for consistency
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.fonts)
        .upload(fontName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        toast.error(`Error uploading ${fontName}: ${error.message}`);
        return;
      }

      toast.success(`Successfully uploaded ${fontName}`);
      
      // Update status to show the font now exists
      setFontStatuses(prev => ({
        ...prev,
        [fontName]: 'exists'
      }));
      
      // Refresh the list of files
      checkBucketAndFonts();
    } catch (error) {
      console.error(`Error uploading ${fontName}:`, error);
      toast.error(`Failed to upload ${fontName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFont(null);
    }
  };

  const handleFileUpload = (fontName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadFont(fontName, file);
  };

  useEffect(() => {
    checkBucketAndFonts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileType className="h-5 w-5" />
          Font System Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 font-medium">Font Bucket Status</div>
            <div>
              {bucketStatus === 'checking' && (
                <span className="flex items-center text-yellow-500">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Checking...
                </span>
              )}
              {bucketStatus === 'exists' && (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bucket exists
                </span>
              )}
              {bucketStatus === 'not-exists' && (
                <span className="flex items-center text-red-500">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Bucket missing
                </span>
              )}
              {bucketStatus === 'error' && (
                <span className="flex items-center text-red-500">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Error checking
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Required font bucket: <code>{STORAGE_BUCKETS.fonts}</code>
          </div>
          
          {/* Display current files in bucket for debugging */}
          {bucketFiles.length > 0 && (
            <div className="border rounded-md p-4 mb-4">
              <h3 className="font-medium mb-2">Current Files in Bucket</h3>
              <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {bucketFiles.map((file, index) => (
                  <div key={index} className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="font-medium">Required Font Files</h3>
            <p className="text-sm text-muted-foreground mb-2">
              These fonts must be uploaded with the EXACT names listed below for certificate generation to work properly.
            </p>
            
            {Object.values(FONT_FILES).map(fontName => (
              <div key={fontName} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fontStatuses[fontName] === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />}
                  {fontStatuses[fontName] === 'exists' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {fontStatuses[fontName] === 'not-exists' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {fontStatuses[fontName] === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className="font-mono">{fontName}</span>
                </div>
                
                {fontStatuses[fontName] === 'not-exists' && (
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!uploadingFont}
                      asChild
                    >
                      <label className="flex items-center gap-1 cursor-pointer">
                        {uploadingFont === fontName ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Font
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".ttf,.otf"
                          onChange={(e) => handleFileUpload(fontName, e)}
                        />
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkBucketAndFonts}
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
