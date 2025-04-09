
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
      const standardFonts = ['Arial.ttf', 'ArialBold.ttf', 'Tahoma.ttf', 'TahomaBold.ttf', 'SegoeUI.ttf'];
      const fontPromises = standardFonts.map(async (fontName) => {
        try {
          // First, try to load from Supabase storage
          const { data, error } = await supabase.storage
            .from('certificate-template')
            .download(`fonts/${fontName}`);
          
          if (error) {
            console.warn(`Could not load font ${fontName} from storage:`, error);
            return null;
          }
          
          if (data) {
            const buffer = await data.arrayBuffer();
            return { fontName, buffer };
          }
        } catch (err) {
          console.warn(`Error loading font ${fontName}:`, err);
        }
        
        return null;
      });
      
      const loadedFonts = await Promise.all(fontPromises);
      const newFontCache: FontCache = {};
      
      loadedFonts.forEach((font) => {
        if (font && font.buffer) {
          newFontCache[font.fontName] = font.buffer;
        }
      });

      // If no fonts were loaded, create mock font entries to prevent errors
      if (Object.keys(newFontCache).length === 0) {
        console.warn('No fonts were loaded from storage, using standard PDF fonts as fallbacks');
        // We'll handle this in the PDF generation with fallbacks
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
