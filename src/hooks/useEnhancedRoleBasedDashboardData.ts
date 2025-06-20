
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useTeamMemberships } from './useTeamMemberships';
import { EnhancedAPDashboardService, type EnhancedAPMetrics } from '@/services/dashboard/enhancedAPDashboardService';
import { EnhancedTeamDashboardService, type EnhancedTeamMetrics } from '@/services/dashboard/enhancedTeamDashboardService';
import { DashboardDataService, type DashboardMetrics, type RecentActivity } from '@/services/dashboard/dashboardDataService';

export interface EnhancedRoleBasedDashboardData {
  metrics: DashboardMetrics | EnhancedAPMetrics | EnhancedTeamMetrics;
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  canViewSystemMetrics: boolean;
  canViewTeamMetrics: boolean;
  
  // Enhanced context
  dashboardType: 'system' | 'ap_enhanced' | 'team_enhanced' | 'instructor' | 'student';
  healthStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  
  teamContext?: {
    teamId: string;
    teamName: string;
    locationName: string;
    locationCity?: string;
    locationState?: string;
    locationAddress?: string;
    apUserName?: string;
    apUserEmail?: string;
    apUserPhone?: string;
  };
}

export function useEnhancedRoleBasedDashboardData(): EnhancedRoleBasedDashboardData {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: teamMemberships = [] } = useTeamMemberships();

  const userRole = profile?.role;
  const userId = user?.id;
  const primaryTeam = teamMemberships[0];

  console.log('🔍 useEnhancedRoleBasedDashboardData - Debug Info:', {
    userId,
    userRole,
    teamMemberships: teamMemberships.length,
    primaryTeam: primaryTeam ? {
      team_id: primaryTeam.team_id,
      role: primaryTeam.role
    } : 'None'
  });

  // Determine access levels and dashboard type
  const canViewSystemMetrics = userRole ? ['SA', 'AD'].includes(userRole) : false;
  const isAPUser = userRole === 'AP';
  const canViewTeamMetrics = (!!primaryTeam && !canViewSystemMetrics) || isAPUser;

  let dashboardType: 'system' | 'ap_enhanced' | 'team_enhanced' | 'instructor' | 'student';
  if (canViewSystemMetrics) {
    dashboardType = 'system';
  } else if (isAPUser) {
    dashboardType = 'ap_enhanced';
  } else if (canViewTeamMetrics && primaryTeam) {
    dashboardType = 'team_enhanced';
  } else if (['IC', 'IP', 'IT'].includes(userRole || '')) {
    dashboardType = 'instructor';
  } else {
    dashboardType = 'student';
  }

  // Get enhanced metrics based on dashboard type
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['enhanced-dashboard-metrics', userId, userRole, primaryTeam?.team_id, dashboardType],
    queryFn: async () => {
      if (!userId || !userRole) {
        throw new Error('User not authenticated');
      }

      switch (dashboardType) {
        case 'system':
          return DashboardDataService.getSystemAdminMetrics();
        
        case 'ap_enhanced':
          return EnhancedAPDashboardService.getEnhancedAPMetrics(userId);
        
        case 'team_enhanced':
          if (!primaryTeam) throw new Error('No team membership found');
          return EnhancedTeamDashboardService.getEnhancedTeamMetrics(primaryTeam.team_id, userId);
        
        case 'instructor':
          return DashboardDataService.getInstructorMetrics(userId);
        
        case 'student':
          return DashboardDataService.getStudentMetrics(userId);
        
        default:
          throw new Error(`Unknown dashboard type: ${dashboardType}`);
      }
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  });

  // Get recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['enhanced-dashboard-activities', userId, userRole, primaryTeam?.team_id, dashboardType],
    queryFn: async () => {
      if (!userId || !userRole) {
        return [];
      }

      return DashboardDataService.getRecentActivities(
        userId, 
        userRole, 
        canViewTeamMetrics && !isAPUser ? primaryTeam?.team_id : undefined
      );
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 10 * 60 * 1000 // Refetch every 10 minutes
  });

  // Extract health information and context
  const getHealthStatus = (): 'healthy' | 'warning' | 'critical' => {
    if (!metrics) return 'warning';
    
    if ('relationshipHealth' in metrics) {
      return metrics.relationshipHealth;
    }
    
    if ('assignmentStatus' in metrics) {
      switch (metrics.assignmentStatus) {
        case 'complete': return 'healthy';
        case 'partial': return 'warning';
        case 'missing':
        case 'conflict': return 'critical';
        default: return 'warning';
      }
    }
    
    return 'healthy';
  };

  const getIssues = (): string[] => {
    if (!metrics) return [];
    
    if ('issues' in metrics) {
      return metrics.issues || [];
    }
    
    return [];
  };

  const getRecommendations = (): string[] => {
    if (!metrics) return [];
    
    if ('recommendations' in metrics) {
      return metrics.recommendations || [];
    }
    
    return [];
  };

  const getTeamContext = () => {
    if (dashboardType === 'ap_enhanced' && metrics && 'locationName' in metrics) {
      return {
        teamId: 'ap-location',
        teamName: metrics.locationName || 'Location Dashboard',
        locationName: metrics.locationName || 'No Location',
        locationCity: metrics.locationCity,
        locationState: metrics.locationState,
        locationAddress: metrics.locationAddress,
        apUserName: metrics.apUserName,
        apUserEmail: metrics.apUserEmail,
        apUserPhone: metrics.apUserPhone
      };
    }
    
    if (dashboardType === 'team_enhanced' && metrics && 'teamName' in metrics) {
      return {
        teamId: metrics.teamId,
        teamName: metrics.teamName,
        locationName: metrics.locationName || 'No Location',
        locationCity: metrics.locationCity,
        locationState: metrics.locationState,
        apUserName: metrics.providerName,
        apUserEmail: '',
        apUserPhone: ''
      };
    }
    
    return undefined;
  };

  return {
    metrics: metrics || {},
    recentActivities: recentActivities || [],
    isLoading: metricsLoading || activitiesLoading,
    error: metricsError?.message || null,
    canViewSystemMetrics,
    canViewTeamMetrics: canViewTeamMetrics || isAPUser,
    
    // Enhanced properties
    dashboardType,
    healthStatus: getHealthStatus(),
    issues: getIssues(),
    recommendations: getRecommendations(),
    teamContext: getTeamContext()
  };
}
