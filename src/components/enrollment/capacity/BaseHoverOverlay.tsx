import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { 
  BaseHoverOverlayProps, 
  HoverOverlayState, 
  OverlayPositionConfig,
  OverlayA11yProps
} from './HoverOverlayTypes';

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

const generateId = (prefix: string = 'overlay') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

const useA11yAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);
  
  return announce;
};

// ============================================================================
// POSITION CALCULATION UTILITIES
// ============================================================================

interface PositionResult {
  x: number;
  y: number;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const calculatePosition = (
  triggerRect: DOMRect,
  overlayRect: { width: number; height: number },
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'auto',
  offset: number = 8,
  boundary?: HTMLElement
): PositionResult => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };
  
  const boundaryRect = boundary?.getBoundingClientRect() || {
    top: 0,
    left: 0,
    right: viewport.width,
    bottom: viewport.height
  };
  
  // Calculate available space in each direction
  const spaces = {
    top: triggerRect.top - boundaryRect.top,
    bottom: boundaryRect.bottom - triggerRect.bottom,
    left: triggerRect.left - boundaryRect.left,
    right: boundaryRect.right - triggerRect.right
  };
  
  // Determine best position if auto
  let finalPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  if (preferredPosition === 'auto') {
    const spaceNeeded = {
      top: overlayRect.height + offset,
      bottom: overlayRect.height + offset,
      left: overlayRect.width + offset,
      right: overlayRect.width + offset
    };
    
    // Find position with most space that fits
    if (spaces.bottom >= spaceNeeded.bottom) {
      finalPosition = 'bottom';
    } else if (spaces.top >= spaceNeeded.top) {
      finalPosition = 'top';
    } else if (spaces.right >= spaceNeeded.right) {
      finalPosition = 'right';
    } else if (spaces.left >= spaceNeeded.left) {
      finalPosition = 'left';
    } else {
      // Default to bottom if nothing fits
      finalPosition = 'bottom';
    }
  } else {
    finalPosition = preferredPosition;
  }
  
  let x = 0;
  let y = 0;
  
  switch (finalPosition) {
    case 'top':
      x = triggerRect.left + (triggerRect.width / 2) - (overlayRect.width / 2);
      y = triggerRect.top - overlayRect.height - offset;
      break;
    case 'bottom':
      x = triggerRect.left + (triggerRect.width / 2) - (overlayRect.width / 2);
      y = triggerRect.bottom + offset;
      break;
    case 'left':
      x = triggerRect.left - overlayRect.width - offset;
      y = triggerRect.top + (triggerRect.height / 2) - (overlayRect.height / 2);
      break;
    case 'right':
      x = triggerRect.right + offset;
      y = triggerRect.top + (triggerRect.height / 2) - (overlayRect.height / 2);
      break;
  }
  
  // Adjust to stay within viewport bounds
  x = Math.max(boundaryRect.left, Math.min(x, boundaryRect.right - overlayRect.width));
  y = Math.max(boundaryRect.top, Math.min(y, boundaryRect.bottom - overlayRect.height));
  
  // Add scroll offset
  x += viewport.scrollX;
  y += viewport.scrollY;
  
  return { x, y, position: finalPosition };
};

// ============================================================================
// MOBILE DETECTION
// ============================================================================

const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);
  
  return isMobile;
};

// ============================================================================
// BASE HOVER OVERLAY COMPONENT
// ============================================================================

export interface BaseHoverOverlayRef {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  updatePosition: () => void;
}

export const BaseHoverOverlay = forwardRef<BaseHoverOverlayRef, BaseHoverOverlayProps>(({
  trigger,
  children,
  position = 'auto',
  showDelay = 500,
  hideDelay = 200,
  disabled = false,
  className,
  overlayClassName,
  zIndex = 1000,
  showOnFocus = true,
  keepOpenOnHover = true,
  maxWidth = 400,
  id: providedId,
  ariaLabel,
  onShow,
  onHide
}, ref) => {
  // ============================================================================
  // STATE AND REFS
  // ============================================================================
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState<PositionResult>({ x: 0, y: 0, position: 'bottom' });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const isHoveringTrigger = useRef(false);
  const isHoveringOverlay = useRef(false);
  
  const overlayId = useMemo(() => providedId || generateId('hover-overlay'), [providedId]);
  const descriptionId = useMemo(() => `${overlayId}-description`, [overlayId]);
  
  const announce = useA11yAnnouncement();
  const isMobile = useIsMobile();
  
  // ============================================================================
  // POSITION CALCULATION
  // ============================================================================
  
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !overlayRef.current || !isVisible) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const overlayRect = overlayRef.current.getBoundingClientRect();
    
    const newPosition = calculatePosition(
      triggerRect,
      { width: overlayRect.width || maxWidth, height: overlayRect.height || 200 },
      position,
      8
    );
    
    setOverlayPosition(newPosition);
  }, [isVisible, position, maxWidth]);
  
  // ============================================================================
  // SHOW/HIDE LOGIC
  // ============================================================================
  
  const showOverlay = useCallback(() => {
    if (disabled || isVisible) return;
    
    clearTimeout(hideTimeoutRef.current);
    
    const doShow = () => {
      setIsVisible(true);
      setIsAnimating(true);
      onShow?.();
      
      if (ariaLabel) {
        announce(`Showing ${ariaLabel}`, 'polite');
      }
      
      // End animation after CSS transition
      setTimeout(() => setIsAnimating(false), 200);
    };
    
    if (showDelay > 0) {
      showTimeoutRef.current = setTimeout(doShow, showDelay);
    } else {
      doShow();
    }
  }, [disabled, isVisible, showDelay, onShow, ariaLabel, announce]);
  
  const hideOverlay = useCallback(() => {
    if (!isVisible) return;
    
    clearTimeout(showTimeoutRef.current);
    
    const doHide = () => {
      setIsAnimating(true);
      
      // Hide after animation
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        onHide?.();
        
        if (ariaLabel) {
          announce(`Hiding ${ariaLabel}`, 'polite');
        }
      }, 200);
    };
    
    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(doHide, hideDelay);
    } else {
      doHide();
    }
  }, [isVisible, hideDelay, onHide, ariaLabel, announce]);
  
  const checkShouldHide = useCallback(() => {
    if (!keepOpenOnHover) {
      hideOverlay();
      return;
    }
    
    // Don't hide if hovering trigger or overlay
    if (!isHoveringTrigger.current && !isHoveringOverlay.current) {
      hideOverlay();
    }
  }, [hideOverlay, keepOpenOnHover]);
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleTriggerMouseEnter = useCallback(() => {
    if (isMobile) return; // Disable hover on mobile
    isHoveringTrigger.current = true;
    showOverlay();
  }, [showOverlay, isMobile]);
  
  const handleTriggerMouseLeave = useCallback(() => {
    isHoveringTrigger.current = false;
    setTimeout(checkShouldHide, 50); // Small delay to allow moving to overlay
  }, [checkShouldHide]);
  
  const handleTriggerFocus = useCallback(() => {
    if (!showOnFocus) return;
    showOverlay();
  }, [showOnFocus, showOverlay]);
  
  const handleTriggerBlur = useCallback(() => {
    if (!showOnFocus) return;
    hideOverlay();
  }, [showOnFocus, hideOverlay]);
  
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      hideOverlay();
      triggerRef.current?.focus();
    }
  }, [isVisible, hideOverlay]);
  
  const handleOverlayMouseEnter = useCallback(() => {
    if (!keepOpenOnHover) return;
    isHoveringOverlay.current = true;
  }, [keepOpenOnHover]);
  
  const handleOverlayMouseLeave = useCallback(() => {
    isHoveringOverlay.current = false;
    checkShouldHide();
  }, [checkShouldHide]);
  
  // ============================================================================
  // IMPERATIVE HANDLE
  // ============================================================================
  
  useImperativeHandle(ref, () => ({
    show: showOverlay,
    hide: hideOverlay,
    toggle: () => isVisible ? hideOverlay() : showOverlay(),
    updatePosition
  }), [showOverlay, hideOverlay, isVisible, updatePosition]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);
  
  // Update position on scroll/resize
  useEffect(() => {
    if (!isVisible) return;
    
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, updatePosition]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);
  
  // ============================================================================
  // PORTAL CONTENT
  // ============================================================================
  
  const overlayContent = isVisible && (
    <div
      ref={overlayRef}
      id={overlayId}
      role="tooltip"
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'absolute bg-white border border-gray-200 rounded-lg shadow-lg p-4',
        'transform transition-all duration-200 ease-out',
        'pointer-events-auto',
        // Animation states
        isAnimating && 'transition-all duration-200',
        // Visibility
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        // Mobile adjustments
        isMobile && 'max-w-[90vw] mx-4',
        // Custom classes
        overlayClassName
      )}
      style={{
        position: 'fixed',
        left: overlayPosition.x,
        top: overlayPosition.y,
        zIndex,
        maxWidth: isMobile ? '90vw' : maxWidth,
        // Ensure minimum contrast for accessibility
        backgroundColor: 'white',
        border: '1px solid #e5e7eb'
      }}
      onMouseEnter={handleOverlayMouseEnter}
      onMouseLeave={handleOverlayMouseLeave}
      // Accessibility attributes
      aria-describedby={descriptionId}
      tabIndex={-1}
    >
      {/* Position indicator arrow */}
      <div
        className={cn(
          'absolute w-2 h-2 bg-white border transform rotate-45',
          overlayPosition.position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r border-gray-200',
          overlayPosition.position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l border-gray-200',
          overlayPosition.position === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-b border-gray-200',
          overlayPosition.position === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-t border-gray-200'
        )}
      />
      
      {/* Content */}
      <div id={descriptionId}>
        {children}
      </div>
    </div>
  );
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <>
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        onFocus={handleTriggerFocus}
        onBlur={handleTriggerBlur}
        onKeyDown={handleTriggerKeyDown}
        aria-describedby={isVisible ? overlayId : undefined}
        tabIndex={showOnFocus ? 0 : undefined}
      >
        {trigger}
      </div>
      
      {/* Portal Overlay */}
      {typeof document !== 'undefined' && createPortal(
        overlayContent,
        document.body
      )}
    </>
  );
});

BaseHoverOverlay.displayName = 'BaseHoverOverlay';

// ============================================================================
// MOBILE-OPTIMIZED VARIANT
// ============================================================================

export interface MobileHoverOverlayProps extends Omit<BaseHoverOverlayProps, 'showDelay' | 'hideDelay'> {
  /** Show on touch instead of hover */
  showOnTouch?: boolean;
  /** Auto-hide after duration on mobile (ms) */
  autoHideDelay?: number;
}

export const MobileHoverOverlay = forwardRef<BaseHoverOverlayRef, MobileHoverOverlayProps>(({
  showOnTouch = true,
  autoHideDelay = 3000,
  showDelay = 500,
  hideDelay = 200,
  ...props
}, ref) => {
  const isMobile = useIsMobile();
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout>();
  
  const handleTouchStart = useCallback(() => {
    if (!isMobile || !showOnTouch) return;
    
    // Clear existing timeout
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
    
    // Auto-hide after delay
    if (autoHideDelay > 0) {
      const timeout = setTimeout(() => {
        // Hide logic would be handled by ref
      }, autoHideDelay);
      setTouchTimeout(timeout);
    }
  }, [isMobile, showOnTouch, autoHideDelay, touchTimeout]);
  
  useEffect(() => {
    return () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
    };
  }, [touchTimeout]);
  
  const enhancedTrigger = React.cloneElement(props.trigger as React.ReactElement, {
    onTouchStart: handleTouchStart
  });
  
  return (
    <BaseHoverOverlay
      ref={ref}
      {...props}
      trigger={enhancedTrigger}
      showDelay={isMobile ? 0 : showDelay}
      hideDelay={isMobile ? 0 : hideDelay}
    />
  );
});

MobileHoverOverlay.displayName = 'MobileHoverOverlay';