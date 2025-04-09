
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCcw, Upload, Check, X, HelpCircle } from 'lucide-react';
import { useFontLoader } from '@/hooks/useFontLoader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FONT_FILES, STORAGE_BUCKETS } from '@/types/certificate';
import { useProfile } from '@/hooks/useProfile';

export function FontDiagnostics() {
  const { fontCache, fontsLoaded, isLoading, reloadFonts } = useFontLoader();
  const { data: profile } = useProfile();
  const [selectedFont, setSelectedFont] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useEdgeFunction, setUseEdgeFunction] = useState(false);
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const fontBucketName = STORAGE_BUCKETS.fonts;
  const requiredFonts = Object.values(FONT_FILES);
  
  // Check if fonts are present in the cache
  const getFontStatus = (fontFile: string) => {
    return Object.keys(fontCache).includes(fontFile);
  };
  
  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFont(e.target.files[0]);
    }
  };
  
  const handleUploadFont = async () => {
    if (!selectedFont) {
      toast.error('Please select a font file to upload');
      return;
    }
    
    if (!isAdmin) {
      toast.error('Only administrators can upload fonts');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Check if the file name matches one of our required fonts
      const matchesRequired = requiredFonts.some(
        fontName => fontName.toLowerCase() === selectedFont.name.toLowerCase()
      );
      
      if (!matchesRequired) {
        const proceed = window.confirm(
          `The font "${selectedFont.name}" doesn't match any of the required font names: ${requiredFonts.join(', ')}. Do you want to proceed anyway?`
        );
        
        if (!proceed) {
          setIsUploading(false);
          return;
        }
      }
      
      if (useEdgeFunction) {
        // Use the edge function to bypass RLS issues
        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedFont);
        reader.onload = async () => {
          const base64 = reader.result as string;
          
          try {
            const { data, error } = await supabase.functions.invoke('upload-fonts', {
              body: {
                fontName: selectedFont.name,
                fileBase64: base64,
                bucketId: fontBucketName
              }
            });
            
            if (error) throw error;
            
            toast.success(`Font ${selectedFont.name} uploaded successfully via edge function`);
            setSelectedFont(null);
            reloadFonts();
          } catch (err) {
            console.error('Error uploading font via edge function:', err);
            toast.error(`Failed to upload font: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read the font file');
        };
      } else {
        // Use direct storage API
        const { error } = await supabase.storage
          .from(fontBucketName)
          .upload(selectedFont.name, selectedFont, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) {
          if (error.message.includes('Permission denied')) {
            toast.error('Permission denied. Try using the edge function upload method instead.');
            setUseEdgeFunction(true);
          } else {
            throw error;
          }
        } else {
          toast.success(`Font ${selectedFont.name} uploaded successfully`);
          setSelectedFont(null);
          reloadFonts();
        }
      }
    } catch (error) {
      console.error('Error uploading font:', error);
      toast.error(`Failed to upload font: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If we get a permission error, suggest using the edge function
      if (error instanceof Error && error.message.includes('Permission denied')) {
        setUseEdgeFunction(true);
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const createFontBucket = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can create buckets');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('upload-fonts', {
        body: {
          action: 'create-bucket',
          bucketName: fontBucketName
        }
      });
      
      if (error) throw error;
      
      toast.success(`Bucket ${fontBucketName} created or already exists`);
      reloadFonts();
    } catch (error) {
      console.error('Error creating bucket:', error);
      toast.error(`Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Font Management</span>
          <HelpCircle 
            className="h-4 w-4 text-muted-foreground cursor-help" 
            aria-label="Help information about fonts"
          />
        </CardTitle>
        <CardDescription>
          Certificate generation requires specific fonts to be available in the Supabase {fontBucketName} bucket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Font Status</h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={reloadFonts} 
              disabled={isLoading}
            >
              {isLoading ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                <RefreshCcw className="h-4 w-4 mr-2" />
              }
              Refresh
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Font File</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiredFonts.map((font) => (
                <TableRow key={font}>
                  <TableCell>{font}</TableCell>
                  <TableCell>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : getFontStatus(font) ? (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-600">Loaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-600">Missing</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground mt-2">
              Only administrators can upload fonts. Please contact your administrator if fonts are missing.
            </p>
          ) : (
            <>
              <div className="mt-4 border-t pt-4">
                <h3 className="text-md font-medium mb-2">Upload Font</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".ttf,.otf"
                      onChange={handleFontFileChange}
                      disabled={isUploading}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleUploadFont}
                    disabled={!selectedFont || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Font
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center mt-2">
                  <Button
                    variant="link"
                    className="text-xs p-0 h-auto"
                    onClick={() => setUseEdgeFunction(!useEdgeFunction)}
                  >
                    {useEdgeFunction 
                      ? 'Use direct storage upload instead' 
                      : 'Having issues? Try edge function upload'}
                  </Button>
                  
                  <Button
                    variant="link"
                    className="text-xs p-0 h-auto ml-4"
                    onClick={createFontBucket}
                  >
                    Create fonts bucket
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Required font files:</p>
                <ul className="list-disc list-inside mt-1">
                  {requiredFonts.map((font) => (
                    <li key={font}>{font}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
