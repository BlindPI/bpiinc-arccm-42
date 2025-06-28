
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  FileText,
  BarChart3,
  Settings,
  Building2,
  Shield,
  Bell,
  Zap,
  UserCheck,
  MapPin,
  BookOpen,
  Briefcase,
  Monitor,
  Database,
  RotateCcw
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Main dashboard and overview pages'
  },
  {
    id: 'provider-compliance',
    label: 'Provider & Compliance Management',
    icon: Building2,
    description: 'Provider management and compliance dashboard'
  },
  {
    id: 'user-management',
    label: 'User Management',
    icon: Users,
    description: 'Users, teams, and location management'
  },
  {
    id: 'training-education',
    label: 'Training & Education',
    icon: BookOpen,
    description: 'Courses, certificates, enrollments, and role management'
  },
  {
    id: 'compliance-automation',
    label: 'Compliance & Automation',
    icon: FileText,
    description: 'Compliance tracking, automation, and notifications'
  },
  {
    id: 'analytics-reporting',
    label: 'Analytics & Reporting',
    icon: BarChart3,
    description: 'Analytics dashboards and reporting tools'
  },
  {
    id: 'system-tools',
    label: 'System & Tools',
    icon: Settings,
    description: 'CRM, system monitoring, backup, and settings'
  }
];

export function SidebarNavigationControl() {
  const { visibleGroups, toggleGroup, updateVisibility } = useNavigationVisibility();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleToggleGroup = async (groupId: string) => {
    const success = await toggleGroup(groupId);
    if (success) {
      toast({
        title: "Navigation Updated",
        description: "Sidebar navigation has been updated successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update navigation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetToDefaults = async () => {
    setIsResetting(true);
    try {
      const defaultConfig = {
        visibleGroups: [
          'dashboard',
          'provider-compliance',
          'user-management',
          'training-education',
          'compliance-automation',
          'analytics-reporting',
          'system-tools'
        ],
        hiddenGroups: [],
        customOrder: [
          'dashboard',
          'provider-compliance',
          'user-management',
          'training-education',
          'compliance-automation',
          'analytics-reporting',
          'system-tools'
        ]
      };

      const success = await updateVisibility(defaultConfig);
      if (success) {
        toast({
          title: "Reset Complete",
          description: "Navigation has been reset to default settings.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset navigation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting navigation:', error);
      toast({
        title: "Error",
        description: "Failed to reset navigation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sidebar Navigation Control</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={isResetting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Control which navigation groups are visible in the sidebar. Changes apply immediately.
        </div>

        <div className="space-y-4">
          {NAVIGATION_GROUPS.map((group) => {
            const isVisible = visibleGroups.includes(group.id);
            const Icon = group.icon;

            return (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{group.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isVisible ? "default" : "secondary"}>
                    {isVisible ? "Visible" : "Hidden"}
                  </Badge>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => handleToggleGroup(group.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Navigation Structure Changes</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Provider & Compliance Management:</strong> Now includes both Provider Management and Compliance Dashboard</p>
            <p>• <strong>Enhanced Grouping:</strong> Related features are now grouped together for better workflow</p>
            <p>• <strong>Role-Based Access:</strong> Visibility still respects user role permissions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
