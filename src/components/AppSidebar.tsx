
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  Settings,
  Zap,
  Globe,
  TrendingUp,
  MapPin,
  User,
  Building2
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Certificates', href: '/certificates', icon: FileText },
  { name: 'Courses', href: '/courses', icon: GraduationCap },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Integrations', href: '/integrations', icon: Globe },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Enterprise TMS</span>
        </div>
      </div>
      
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
