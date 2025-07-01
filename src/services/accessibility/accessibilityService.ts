
export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  focusIndicators: 'default' | 'enhanced' | 'high-contrast';
  colorBlindSupport: boolean;
}

export class AccessibilityService {
  private static settings: AccessibilitySettings = {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
    keyboardNavigation: true,
    screenReaderOptimized: false,
    focusIndicators: 'default',
    colorBlindSupport: false
  };

  static init() {
    // Load settings from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }

    // Detect user preferences
    this.detectUserPreferences();
    
    // Apply settings
    this.applySettings();
    
    // Listen for changes
    this.setupEventListeners();
  }

  private static detectUserPreferences() {
    if (typeof window === 'undefined') return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.settings.reduceMotion = true;
    }

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast) {
      this.settings.highContrast = true;
    }

    // Detect color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }

  private static setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.updateSetting('reduceMotion', e.matches);
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.updateSetting('highContrast', e.matches);
    });

    // Keyboard navigation detection
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  static updateSetting<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) {
    this.settings[key] = value;
    this.applySettings();
    this.saveSettings();
  }

  static getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  private static applySettings() {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Apply reduced motion
    if (this.settings.reduceMotion) {
      root.style.setProperty('--transition-duration', '0s');
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--transition-duration');
      root.style.removeProperty('--animation-duration');
    }

    // Apply high contrast
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[this.settings.fontSize]);

    // Apply focus indicators
    document.body.classList.remove('focus-default', 'focus-enhanced', 'focus-high-contrast');
    document.body.classList.add(`focus-${this.settings.focusIndicators}`);

    // Apply color blind support
    if (this.settings.colorBlindSupport) {
      document.body.classList.add('color-blind-support');
    } else {
      document.body.classList.remove('color-blind-support');
    }

    // Screen reader optimization
    if (this.settings.screenReaderOptimized) {
      document.body.classList.add('screen-reader-optimized');
    } else {
      document.body.classList.remove('screen-reader-optimized');
    }
  }

  private static saveSettings() {
    localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
  }

  static announceToScreenReader(message: string) {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    return skipLink;
  }

  static setupKeyboardShortcuts() {
    if (typeof document === 'undefined') return;

    const shortcuts = {
      'Alt+M': () => this.toggleSetting('reduceMotion'),
      'Alt+C': () => this.toggleSetting('highContrast'),
      'Alt+S': () => this.cycleFontSize(),
      'Alt+F': () => this.cycleFocusIndicators(),
      'Alt+/': () => this.showKeyboardShortcuts()
    };

    document.addEventListener('keydown', (e) => {
      const key = `${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
      
      if (shortcuts[key as keyof typeof shortcuts]) {
        e.preventDefault();
        shortcuts[key as keyof typeof shortcuts]();
      }
    });
  }

  private static toggleSetting(key: keyof AccessibilitySettings) {
    if (typeof this.settings[key] === 'boolean') {
      this.updateSetting(key, !this.settings[key] as any);
    }
  }

  private static cycleFontSize() {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'xl'];
    const currentIndex = sizes.indexOf(this.settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    this.updateSetting('fontSize', sizes[nextIndex]);
  }

  private static cycleFocusIndicators() {
    const indicators: AccessibilitySettings['focusIndicators'][] = ['default', 'enhanced', 'high-contrast'];
    const currentIndex = indicators.indexOf(this.settings.focusIndicators);
    const nextIndex = (currentIndex + 1) % indicators.length;
    this.updateSetting('focusIndicators', indicators[nextIndex]);
  }

  private static showKeyboardShortcuts() {
    this.announceToScreenReader(`
      Keyboard shortcuts available:
      Alt+M: Toggle reduced motion
      Alt+C: Toggle high contrast
      Alt+S: Cycle font size
      Alt+F: Cycle focus indicators
      Alt+/: Show this help
    `);
  }
}

// Initialize accessibility service
if (typeof window !== 'undefined') {
  AccessibilityService.init();
  AccessibilityService.setupKeyboardShortcuts();
}
