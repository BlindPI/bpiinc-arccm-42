
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Award,
  Settings,
  UserCheck
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN', 'ST'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['SA', 'AD'] },
  { name: 'Teams', href: '/teams', icon: UserCheck, roles: ['SA', 'AD', 'AP'] },
  { name: 'Certificates', href: '/certificates', icon: Award, roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN', 'ST'] },
  { name: 'CRM', href: '/crm', icon: FileText, roles: ['SA', 'AD', 'AP'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SA', 'AD'] }
];

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.profile?.role;

  const filteredNavigation = navigation.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <div className="w-64 border-r bg-muted/10 h-full">
      <div className="p-4">
        <nav className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
