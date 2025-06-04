import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  UserPlus,
  Target,
  Calendar
} from 'lucide-react';

interface CRMTopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export const CRMTopBar: React.FC<CRMTopBarProps> = ({
  onMenuClick,
  sidebarCollapsed
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthProvider(navigate);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const quickActions = [
    {
      label: 'New Lead',
      icon: UserPlus,
      href: '/crm/leads/create',
      description: 'Add a new lead'
    },
    {
      label: 'New Opportunity',
      icon: Target,
      href: '/crm/opportunities/create',
      description: 'Create opportunity'
    },
    {
      label: 'Schedule Activity',
      icon: Calendar,
      href: '/crm/activities/create',
      description: 'Schedule meeting or call'
    }
  ];

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads, opportunities..."
            className="pl-10 w-64 lg:w-80"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Quick Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {/* Note: Notification count would be fetched from actual notification service */}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {user?.display_name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-medium">{user?.display_name || 'User'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            {user?.role === 'SA' && (
              <DropdownMenuItem onClick={() => navigate('/crm/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                CRM Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};