
import React, { useState } from 'react';
import { Search, Bell, Settings, User, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '../atoms/EnhancedButton';
import { SmartInput } from '../atoms/SmartInput';
import { StatusIndicator } from '../atoms/StatusIndicator';
import { FlexLayout } from '../../layout/FlexLayout';

interface TopNavigationBarProps {
  title?: string;
  userEmail?: string;
  userRole?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onSignOut?: () => void;
  className?: string;
}

export function TopNavigationBar({
  title = "Training Hub",
  userEmail,
  userRole,
  notificationCount = 0,
  onMenuClick,
  onSearchSubmit,
  onSignOut,
  className
}: TopNavigationBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(searchQuery);
  };

  return (
    <header className={cn(
      'h-16 bg-white border-b border-gray-200 shadow-sm',
      'fixed top-0 left-0 right-0 z-50',
      className
    )}>
      <FlexLayout 
        justify="between" 
        align="center" 
        className="h-full px-6"
      >
        {/* Left Section */}
        <FlexLayout align="center" gap="base">
          {onMenuClick && (
            <EnhancedButton
              variant="ghost"
              size="sm"
              icon={Menu}
              onClick={onMenuClick}
              className="lg:hidden"
            />
          )}
          
          <FlexLayout align="center" gap="sm">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TH</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              {title}
            </h1>
          </FlexLayout>
        </FlexLayout>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit}>
              <SmartInput
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search />}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                autoFocus
                className="bg-gray-50 border-gray-200"
              />
            </form>
          ) : (
            <EnhancedButton
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className="w-full justify-start text-gray-500 bg-gray-50"
              icon={Search}
            >
              Search...
            </EnhancedButton>
          )}
        </div>

        {/* Right Section */}
        <FlexLayout align="center" gap="sm">
          {/* Mobile Search */}
          <EnhancedButton
            variant="ghost"
            size="sm"
            icon={Search}
            className="md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          />

          {/* Notifications */}
          <div className="relative">
            <EnhancedButton
              variant="ghost"
              size="sm"
              icon={Bell}
            />
            {notificationCount > 0 && (
              <StatusIndicator
                status="critical"
                size="sm"
                className="absolute -top-1 -right-1"
                text={notificationCount.toString()}
                showText
              />
            )}
          </div>

          {/* Settings */}
          <EnhancedButton
            variant="ghost"
            size="sm"
            icon={Settings}
          />

          {/* User Profile */}
          <div className="relative">
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:block text-sm font-medium">
                {userEmail?.split('@')[0] || 'User'}
              </span>
            </EnhancedButton>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    {userEmail}
                  </div>
                  {userRole && (
                    <div className="text-xs text-gray-500 mt-1">
                      Role: {userRole}
                    </div>
                  )}
                </div>
                
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm">
                  <Settings className="w-4 h-4" />
                  <span>Preferences</span>
                </button>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button 
                    onClick={onSignOut}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </FlexLayout>
      </FlexLayout>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-4">
          <form onSubmit={handleSearchSubmit}>
            <SmartInput
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search />}
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}
