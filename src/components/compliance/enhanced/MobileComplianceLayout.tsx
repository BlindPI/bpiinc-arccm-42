/**
 * MOBILE COMPLIANCE LAYOUT
 * 
 * Phase 4: Enhanced Mobile Responsiveness
 * Provides optimized mobile experience for compliance dashboard
 * 
 * Features:
 * - Mobile-first responsive design
 * - Touch-friendly interactions
 * - Simplified navigation for small screens
 * - Swipeable card interfaces
 * - Optimized button sizes and spacing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Users,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

interface MobileComplianceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const MobileQuickActions: React.FC = () => {
  const { state } = useComplianceDashboard();
  const { complianceSummary, complianceActions } = state.data;

  const pendingUploads = complianceActions?.filter(action => 
    action.action_type === 'upload' && action.status === 'open'
  ).length || 0;

  const quickActions = [
    {
      id: 'upload',
      label: 'Upload Document',
      icon: Upload,
      color: 'bg-blue-500 text-white',
      action: () => {
        // Trigger upload modal
      }
    },
    {
      id: 'requirements',
      label: 'View Requirements',
      icon: FileText,
      color: 'bg-green-500 text-white',
      badge: pendingUploads
    },
    {
      id: 'progress',
      label: 'My Progress', 
      icon: BarChart3,
      color: 'bg-purple-500 text-white'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {quickActions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          className={cn(
            "h-20 flex-col gap-2 relative touch-manipulation",
            action.color
          )}
        >
          <action.icon className="h-6 w-6" />
          <span className="text-xs font-medium">{action.label}</span>
          {action.badge && action.badge > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {action.badge}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

const MobileStatusCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon: Icon, color = 'text-gray-600', onClick }) => (
  <Card 
    className={cn(
      "touch-manipulation transition-all duration-200",
      onClick && "cursor-pointer hover:shadow-md active:scale-95"
    )}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {subtitle && (
              <span className="text-xs text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>
        <div className={cn("p-2 rounded-lg bg-gray-100", color)}>
          <Icon className="h-5 w-5" />
        </div>
        {onClick && <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />}
      </div>
    </CardContent>
  </Card>
);

const MobileComplianceOverview: React.FC = () => {
  const { state } = useComplianceDashboard();
  const { complianceSummary, tierInfo, complianceRecords } = state.data;

  const completionPercentage = tierInfo?.completion_percentage || 0;
  const pendingCount = complianceSummary?.pending_count || 0;
  const overallScore = complianceSummary?.overall_score || 0;

  return (
    <div className="space-y-4 p-4">
      {/* Tier Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Tier</p>
              <p className="font-semibold text-lg capitalize">
                {tierInfo?.tier || 'Basic'}
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {completionPercentage}% Complete
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {tierInfo?.completed_requirements || 0} of {tierInfo?.total_requirements || 0} requirements completed
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <MobileStatusCard
          title="Overall Score"
          value={`${overallScore}%`}
          icon={BarChart3}
          color="text-green-600"
        />
        <MobileStatusCard
          title="Pending Items"
          value={pendingCount}
          subtitle="to complete"
          icon={AlertTriangle}
          color="text-orange-600"
        />
      </div>
    </div>
  );
};

const MobileBottomNav: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}> = ({ activeTab, onTabChange, userRole }) => {
  const { state } = useComplianceDashboard();
  const unreadNotifications = state.notifications?.filter(n => !n.read).length || 0;

  const navItems: MobileNavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: FileText
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload
    },
    ...(userRole === 'AP' ? [{
      id: 'team',
      label: 'Team',
      icon: Users
    }] : []),
    {
      id: 'settings',
      label: 'More',
      icon: Settings,
      badge: unreadNotifications
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-padding-bottom md:hidden">
      <div className="grid grid-cols-4 lg:grid-cols-5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors touch-manipulation relative",
              activeTab === item.id
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 mb-1",
              activeTab === item.id ? "text-blue-600" : "text-gray-400"
            )} />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
              >
                {item.badge}
              </Badge>
            )}
            {activeTab === item.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileHeader: React.FC<{
  displayName: string;
  unreadNotifications: number;
  onNotificationClick: () => void;
  onMenuClick: () => void;
}> = ({ displayName, unreadNotifications, onNotificationClick, onMenuClick }) => (
  <div className="bg-white border-b border-gray-200 p-4 md:hidden">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -m-2 text-gray-600 hover:text-gray-900 touch-manipulation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-semibold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-500">Welcome back, {displayName}</p>
        </div>
      </div>
      
      <button
        onClick={onNotificationClick}
        className="relative p-2 -m-2 text-gray-600 hover:text-gray-900 touch-manipulation"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadNotifications}
          </Badge>
        )}
      </button>
    </div>
  </div>
);

export const MobileComplianceLayout: React.FC<MobileComplianceLayoutProps> = ({
  children,
  className = ""
}) => {
  const { state, dispatch } = useComplianceDashboard();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadNotifications = state.notifications?.filter(n => !n.read).length || 0;

  const handleTabChange = (tab: string) => {
    dispatch({
      type: 'SET_VIEW',
      payload: { activeTab: tab }
    });
  };

  const handleNotificationClick = () => {
    // Switch to notifications view
    dispatch({
      type: 'SET_VIEW',
      payload: { activeTab: 'notifications' }
    });
  };

  const handleMenuClick = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className={cn("min-h-screen bg-gray-50 pb-16 md:pb-0", className)}>
      {/* Mobile Header */}
      <MobileHeader
        displayName={state.displayName || 'User'}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
        onMenuClick={handleMenuClick}
      />

      {/* Mobile Quick Actions */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <MobileQuickActions />
      </div>

      {/* Mobile Overview (shown only on overview tab) */}
      {state.view.activeTab === 'overview' && (
        <div className="md:hidden">
          <MobileComplianceOverview />
        </div>
      )}

      {/* Main Content */}
      <div className="md:hidden">
        {state.view.activeTab !== 'overview' && children}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={state.view.activeTab}
        onTabChange={handleTabChange}
        userRole={state.userRole}
      />

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="bg-white h-full w-64 p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 -m-2 text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Menu content can be added here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileComplianceLayout;