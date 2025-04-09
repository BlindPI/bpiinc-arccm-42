
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
      // Try to load from each potential bucket location
      const buckets = ['certificate-fonts', 'certificate-template'];
      const fontPaths = ['fonts', ''];
      const standardFonts = Object.values(FONT_FILES);
      
      const newFontCache: FontCache = {};
      let loadedAny = false;

      // Try different combinations of buckets and paths
      for (const bucket of buckets) {
        for (const path of fontPaths) {
          const fontPromises = standardFonts.map(async (fontName) => {
            try {
              const fontPath = path ? `${path}/${fontName}` : fontName;
              console.log(`Attempting to load font from ${bucket}/${fontPath}`);
              
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(fontPath);
              
              if (error) {
                console.warn(`Could not load font ${fontName} from ${bucket}/${fontPath}:`, error);
                return null;
              }
              
              if (data) {
                const buffer = await data.arrayBuffer();
                console.log(`Successfully loaded font: ${fontName} from ${bucket}/${fontPath}`);
                loadedAny = true;
                return { fontName, buffer };
              }
            } catch (err) {
              console.warn(`Error loading font ${fontName} from ${bucket}:`, err);
            }
            
            return null;
          });
          
          const loadedFonts = await Promise.all(fontPromises);
          
          loadedFonts.forEach((font) => {
            if (font && font.buffer) {
              newFontCache[font.fontName] = font.buffer;
            }
          });
          
          // If we loaded fonts from this bucket/path, no need to try others
          if (Object.keys(newFontCache).length > 0) {
            break;
          }
        }
        
        // If we loaded fonts from this bucket, no need to try others
        if (Object.keys(newFontCache).length > 0) {
          break;
        }
      }

      // If no fonts were loaded, create mock font entries to prevent errors
      if (Object.keys(newFontCache).length === 0) {
        console.warn('No fonts were loaded from storage, using standard PDF fonts as fallbacks');
        // We'll handle this in the PDF generation with fallbacks
      } else {
        console.log('Loaded fonts:', Object.keys(newFontCache));
      }
      
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
