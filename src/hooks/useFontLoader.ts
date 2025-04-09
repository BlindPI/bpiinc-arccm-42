
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FONT_FILES, STORAGE_BUCKETS } from '@/types/certificate';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('Loading fonts from Supabase Storage');
      
      const standardFonts = Object.values(FONT_FILES);
      const newFontCache: FontCache = {};
      
      for (const fontFile of standardFonts) {
        try {
          console.log(`Attempting to download font: ${fontFile}`);
          
          // Use Supabase Storage to get the font file
          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKETS.fonts)
            .download(fontFile);
          
          if (error) {
            console.error(`Error downloading font ${fontFile}:`, error);
            // Try using direct URL as fallback
            const { data: publicUrlData } = supabase.storage
              .from(STORAGE_BUCKETS.fonts)
              .getPublicUrl(fontFile);

            if (publicUrlData && publicUrlData.publicUrl) {
              console.log(`Trying fallback with direct URL: ${publicUrlData.publicUrl}`);
              const response = await fetch(publicUrlData.publicUrl);
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const buffer = await response.arrayBuffer();
              console.log(`Successfully loaded font: ${fontFile} via direct URL`);
              newFontCache[fontFile] = buffer;
            } else {
              throw new Error('Failed to get public URL');
            }
          } else if (data) {
            // Convert blob to ArrayBuffer
            const buffer = await data.arrayBuffer();
            console.log(`Successfully loaded font: ${fontFile} from Storage API`);
            newFontCache[fontFile] = buffer;
          }
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
          toast.error('Failed to load any required fonts. Please upload fonts in the Templates tab.');
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
