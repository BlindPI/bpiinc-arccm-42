
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Palette, 
  Volume2, 
  MousePointer, 
  Keyboard, 
  Zap,
  Activity,
  Settings,
  Monitor
} from 'lucide-react';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
  keyboardNavigation: boolean;
}

export const AccessibilityPanel: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    focusIndicators: false,
    colorBlindSupport: false,
    keyboardNavigation: false,
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage and apply to document
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--base-font-size', `${newSettings.fontSize}px`);
    
    // High contrast
    if (newSettings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (newSettings.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
    
    // Screen reader optimization
    if (newSettings.screenReaderOptimized) {
      document.body.classList.add('screen-reader-optimized');
    } else {
      document.body.classList.remove('screen-reader-optimized');
    }
    
    // Focus indicators
    if (newSettings.focusIndicators) {
      document.body.classList.add('focus-enhanced');
    } else {
      document.body.classList.remove('focus-enhanced');
    }
    
    // Color blind support
    if (newSettings.colorBlindSupport) {
      document.body.classList.add('color-blind-support');
    } else {
      document.body.classList.remove('color-blind-support');
    }
    
    // Keyboard navigation
    if (newSettings.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  };

  const resetToDefaults = () => {
    setSettings({
      fontSize: 16,
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      focusIndicators: false,
      colorBlindSupport: false,
      keyboardNavigation: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accessibility Settings</h2>
          <p className="text-muted-foreground">
            Customize your experience for better accessibility
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Settings
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visual Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {settings.fontSize}px</Label>
              <Slider
                id="font-size"
                min={12}
                max={24}
                step={1}
                value={[settings.fontSize]}
                onValueChange={(value) => setSettings({...settings, fontSize: value[0]})}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => setSettings({...settings, highContrast: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="color-blind">Color Blind Support</Label>
              <Switch
                id="color-blind"
                checked={settings.colorBlindSupport}
                onCheckedChange={(checked) => setSettings({...settings, colorBlindSupport: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Motion Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Motion & Animation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => setSettings({...settings, reducedMotion: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="focus-indicators">Enhanced Focus Indicators</Label>
              <Switch
                id="focus-indicators"
                checked={settings.focusIndicators}
                onCheckedChange={(checked) => setSettings({...settings, focusIndicators: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => setSettings({...settings, keyboardNavigation: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Screen Reader Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Screen Reader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderOptimized}
                onCheckedChange={(checked) => setSettings({...settings, screenReaderOptimized: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          onClick={resetToDefaults}
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};
