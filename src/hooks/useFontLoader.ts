
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export const useFontLoader = () => {
  const [fontCache, setFontCache] = useState<Record<string, ArrayBuffer>>({});

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      const fonts = ['Tahoma.ttf', 'TahomaBold.ttf', 'SegoeUI.ttf'];
      const loadedFonts: Record<string, ArrayBuffer> = {};

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
      console.log('Fonts loaded successfully:', Object.keys(loadedFonts));
    } catch (error) {
      console.error('Error loading fonts:', error);
      toast.error('Failed to load required fonts');
    }
  };

  return { fontCache };
};
