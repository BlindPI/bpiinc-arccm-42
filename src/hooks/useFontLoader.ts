
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
      // In a real system, we would download fonts from the certificate-template bucket
      setFontsLoaded(true);
    } catch (error) {
      console.error('Error loading fonts:', error);
      toast.error('Failed to load required fonts');
      setFontsLoaded(false);
    }
  };

  return { fontCache, fontsLoaded };
};
