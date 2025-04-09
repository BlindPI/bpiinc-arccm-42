
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
import { Loader2, RefreshCcw, Check, X, HelpCircle } from 'lucide-react';
import { useFontLoader } from '@/hooks/useFontLoader';
import { FONT_FILES } from '@/types/certificate';
import { useProfile } from '@/hooks/useProfile';

export function FontDiagnostics() {
  const { fontCache, fontsLoaded, isLoading, reloadFonts } = useFontLoader();
  const { data: profile } = useProfile();
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const requiredFonts = Object.values(FONT_FILES);
  
  // Check if fonts are present in the cache
  const getFontStatus = (fontFile: string) => {
    return Object.keys(fontCache).includes(fontFile);
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
              disabled={isLoading}
            >
              {isLoading ? 
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
                        <span className="text-red-600">Failed to load</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!fontsLoaded && (
            <div className="mt-4 text-amber-600 text-sm">
              <p>Font loading issues detected. Certificate generation may not work correctly.</p>
              <p className="mt-1">Direct font URLs being used:</p>
              <ul className="list-disc list-inside mt-1 text-xs">
                <li><code>https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//tahoma.ttf</code></li>
                <li><code>https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//tahomabd.ttf</code></li>
                <li><code>https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//Segoe%20UI.ttf</code></li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
