import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import {
  BarChart3,
  Users,
  Target,
  Calendar,
  Mail,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Building2,
  UserPlus,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react';

interface CRMSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
}

export const CRMSidebar: React.FC<CRMSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onClose
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthProvider(navigate);
  
  const isSA = user?.role === 'SA';

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/crm',
      icon: BarChart3,
      description: 'Overview & metrics'
    },
    {
      title: 'Leads',
      href: '/crm/leads',
      icon: Users,
      description: 'Lead management',
      submenu: [
        { title: 'All Leads', href: '/crm/leads' },
        { title: 'My Leads', href: '/crm/leads/my' },
        { title: 'Unassigned', href: '/crm/leads/unassigned' },
        { title: 'Import Leads', href: '/crm/leads/import' }
      ]
    },
    {
      title: 'Opportunities',
      href: '/crm/opportunities',
      icon: Target,
      description: 'Sales pipeline',
      submenu: [
        { title: 'Pipeline View', href: '/crm/opportunities' },
        { title: 'My Opportunities', href: '/crm/opportunities/my' },
        { title: 'Forecasting', href: '/crm/opportunities/forecast' },
        { title: 'Closed Deals', href: '/crm/opportunities/closed' }
      ]
    },
    {
      title: 'Activities',
      href: '/crm/activities',
      icon: Calendar,
      description: 'Tasks & meetings',
      submenu: [
        { title: 'My Tasks', href: '/crm/activities/tasks' },
        { title: 'Calendar', href: '/crm/activities/calendar' },
        { title: 'Activity Log', href: '/crm/activities/log' },
        { title: 'Follow-ups', href: '/crm/activities/followups' }
      ]
    },
    {
      title: 'Campaigns',
      href: '/crm/campaigns',
      icon: Mail,
      description: 'Email marketing',
      submenu: [
        { title: 'Active Campaigns', href: '/crm/campaigns' },
        { title: 'Templates', href: '/crm/campaigns/templates' },
        { title: 'Analytics', href: '/crm/campaigns/analytics' },
        { title: 'Create Campaign', href: '/crm/campaigns/create' }
      ]
    },
    {
      title: 'Revenue',
      href: '/crm/revenue',
      icon: DollarSign,
      description: 'Financial tracking',
      submenu: [
        { title: 'Revenue Dashboard', href: '/crm/revenue' },
        { title: 'Commission Tracking', href: '/crm/revenue/commissions' },
        { title: 'AP Performance', href: '/crm/revenue/ap-performance' },
        { title: 'Reports', href: '/crm/revenue/reports' }
      ]
    }
  ];

  // Add settings for SA users
  if (isSA) {
    navigationItems.push({
      title: 'Settings',
      href: '/crm/settings',
      icon: Settings,
      description: 'System configuration',
      submenu: [
        { title: 'Pipeline Configuration', href: '/crm/settings/pipeline' },
        { title: 'Lead Scoring Rules', href: '/crm/settings/scoring' },
        { title: 'Assignment Rules', href: '/crm/settings/assignment' },
        { title: 'System Analytics', href: '/crm/settings/analytics' }
      ]
    });
  }

  const isActive = (href: string) => {
    if (href === '/crm') {
      return location.pathname === '/crm';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">CRM</span>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn("hidden lg:flex", collapsed && "w-full justify-center")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Back to Main App */}
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={cn("w-full justify-start", collapsed && "px-2")}
        >
          <Link to="/">
            <Home className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Back to Main App</span>}
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <div key={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                    "w-full justify-start",
                    collapsed && "px-2",
                    active && "bg-secondary"
                  )}
                >
                  <Link to={item.href}>
                    <Icon className="h-4 w-4" />
                    {!collapsed && (
                      <div className="ml-2 flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                </Button>
                
                {/* Submenu for active items (desktop only, not collapsed) */}
                {!collapsed && active && item.submenu && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Button
                        key={subItem.href}
                        variant={location.pathname === subItem.href ? "secondary" : "ghost"}
                        size="sm"
                        asChild
                        className="w-full justify-start text-sm"
                      >
                        <Link to={subItem.href}>
                          {subItem.title}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.display_name || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.role} • CRM Access
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};