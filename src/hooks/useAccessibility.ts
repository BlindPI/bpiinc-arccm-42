
import { useEffect, useCallback } from 'react';

interface AccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  announceChanges?: boolean;
  focusManagement?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    enableKeyboardNavigation = true,
    announceChanges = true,
    focusManagement = true
  } = options;

  // Announce changes to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [announceChanges]);

  // Focus management
  const manageFocus = useCallback((selector: string) => {
    if (!focusManagement) return;

    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, [focusManagement]);

  // Skip to main content
  const skipToMain = useCallback(() => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation improvements
      if (event.key === 'Tab') {
        // Add visible focus indicators
        document.body.classList.add('keyboard-navigation');
      }
      
      // Arrow key navigation for lists and grids
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const activeElement = document.activeElement;
        if (activeElement?.getAttribute('role') === 'gridcell' || 
            activeElement?.getAttribute('role') === 'listitem') {
          event.preventDefault();
          // Handle arrow navigation logic here
        }
      }

      // Escape key to close modals/dialogs
      if (event.key === 'Escape') {
        const openDialog = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (openDialog) {
          const closeButton = openDialog.querySelector('[aria-label="Close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    const handleMouseDown = () => {
      // Remove keyboard navigation class when using mouse
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enableKeyboardNavigation]);

  return {
    announceToScreenReader,
    manageFocus,
    skipToMain
  };
}

// Hook for screen reader announcements
export function useScreenReaderAnnouncements() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announce };
}

// Hook for focus management
export function useFocusManagement() {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { focusElement, trapFocus };
}
