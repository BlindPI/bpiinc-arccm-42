
import React, { useState } from 'react';
import { Menu, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types/foundation';

interface AppHeaderProps {
  onMenuClick: () => void;
  userProfile?: UserProfile | null;
}

export function AppHeader({ onMenuClick, userProfile }: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            icon={<Menu className="w-5 h-5" />}
          />
          
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-900">
              Assured Response
            </span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-lg mx-8">
          {searchOpen ? (
            <Input
              placeholder="Search..."
              leftIcon={<Search className="w-4 h-4" />}
              onBlur={() => setSearchOpen(false)}
              autoFocus
            />
          ) : (
            <Button
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className="w-full justify-start text-gray-500"
              icon={<Search className="w-4 h-4" />}
            >
              Search...
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Bell className="w-5 h-5" />}
          />
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:block">
                {userProfile?.display_name || userProfile?.email || 'User'}
              </span>
            </Button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={signOut}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
