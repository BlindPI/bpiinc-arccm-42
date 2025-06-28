
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, User, LogOut, Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EnterpriseHeaderProps {
  onMenuClick: () => void;
  userProfile?: any;
}

export function EnterpriseHeader({ onMenuClick, userProfile }: EnterpriseHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 border-b bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Menu Toggle */}
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Training Hub</h1>
        </div>
        
        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search anything..." 
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
        
        {/* User Actions */}
        <div className="flex items-center gap-3">
          {userProfile?.role && (
            <Badge variant="outline" className="text-xs font-medium">
              {userProfile.role}
            </Badge>
          )}
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>
    </header>
  );
}
