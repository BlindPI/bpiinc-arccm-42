
import { useState } from 'react';

export interface FontCache {
  [key: string]: boolean;
}

export function useFontLoader() {
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
  const [isFontLoading, setIsFontLoading] = useState<boolean>(false);
  const [fontCache, setFontCache] = useState<FontCache>({});
  
  // Add missing loadFonts function
  const loadFonts = async () => {
    if (fontsLoaded) return;
    
    setIsFontLoading(true);
    try {
      // Load required fonts (adjust based on your specific fonts)
      const fontFaces = [
        new FontFace('Certificate', 'url(/fonts/certificate.woff2)', { 
          style: 'normal', 
          weight: '400'
        }),
        new FontFace('Certificate-Bold', 'url(/fonts/certificate-bold.woff2)', { 
          style: 'normal', 
          weight: '700'
        }),
      ];
      
      const loadedFonts = await Promise.all(
        fontFaces.map(font => font.load().then(loadedFont => {
          document.fonts.add(loadedFont);
          return loadedFont.family;
        }))
      );
      
      const newCache = { ...fontCache };
      loadedFonts.forEach(font => {
        newCache[font] = true;
      });
      
      setFontCache(newCache);
      setFontsLoaded(true);
      console.log('Certificate fonts loaded successfully');
    } catch (error) {
      console.error('Error loading fonts:', error);
    } finally {
      setIsFontLoading(false);
    }
  };
  
  const reloadFonts = async () => {
    setFontsLoaded(false);
    await loadFonts();
  };
  
  return {
    fontCache,
    fontsLoaded,
    isFontLoading,
    loadFonts,
    reloadFonts
  };
}
