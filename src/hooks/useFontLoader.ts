
import { useState } from 'react';

export interface FontCache {
  [key: string]: ArrayBuffer;  // Changed from boolean to ArrayBuffer to match what's expected
}

export function useFontLoader() {
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
  const [isFontLoading, setIsFontLoading] = useState<boolean>(false);
  const [fontCache, setFontCache] = useState<FontCache>({});
  
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
      
      const fontPromises = fontFaces.map(async font => {
        const loadedFont = await font.load();
        document.fonts.add(loadedFont);
        
        // Fetch the font file as ArrayBuffer
        const response = await fetch(loadedFont.family === 'Certificate' ? 
                                     '/fonts/certificate.woff2' : 
                                     '/fonts/certificate-bold.woff2');
        const fontBuffer = await response.arrayBuffer();
        
        return {
          family: loadedFont.family,
          buffer: fontBuffer
        };
      });
      
      const loadedFonts = await Promise.all(fontPromises);
      
      const newCache = { ...fontCache };
      loadedFonts.forEach(font => {
        newCache[font.family] = font.buffer;
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
