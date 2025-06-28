
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BarChart3,
  Settings,
  Shield,
  CreditCard,
  Zap,
  UserCheck
} from 'lucide-react';
import type { UserRole } from '@/types/foundation';

interface AppSidebarProps {
  open: boolean;
  userRole?: UserRole;
  onClose: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Teams',
    path: '/teams',
    icon: Users
  },
  {
    title: 'Certificates',
    path: '/certificates',
    icon: GraduationCap
  },
  {
    title: 'Analytics',
    path: '/analytics',
    icon: BarChart3
  },
  {
    title: 'CRM',
    path: '/crm',
    icon: CreditCard,
    roles: ['SA', 'AD', 'AP']
  },
  {
    title: 'Automation',
    path: '/automation',
    icon: Zap,
    roles: ['SA', 'AD']
  },
  {
    title: 'Compliance Admin',
    path: '/compliance-dashboard/admin',
    icon: Shield,
    roles: ['SA', 'AD']
  },
  {
    title: 'User Management',
    path: '/users',
    icon: UserCheck,
    roles: ['SA', 'AD']
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings
  }
];

export function AppSidebar({ open, userRole, onClose }: AppSidebarProps) {
  const filteredItems = navigationItems.filter(item => 
    !item.roles || !userRole || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50',
        'transform transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0'
      )}>
        <nav className="p-4 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
