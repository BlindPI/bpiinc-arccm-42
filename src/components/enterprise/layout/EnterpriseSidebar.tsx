
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Award,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavigationItem } from '@/types/enterprise';
import { Button } from '@/components/ui/button';

interface EnterpriseSidebarProps {
  open: boolean;
  userRole?: string;
  onClose: () => void;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN', 'ST'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['SA', 'AD'] },
  { name: 'Teams', href: '/teams', icon: UserCheck, roles: ['SA', 'AD', 'AP'] },
  { name: 'Certificates', href: '/certificates', icon: Award, roles: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN', 'ST'] },
  { name: 'CRM', href: '/crm', icon: FileText, roles: ['SA', 'AD', 'AP'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SA', 'AD'] }
];

export function EnterpriseSidebar({ open, userRole, onClose }: EnterpriseSidebarProps) {
  const location = useLocation();
  
  const filteredNavigation = navigation.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r shadow-lg z-50 transition-all duration-300',
        open ? 'w-64' : 'w-16',
        'lg:relative lg:top-0 lg:h-full'
      )}>
        {/* Toggle Button */}
        <div className="absolute -right-3 top-6 z-10">
          <Button
            variant="outline"
            size="icon"
            className="w-6 h-6 rounded-full bg-white shadow-md"
            onClick={onClose}
          >
            {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Navigation */}
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-2">
            {open && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Navigation
                </h2>
              </div>
            )}
            
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative group',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={!open ? item.name : ''}
                >
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )} />
                  
                  {open && (
                    <>
                      <span className="ml-3">{item.name}</span>
                      {isActive && (
                        <Badge variant="default" className="ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!open && (
                    <div className="absolute left-16 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Role Info */}
          {open && userRole && (
            <div className="mt-8 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Current Role</div>
              <Badge variant="outline" className="text-xs">
                {userRole}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
