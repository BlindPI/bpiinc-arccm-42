
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
      // Try to load from the fonts bucket first
      const primaryBucket = 'fonts';
      // Fallback buckets
      const fallbackBuckets = ['certificate-fonts', 'certificate-template'];
      
      const standardFonts = Object.values(FONT_FILES);
      
      const newFontCache: FontCache = {};
      let loadedAny = false;

      // Try primary bucket first
      console.log(`Attempting to load fonts from primary bucket: ${primaryBucket}`);
      
      const primaryFontPromises = standardFonts.map(async (fontName) => {
        try {
          console.log(`Attempting to load font from ${primaryBucket}/${fontName}`);
          
          const { data, error } = await supabase.storage
            .from(primaryBucket)
            .download(fontName);
          
          if (error) {
            console.warn(`Could not load font ${fontName} from ${primaryBucket}:`, error);
            return null;
          }
          
          if (data) {
            const buffer = await data.arrayBuffer();
            console.log(`Successfully loaded font: ${fontName} from ${primaryBucket}`);
            loadedAny = true;
            return { fontName, buffer };
          }
        } catch (err) {
          console.warn(`Error loading font ${fontName} from ${primaryBucket}:`, err);
        }
        
        return null;
      });
      
      const primaryFonts = await Promise.all(primaryFontPromises);
      
      primaryFonts.forEach((font) => {
        if (font && font.buffer) {
          newFontCache[font.fontName] = font.buffer;
        }
      });
      
      // If primary bucket didn't work, try fallbacks
      if (Object.keys(newFontCache).length === 0) {
        console.log('Primary bucket did not have fonts, trying fallbacks');
        
        // Try different fallback buckets
        for (const bucket of fallbackBuckets) {
          console.log(`Attempting to load fonts from fallback bucket: ${bucket}`);
          
          // Try direct path first
          const directPromises = standardFonts.map(async (fontName) => {
            try {
              console.log(`Attempting to load font from ${bucket}/${fontName}`);
              
              const { data, error } = await supabase.storage
                .from(bucket)
                .download(fontName);
              
              if (error) {
                console.warn(`Could not load font ${fontName} from ${bucket}:`, error);
                return null;
              }
              
              if (data) {
                const buffer = await data.arrayBuffer();
                console.log(`Successfully loaded font: ${fontName} from ${bucket}`);
                loadedAny = true;
                return { fontName, buffer };
              }
            } catch (err) {
              console.warn(`Error loading font ${fontName} from ${bucket}:`, err);
            }
            
            return null;
          });
          
          const directFonts = await Promise.all(directPromises);
          
          directFonts.forEach((font) => {
            if (font && font.buffer) {
              newFontCache[font.fontName] = font.buffer;
            }
          });
          
          // If direct path worked, no need to try the fonts/ subdirectory
          if (Object.keys(newFontCache).length > 0) {
            break;
          }
          
          // Try in fonts/ subdirectory
          const subDirPromises = standardFonts.map(async (fontName) => {
            try {
              const fontPath = `fonts/${fontName}`;
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
              console.warn(`Error loading font ${fontName} from ${bucket}/fonts:`, err);
            }
            
            return null;
          });
          
          const subDirFonts = await Promise.all(subDirPromises);
          
          subDirFonts.forEach((font) => {
            if (font && font.buffer) {
              newFontCache[font.fontName] = font.buffer;
            }
          });
          
          // If we loaded fonts from this bucket/path, no need to try others
          if (Object.keys(newFontCache).length > 0) {
            break;
          }
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
