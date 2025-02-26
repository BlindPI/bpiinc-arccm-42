
import { useState } from 'react';
import { toast } from 'sonner';

export type FontCache = Record<string, ArrayBuffer>;

export const useFontLoader = () => {
  const [fontsLoaded, setFontsLoaded] = useState(true);
  const [fontCache] = useState<FontCache>({});

  return { fontCache, fontsLoaded };
};

