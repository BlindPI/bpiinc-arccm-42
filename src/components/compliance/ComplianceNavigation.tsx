import React from 'react';
import { cn } from '@/lib/utils';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { 
  BarChart3, 
  CheckCircle, 
  Users, 
  Upload, 
  FileText, 
  Shield, 
  AlertTriangle,
  User,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT']
  },
  {
    id: 'my-compliance',
    label: 'My Compliance',
    icon: User,
    roles: ['IC', 'IP', 'IT']
  },
  {
    id: 'requirements',
    label: 'Requirements',
    icon: FileText,
    roles: ['SA', 'AD', 'IC', 'IP', 'IT']
  },
  {
    id: 'upload',
    label: 'Upload Documents',
    icon: Upload,
    roles: ['IC', 'IP', 'IT']
  },
  {
    id: 'actions',
    label: 'Action Items',
    icon: AlertTriangle,
    roles: ['IC', 'IP', 'IT']
  },
  {
    id: 'team-overview',
    label: 'Team Overview',
    icon: Users,
    roles: ['AP']
  },
  {
    id: 'team-members',
    label: 'Team Members',
    icon: Users,
    roles: ['AP']
  },
  {
    id: 'team-documents',
    label: 'Documents',
    icon: FileText,
    roles: ['AP']
  },
  {
    id: 'verification',
    label: 'Verification Queue',
    icon: CheckCircle,
    roles: ['SA', 'AD']
  },
  {
    id: 'user-management',
    label: 'User Management',
    icon: Users,
    roles: ['SA', 'AD']
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: Settings,
    roles: ['SA', 'AD']
  }
];

export function ComplianceNavigation() {
  const { state, dispatch } = useComplianceDashboard();

  // Filter navigation items based on user role
  const availableItems = navigationItems.filter(item => 
    item.roles.includes(state.userRole)
  );

  const handleTabChange = (tabId: string) => {
    dispatch({
      type: 'SET_VIEW',
      payload: { activeTab: tabId }
    });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8 overflow-x-auto">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.view.activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <select
            value={state.view.activeTab}
            onChange={(e) => handleTabChange(e.target.value)}
            className="w-full py-3 px-4 text-sm font-medium text-gray-700 bg-white border-0 focus:ring-0 focus:outline-none"
          >
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}