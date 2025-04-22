
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, Check, X, HelpCircle, Upload } from 'lucide-react';
import { useFontLoader } from '@/hooks/useFontLoader';
import { FONT_FILES } from '@/types/certificate';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function FontDiagnostics() {
  const { fontCache, fontsLoaded, isFontLoading, reloadFonts } = useFontLoader();
  const { data: profile } = useProfile();
  const [isUploading, setIsUploading] = React.useState(false);
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const requiredFonts = Object.values(FONT_FILES);
  
  // Check if fonts are present in the cache
  const getFontStatus = (fontFile: string) => {
    return Object.keys(fontCache).includes(fontFile);
  };
  
  const handleFontUpload = async (fontFile: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can upload fonts');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      setIsUploading(true);
      
      try {
        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = reader.result;
          
          // Upload to Supabase Storage directly
          const { error } = await supabase.storage
            .from('fonts')
            .upload(fontFile, file, {
              contentType: 'font/ttf',
              upsert: true
            });
            
          if (error) {
            console.error('Font upload error:', error);
            throw error;
          }
          
          toast.success(`Font ${fontFile} uploaded successfully`);
          reloadFonts();
        };
      } catch (error) {
        console.error('Error uploading font:', error);
        toast.error(`Failed to upload font: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Font Status</span>
          <HelpCircle 
            className="h-4 w-4 text-muted-foreground cursor-help" 
            aria-label="Help information about fonts"
          />
        </CardTitle>
        <CardDescription>
          Certificate generation requires specific fonts to be loaded from the server.
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
              disabled={isFontLoading}
            >
              {isFontLoading ? 
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                <RefreshCcw className="h-4 w-4 mr-2" />
              }
              Reload Fonts
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Font File</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiredFonts.map((font) => (
                <TableRow key={font}>
                  <TableCell>{font}</TableCell>
                  <TableCell>
                    {isFontLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : getFontStatus(font) ? (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-600">Loaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-600">Failed to load</span>
                      </div>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFontUpload(font)}
                        disabled={isUploading}
                      >
                        {isUploading ? 
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 
                          <Upload className="h-4 w-4 mr-1" />
                        }
                        Upload
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!fontsLoaded && (
            <div className="mt-4 text-amber-600 text-sm">
              <p>Font loading issues detected. Certificate generation may not work correctly.</p>
              {isAdmin && (
                <p className="mt-1">Please upload the required fonts using the Upload buttons above.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
