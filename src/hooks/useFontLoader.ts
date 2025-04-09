
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FONT_FILES, STORAGE_BUCKETS } from '@/types/certificate';

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
      console.log('Loading fonts directly from URLs');
      
      // Direct URLs to the font files
      const fontUrls = {
        'tahoma.ttf': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//tahoma.ttf',
        'tahomabd.ttf': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//tahomabd.ttf',
        'Segoe UI.ttf': 'https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/fonts//Segoe%20UI.ttf'
      };
      
      const standardFonts = Object.values(FONT_FILES);
      const newFontCache: FontCache = {};
      
      for (const fontFile of standardFonts) {
        try {
          // Get the corresponding URL for this font file
          const url = fontUrls[fontFile];
          
          if (!url) {
            console.warn(`No direct URL defined for font: ${fontFile}`);
            continue;
          }
          
          console.log(`Downloading font directly from URL: ${url}`);
          
          // Fetch the font file directly
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const buffer = await response.arrayBuffer();
          console.log(`Successfully loaded font: ${fontFile}`);
          
          // Store using the original font file name
          newFontCache[fontFile] = buffer;
        } catch (err) {
          console.error(`Error downloading font ${fontFile}:`, err);
        }
      }
      
      console.log('Loaded fonts:', Object.keys(newFontCache));
      setFontCache(newFontCache);
      
      // Get the list of font files we didn't find
      const missingFonts = standardFonts.filter(font => !newFontCache[font]);
      
      if (missingFonts.length > 0) {
        console.warn('Missing fonts:', missingFonts);
        
        if (Object.keys(newFontCache).length > 0) {
          // Some fonts loaded but not all
          setFontsLoaded(true);
          toast.warning(`Some fonts could not be loaded: ${missingFonts.join(', ')}. Certificate generation may be affected.`);
        } else {
          // No fonts loaded at all
          setFontsLoaded(false);
          toast.error('Failed to load any required fonts. Please check the font URLs.');
        }
      } else {
        // All fonts loaded successfully
        setFontsLoaded(true);
        console.log('All required fonts loaded successfully');
      }
    } catch (error) {
      console.error('Error in font loading process:', error);
      toast.error(`Failed to load required fonts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFontsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { fontCache, fontsLoaded, isLoading, reloadFonts: loadFonts };
};
