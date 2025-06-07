
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  priority: number;
}

export interface DashboardConfig {
  welcomeMessage: string;
  subtitle: string;
  widgets: DashboardWidgetConfig[];
}

export function useDashboardConfig() {
  const { user } = useAuth();

  const getDefaultConfig = (): DashboardConfig => {
    const profile = user?.profile;
    
    return {
      welcomeMessage: `Welcome back, ${profile?.display_name || 'User'}!`,
      subtitle: "Here's what's happening with your training management system.",
      widgets: [
        { id: 'stats', type: 'stats', title: 'Statistics', enabled: true, priority: 1 },
        { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', enabled: true, priority: 2 },
        { id: 'quick-actions', type: 'quick-actions', title: 'Quick Actions', enabled: true, priority: 3 }
      ]
    };
  };

  return {
    config: getDefaultConfig()
  };
}
