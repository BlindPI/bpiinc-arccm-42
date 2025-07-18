
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  MapPin,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowRight,
  UserCheck,
  Layers,
  Target,
  Workflow
} from 'lucide-react';

interface NavigationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  stats?: {
    primary: number | string;
    secondary?: number | string;
    trend?: 'up' | 'down' | 'stable';
    label: string;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  action: () => void;
}

interface TrainingHubNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalSessions: number;
  activeInstructors: number;
  upcomingSchedules: number;
  activeLocations?: number;
  complianceRate: number;
  totalTeamMembers?: number;
  bulkOperations?: number;
  multiCourseTemplates?: number;
  activeComponentTracking?: number;
}

export const TrainingHubNavigation: React.FC<TrainingHubNavigationProps> = ({
  activeTab,
  onTabChange,
  totalSessions,
  activeInstructors,
  upcomingSchedules,
  activeLocations = 0,
  complianceRate,
  totalTeamMembers = 0,
  bulkOperations = 0,
  multiCourseTemplates = 0,
  activeComponentTracking = 0
}) => {
  const navigationCards: NavigationCard[] = [
    {
      id: 'sessions',
      title: 'Session Management',
      description: 'Create, track, and manage single or multi-course training sessions with component-level progress tracking',
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      stats: {
        primary: totalSessions,
        label: 'Active sessions',
        trend: 'up'
      },
      badge: totalSessions > 0 
        ? { text: 'Active Sessions', variant: 'default' as const }
        : { text: 'No Sessions', variant: 'secondary' as const },
      action: () => onTabChange('sessions')
    },
    {
      id: 'multi-course-templates',
      title: 'Multi-Course Templates',
      description: 'Build reusable templates for complex training itineraries with multiple courses, breaks, and assessments',
      icon: Layers,
      gradient: 'from-emerald-500 to-green-600',
      stats: {
        primary: multiCourseTemplates || 'NEW',
        label: 'Templates available',
        trend: 'up'
      },
      badge: { text: 'Enhanced', variant: 'default' as const },
      action: () => onTabChange('multi-course-templates')
    },
    {
      id: 'component-progress',
      title: 'Component Progress',
      description: 'Track detailed progress through individual session components with real-time updates and analytics',
      icon: Target,
      gradient: 'from-violet-500 to-purple-600',
      stats: {
        primary: activeComponentTracking || activeInstructors,
        label: 'Active tracking',
        trend: 'up'
      },
      badge: { text: 'Real-time', variant: 'default' as const },
      action: () => onTabChange('component-progress')
    },
    {
      id: 'instructors',
      title: 'Instructor Workload',
      description: 'Monitor instructor performance, workload distribution, and capacity management',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      stats: {
        primary: activeInstructors,
        label: 'Active instructors',
        trend: 'stable'
      },
      badge: activeInstructors > 0 
        ? { text: 'Staff Available', variant: 'default' as const }
        : { text: 'No Instructors', variant: 'secondary' as const },
      action: () => onTabChange('instructors')
    },
    {
      id: 'courses',
      title: 'Course Management',
      description: 'Manage course catalog, enrollments, and course offerings with full lifecycle tracking',
      icon: GraduationCap,
      gradient: 'from-green-500 to-emerald-600',
      stats: {
        primary: upcomingSchedules,
        label: 'Active courses',
        trend: upcomingSchedules > 0 ? 'up' : 'stable'
      },
      badge: upcomingSchedules > 0
        ? { text: 'Courses Available', variant: 'default' as const }
        : { text: 'No Courses', variant: 'secondary' as const },
      action: () => onTabChange('courses')
    },
    {
      id: 'team-management',
      title: 'Team Management',
      description: 'Manage team availability, bulk scheduling operations, and team collaboration tools',
      icon: UserCheck,
      gradient: 'from-rose-500 to-pink-600',
      stats: {
        primary: totalTeamMembers,
        secondary: bulkOperations,
        label: 'Team members',
        trend: 'up'
      },
      badge: totalTeamMembers > 0
        ? { text: 'Teams Active', variant: 'default' as const }
        : { text: 'No Teams', variant: 'secondary' as const },
      action: () => onTabChange('team-management')
    },
    {
      id: 'locations',
      title: 'Location Management',
      description: 'Manage training locations, facility capacity, and geographic service areas',
      icon: MapPin,
      gradient: 'from-indigo-500 to-indigo-600',
      stats: {
        primary: activeLocations,
        label: 'Active locations',
        trend: 'stable'
      },
      badge: { text: 'Locations Active', variant: 'default' as const },
      action: () => onTabChange('locations')
    },
    {
      id: 'rosters',
      title: 'Roster Management',
      description: 'Track student rosters, attendance records, and training completion status',
      icon: ClipboardList,
      gradient: 'from-teal-500 to-teal-600',
      stats: {
        primary: activeInstructors, // Using instructors as proxy for roster activity
        label: 'Active rosters',
        trend: 'up'
      },
      badge: { text: 'Rosters Managed', variant: 'default' as const },
      action: () => onTabChange('rosters')
    },
    {
      id: 'analytics',
      title: 'Training Analytics',
      description: 'Comprehensive training analytics, performance metrics, and compliance reporting',
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-600',
      stats: {
        primary: `${complianceRate}%`,
        label: 'Compliance rate',
        trend: complianceRate >= 80 ? 'up' : 'down'
      },
      badge: complianceRate >= 80 
        ? { text: 'Compliant', variant: 'default' as const }
        : { text: 'Action Needed', variant: 'secondary' as const },
      action: () => onTabChange('analytics')
    }
  ];

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Training Management Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enhanced with multi-course session support and component-level progress tracking
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Workflow className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-emerald-600">Multi-Course Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-violet-600" />
              <span className="font-medium text-violet-600">Component Tracking</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 gap-4">
          {navigationCards.map((card) => (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 overflow-hidden ${
                activeTab === card.id ? 'ring-2 ring-primary shadow-lg scale-105' : ''
              } ${
                // Highlight new multi-course features
                ['multi-course-templates', 'component-progress'].includes(card.id) 
                  ? 'ring-1 ring-emerald-200 bg-emerald-50/30' 
                  : ''
              }`}
              onClick={card.action}
            >
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${card.gradient} bg-opacity-10`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {card.badge && (
                      <Badge variant={card.badge.variant} className="text-xs">
                        {card.badge.text}
                      </Badge>
                    )}
                    {/* NEW badge for multi-course features */}
                    {['multi-course-templates', 'component-progress'].includes(card.id) && (
                      <Badge variant="default" className="text-xs bg-emerald-600">
                        NEW
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {card.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {card.description}
                </p>
                
                {card.stats && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {card.stats.primary}
                      </span>
                      {card.stats.secondary && (
                        <span className="text-sm text-gray-500">
                          ({card.stats.secondary})
                        </span>
                      )}
                      {getTrendIcon(card.stats.trend)}
                    </div>
                    <span className="text-xs text-gray-500">{card.stats.label}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
