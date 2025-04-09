
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FONT_FILES } from '@/types/certificate';

export type FontCache = Record<string, ArrayBuffer>;

export const useFontLoader = () => {
  const [fontCache, setFontCache] = useState<FontCache>({});
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    setIsLoading(true);
    
    try {
      // Load from the fonts bucket only - no fallbacks
      const fontBucket = 'fonts';
      const standardFonts = Object.values(FONT_FILES);
      
      console.log(`Loading fonts from ${fontBucket} bucket`);
      
      const newFontCache: FontCache = {};
      
      const fontPromises = standardFonts.map(async (fontName) => {
        try {
          console.log(`Attempting to load font: ${fontName} from ${fontBucket}`);
          
          const { data, error } = await supabase.storage
            .from(fontBucket)
            .download(fontName);
          
          if (error) {
            console.error(`Error loading font ${fontName}:`, error);
            return null;
          }
          
          if (data) {
            const buffer = await data.arrayBuffer();
            console.log(`Successfully loaded font: ${fontName}`);
            return { fontName, buffer };
          }
        } catch (err) {
          console.error(`Error processing font ${fontName}:`, err);
        }
        
        return null;
      });
      
      const fonts = await Promise.all(fontPromises);
      
      fonts.forEach((font) => {
        if (font && font.buffer) {
          newFontCache[font.fontName] = font.buffer;
        }
      });
      
      console.log('Loaded fonts:', Object.keys(newFontCache));
      setFontCache(newFontCache);
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error in font loading process:', error);
      toast.error('Failed to load required fonts for certificates');
      setFontsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { fontCache, fontsLoaded, isLoading, reloadFonts: loadFonts };
};
