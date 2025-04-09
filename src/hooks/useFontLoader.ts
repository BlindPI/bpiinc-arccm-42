
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
      
      console.log(`Files found in ${fontBucket} bucket:`, fileList?.map(file => file.name));
      
      // For each standard font, try to find a case-insensitive match in the bucket
      for (const fontFile of standardFonts) {
        try {
          // Try to find a case-insensitive match in the file list
          const matchingFile = fileList?.find(file => 
            file.name.toLowerCase() === fontFile.toLowerCase() ||
            file.name.toLowerCase() === encodeURIComponent(fontFile).toLowerCase()
          );
          
          if (!matchingFile) {
            console.warn(`Font file not found (case-insensitive): ${fontFile}`);
            continue;
          }
          
          console.log(`Attempting to download font: ${matchingFile.name}`);
          
          const { data, error } = await supabase.storage
            .from(fontBucket)
            .download(matchingFile.name);
          
          if (error) {
            console.error(`Error downloading font ${matchingFile.name}:`, error);
            continue;
          }
          
          if (data) {
            const buffer = await data.arrayBuffer();
            console.log(`Successfully loaded font: ${matchingFile.name}`);
            
            // Store using the original font file name from FONT_FILES for consistency
            newFontCache[fontFile] = buffer;
          }
        } catch (err) {
          console.error(`Error processing font ${fontFile}:`, err);
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
          toast.error('Failed to load any required fonts. Please check the Templates section to upload fonts.');
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
