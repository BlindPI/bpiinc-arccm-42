// File: src/contexts/DashboardUIContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';

interface UIConfig {
  theme_color: string;
  icon: string;
  dashboard_layout: 'grid' | 'list' | 'kanban' | 'timeline';
  welcome_message?: string;
  progress_visualization?: string;
  quick_actions?: string[];
}

interface DashboardUIContextType {
  config: UIConfig;
  themeColor: string;
  icon: string;
  layout: 'grid' | 'list' | 'kanban' | 'timeline';
  welcomeMessage: string;
  progressVisualization: string;
  quickActions: string[];
}

const DashboardUIContext = createContext<DashboardUIContextType | undefined>(undefined);

interface DashboardUIProviderProps {
  config: UIConfig;
  children: ReactNode;
}

export function DashboardUIProvider({ config, children }: DashboardUIProviderProps) {
  const value: DashboardUIContextType = {
    config,
    themeColor: config.theme_color,
    icon: config.icon,
    layout: config.dashboard_layout,
    welcomeMessage: config.welcome_message || 'Welcome to your dashboard',
    progressVisualization: config.progress_visualization || 'circular',
    quickActions: config.quick_actions || []
  };
  
  return (
    <DashboardUIContext.Provider value={value}>
      <div 
        className="dashboard-ui-context"
        style={{ 
          '--theme-color': config.theme_color,
          '--theme-layout': config.dashboard_layout 
        } as React.CSSProperties}
      >
        {children}
      </div>
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUIContext() {
  const context = useContext(DashboardUIContext);
  if (context === undefined) {
    throw new Error('useDashboardUIContext must be used within a DashboardUIProvider');
  }
  return context;
}