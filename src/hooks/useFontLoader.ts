
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
      // Use the correct bucket name from constants
      const fontBucket = STORAGE_BUCKETS.fonts;
      const standardFonts = Object.values(FONT_FILES);
      
      console.log(`Loading fonts from ${fontBucket} bucket`, { standardFonts });
      
      const newFontCache: FontCache = {};
      
      // First, list files to check if fonts are actually in the bucket
      const { data: fileList, error: listError } = await supabase.storage
        .from(fontBucket)
        .list();
        
      if (listError) {
        console.error(`Error listing files in bucket ${fontBucket}:`, listError);
        throw new Error(`Could not access font bucket: ${listError.message}`);
      }
      
      console.log(`Files in ${fontBucket} bucket:`, fileList?.map(file => file.name));
      
      const fontPromises = standardFonts.map(async (fontName) => {
        try {
          console.log(`Attempting to load font: ${fontName} from ${fontBucket}`);
          
          // Check if the font exists in the bucket
          const fontExists = fileList?.some(file => file.name === fontName);
          if (!fontExists) {
            console.warn(`Font ${fontName} not found in bucket ${fontBucket}`);
            return null;
          }
          
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
      
      // Only set fontsLoaded to true if at least one font was loaded successfully
      if (Object.keys(newFontCache).length > 0) {
        setFontsLoaded(true);
      } else {
        setFontsLoaded(false);
        if (fileList && fileList.length === 0) {
          toast.error('No fonts found in storage. Please upload the required fonts through the Templates section.');
        } else {
          toast.error('Failed to load required fonts for certificates. Please check permissions and try again.');
        }
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
