
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export const useFontLoader = () => {
  const [fontCache, setFontCache] = useState<Record<string, ArrayBuffer>>({});
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts();
  }, []);

  const verifyFontPath = async (fontName: string): Promise<boolean> => {
    const { data } = await supabase.storage
      .from('fonts')
      .getPublicUrl(fontName);
    
    try {
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error verifying font ${fontName}:`, error);
      return false;
    }
  };

  const loadFonts = async () => {
    try {
      const fonts = ['Tahoma.ttf', 'TahomaBold.ttf', 'SegoeUI.ttf'];
      const loadedFonts: Record<string, ArrayBuffer> = {};

      // First verify all font paths
      const fontAvailability = await Promise.all(
        fonts.map(font => verifyFontPath(font))
      );

      if (fontAvailability.some(available => !available)) {
        throw new Error('Some required fonts are not available in storage');
      }

      // Then load all fonts
      for (const fontName of fonts) {
        const { data, error } = await supabase.storage
          .from('fonts')
          .download(fontName);

        if (error) {
          console.error(`Error loading font ${fontName}:`, error);
          toast.error(`Failed to load font ${fontName}`);
          continue;
        }

        loadedFonts[fontName] = await data.arrayBuffer();
      }

      setFontCache(loadedFonts);
      setFontsLoaded(true);
      console.log('Fonts loaded successfully:', Object.keys(loadedFonts));
    } catch (error) {
      console.error('Error loading fonts:', error);
      toast.error('Failed to load required fonts');
      setFontsLoaded(false);
    }
  };

  return { fontCache, fontsLoaded };
};
