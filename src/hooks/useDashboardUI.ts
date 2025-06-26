// File: src/hooks/useDashboardUI.ts

import { useContext } from 'react';
import { useDashboardUIContext } from '@/contexts/DashboardUIContext';
import { useComplianceTierContext } from '@/contexts/ComplianceTierContext';

/**
 * Color type definitions for the dashboard UI
 */
export type ThemeColorKey = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'background' 
  | 'card' 
  | 'border' 
  | 'text';

/**
 * Layout option definitions for the dashboard UI
 */
export type LayoutOption = 'grid' | 'list' | 'kanban' | 'timeline';

/**
 * useDashboardUI hook provides extended functionality for working with dashboard UI.
 * It combines the base DashboardUIContext with tier-specific UI adjustments and
 * adds helper methods for working with colors, layouts, and UI features.
 * 
 * This hook is tier-aware and will adjust UI elements based on the user's compliance tier.
 */
export function useDashboardUI() {
  // Use the base UI context
  const uiContext = useDashboardUIContext();
  const tierContext = useComplianceTierContext();
  
  /**
   * Color map for basic and robust tiers
   * These color palettes are designed to visually differentiate the tiers
   */
  const colorMap: Record<string, Record<ThemeColorKey, string>> = {
    basic: {
      primary: '#3B82F6', // Blue
      secondary: '#6B7280', // Gray
      accent: '#10B981', // Green
      background: '#F9FAFB',
      card: '#FFFFFF',
      border: '#E5E7EB',
      text: '#1F2937'
    },
    robust: {
      primary: '#8B5CF6', // Purple
      secondary: '#6B7280', // Gray
      accent: '#F59E0B', // Amber
      background: '#F9FAFB',
      card: '#FFFFFF',
      border: '#E5E7EB',
      text: '#1F2937'
    }
  };
  
  /**
   * Feature flags for each tier
   * These define which UI features are available in each tier
   */
  const tierFeatures: Record<string, Record<string, boolean>> = {
    basic: {
      advancedCharts: false,
      bulkOperations: false,
      exportData: true,
      customReports: false,
      aiInsights: false
    },
    robust: {
      advancedCharts: true,
      bulkOperations: true,
      exportData: true,
      customReports: true,
      aiInsights: true
    }
  };
  
  /**
   * Get the appropriate theme color based on the current tier
   * @param key - The color key to retrieve
   * @param fallback - Optional fallback color if the key is not found
   * @returns The CSS color value
   */
  const getThemeColor = (key: ThemeColorKey, fallback?: string): string => {
    const tier = tierContext?.tier || 'basic';
    const tierColors = colorMap[tier];
    return tierColors[key] || fallback || uiContext.themeColor;
  };
  
  /**
   * Check if a feature is available in the current tier
   * @param featureName - The name of the feature to check
   * @returns Boolean indicating if the feature is available
   */
  const hasFeature = (featureName: string): boolean => {
    const tier = tierContext?.tier || 'basic';
    const features = tierFeatures[tier];
    return features?.[featureName] || false;
  };
  
  /**
   * Get the CSS class for the current dashboard layout
   * @param baseClass - The base class name to extend
   * @returns CSS class string for the layout
   */
  const getLayoutClass = (baseClass: string = ''): string => {
    const layout = uiContext.layout;
    const layoutClasses: Record<LayoutOption, string> = {
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      list: 'flex flex-col space-y-4',
      kanban: 'grid grid-cols-1 md:grid-cols-3 gap-4',
      timeline: 'flex flex-col space-y-8'
    };
    
    return `${baseClass} ${layoutClasses[layout]}`.trim();
  };
  
  /**
   * Get tier-specific CSS classes for components
   * @param componentType - The type of component
   * @returns CSS class string for the component
   */
  const getTierClasses = (componentType: 'card' | 'header' | 'button' | 'text'): string => {
    const tier = tierContext?.tier || 'basic';
    
    const tierClasses: Record<string, Record<string, string>> = {
      basic: {
        card: 'border border-gray-200 rounded-md',
        header: 'text-blue-600 font-medium',
        button: 'bg-blue-500 hover:bg-blue-600 text-white',
        text: 'text-gray-800'
      },
      robust: {
        card: 'border border-purple-100 rounded-lg shadow-sm',
        header: 'text-purple-600 font-semibold',
        button: 'bg-purple-500 hover:bg-purple-600 text-white',
        text: 'text-gray-900'
      }
    };
    
    return tierClasses[tier][componentType] || '';
  };
  
  /**
   * Get an icon component based on the current theme
   * @param iconName - The name of the icon to retrieve
   * @returns The icon component or string
   */
  const getIcon = (iconName: string): string => {
    // In a real implementation, this would return actual icons
    // This is simplified for demonstration purposes
    return iconName || uiContext.icon;
  };
  
  /**
   * Format text based on tier-specific styles
   * @param text - The text to format
   * @param type - The type of text formatting to apply
   * @returns Formatted text string
   */
  const formatText = (text: string, type: 'header' | 'title' | 'body'): string => {
    // This would apply tier-specific text formatting
    // Simplified for demonstration
    return text;
  };
  
  /**
   * Get dashboard welcome message with tier-specific content
   * @returns Welcome message string
   */
  const getWelcomeMessage = (): string => {
    const tier = tierContext?.tier || 'basic';
    const tierName = tierContext?.tierConfig?.name || (tier === 'basic' ? 'Essential Tier' : 'Comprehensive Tier');
    
    if (tier === 'basic') {
      return `Welcome to your ${tierName} dashboard. Complete your essential compliance requirements to maintain certification.`;
    } else {
      return `Welcome to your ${tierName} dashboard. Access advanced features and comprehensive compliance tools.`;
    }
  };
  
  // Return all the UI helper functions and values
  return {
    ...uiContext,
    getThemeColor,
    hasFeature,
    getLayoutClass,
    getTierClasses,
    getIcon,
    formatText,
    getWelcomeMessage,
    tierName: tierContext?.tierConfig?.name,
    tierFeatures: tierFeatures[tierContext?.tier || 'basic'],
    isBasicTier: tierContext?.isBasic || false,
    isRobustTier: tierContext?.isRobust || false
  };
}