
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type FontCache = Record<string, ArrayBuffer>;

export const useFontLoader = () => {
  const [fontCache, setFontCache] = useState<FontCache>({});
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      // For now, we're using a minimal approach with locally cached fonts
      // In the future, we can implement loading fonts from the certificate-template bucket
      
      // Example of how we would load fonts from Supabase storage:
      // const { data, error } = await supabase.storage
      //   .from('certificate-template')
      //   .download('fonts/some-font.ttf');
      
      // if (error) throw error;
      // if (data) {
      //   const buffer = await data.arrayBuffer();
      //   setFontCache(prev => ({
      //     ...prev,
      //     'some-font': buffer
      //   }));
      // }
      
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
      toast.error('Failed to load required fonts');
      setFontsLoaded(false);
    }
  };

  return { fontCache, fontsLoaded };
};
