import React from 'react';
import { Settings, Users, FileCheck, BarChart3, User, Bell, Shield, Database } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

interface ComplianceSettingsDropdownProps {
  userRole: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';
  onNavigate: (path: string) => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
}

const settingsMenuByRole: Record<string, MenuItem[]> = {
  SA: [
    {
      label: 'System Configuration',
      path: '/compliance/admin/system',
      icon: <Database className="h-4 w-4" />,
      description: 'Configure system settings and parameters'
    },
    {
      label: 'User Management',
      path: '/compliance/admin/users',
      icon: <Users className="h-4 w-4" />,
      description: 'Manage user roles and permissions'
    },
    {
      label: 'Document Verification',
      path: '/compliance/admin/documents',
      icon: <FileCheck className="h-4 w-4" />,
      description: 'Review and verify uploaded documents'
    },
    {
      label: 'Metrics Setup',
      path: '/compliance/admin/metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Configure compliance metrics and requirements'
    },
    {
      label: 'Security Settings',
      path: '/compliance/admin/security',
      icon: <Shield className="h-4 w-4" />,
      description: 'Manage security policies and access controls'
    }
  ],
  AD: [
    {
      label: 'User Management',
      path: '/compliance/admin/users',
      icon: <Users className="h-4 w-4" />,
      description: 'Manage user accounts and compliance status'
    },
    {
      label: 'Document Verification',
      path: '/compliance/admin/documents',
      icon: <FileCheck className="h-4 w-4" />,
      description: 'Review and verify uploaded documents'
    },
    {
      label: 'Reports',
      path: '/compliance/admin/reports',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'View compliance reports and analytics'
    },
    {
      label: 'Notification Settings',
      path: '/compliance/admin/notifications',
      icon: <Bell className="h-4 w-4" />,
      description: 'Configure system notifications'
    }
  ],
  AP: [
    {
      label: 'Team Overview',
      path: '/compliance/team/overview',
      icon: <Users className="h-4 w-4" />,
      description: 'View team compliance status'
    },
    {
      label: 'Member Management',
      path: '/compliance/team/members',
      icon: <User className="h-4 w-4" />,
      description: 'Manage team member compliance'
    },
    {
      label: 'Tier Requests',
      path: '/compliance/team/tier-requests',
      icon: <FileCheck className="h-4 w-4" />,
      description: 'Review and approve tier change requests'
    },
    {
      label: 'Team Reports',
      path: '/compliance/team/reports',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'View team compliance reports'
    }
  ],
  IC: [
    {
      label: 'Personal Settings',
      path: '/compliance/personal/settings',
      icon: <User className="h-4 w-4" />,
      description: 'Manage your personal compliance settings'
    },
    {
      label: 'Notification Preferences',
      path: '/compliance/personal/notifications',
      icon: <Bell className="h-4 w-4" />,
      description: 'Configure your notification preferences'
    }
  ],
  IP: [
    {
      label: 'Personal Settings',
      path: '/compliance/personal/settings',
      icon: <User className="h-4 w-4" />,
      description: 'Manage your personal compliance settings'
    },
    {
      label: 'Notification Preferences',
      path: '/compliance/personal/notifications',
      icon: <Bell className="h-4 w-4" />,
      description: 'Configure your notification preferences'
    }
  ],
  IT: [
    {
      label: 'Personal Settings',
      path: '/compliance/personal/settings',
      icon: <User className="h-4 w-4" />,
      description: 'Manage your personal compliance settings'
    },
    {
      label: 'Notification Preferences',
      path: '/compliance/personal/notifications',
      icon: <Bell className="h-4 w-4" />,
      description: 'Configure your notification preferences'
    }
  ]
};

const roleLabels: Record<string, string> = {
  SA: 'System Administrator',
  AD: 'Admin',
  AP: 'Authorized Provider',
  IC: 'Individual Contributor',
  IP: 'Individual Provider',
  IT: 'Individual Trainee'
};

export function ComplianceSettingsDropdown({ userRole, onNavigate }: ComplianceSettingsDropdownProps) {
  const menuItems = settingsMenuByRole[userRole] || [];
  const isAdmin = userRole === 'SA' || userRole === 'AD';
  const isProvider = userRole === 'AP';

  return (
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel className="flex items-center space-x-2">
        <Settings className="h-4 w-4" />
        <div className="flex flex-col">
          <span>Settings</span>
          <span className="text-xs font-normal text-gray-500">{roleLabels[userRole]}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      {isAdmin && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
              Administration
            </DropdownMenuLabel>
            {menuItems.filter(item => 
              item.path.includes('/admin/') || item.path.includes('/system/')
            ).map((item) => (
              <DropdownMenuItem
                key={item.path}
                className="flex flex-col items-start space-y-1 p-3 cursor-pointer"
                onClick={() => onNavigate(item.path)}
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.description && (
                  <span className="text-xs text-gray-500 ml-6">{item.description}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}

      {isProvider && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
              Team Management
            </DropdownMenuLabel>
            {menuItems.filter(item => item.path.includes('/team/')).map((item) => (
              <DropdownMenuItem
                key={item.path}
                className="flex flex-col items-start space-y-1 p-3 cursor-pointer"
                onClick={() => onNavigate(item.path)}
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.description && (
                  <span className="text-xs text-gray-500 ml-6">{item.description}</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
          Personal
        </DropdownMenuLabel>
        {menuItems.filter(item => item.path.includes('/personal/')).map((item) => (
          <DropdownMenuItem
            key={item.path}
            className="flex flex-col items-start space-y-1 p-3 cursor-pointer"
            onClick={() => onNavigate(item.path)}
          >
            <div className="flex items-center space-x-2">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
            {item.description && (
              <span className="text-xs text-gray-500 ml-6">{item.description}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}