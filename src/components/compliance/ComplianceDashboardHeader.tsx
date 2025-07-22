import React from 'react';
import { Bell, Upload, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';

export function ComplianceDashboardHeader() {
  const { state, refreshData, dispatch } = useComplianceDashboard();

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  const handleUploadClick = () => {
    dispatch({ type: 'OPEN_UPLOAD_MODAL', payload: '' });
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Welcome */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Compliance Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {state.displayName}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Upload Button */}
            <Button
              onClick={handleUploadClick}
              className="hidden sm:flex items-center gap-2"
              size="sm"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>

            {/* Mobile Upload Button */}
            <Button
              onClick={handleUploadClick}
              size="sm"
              className="sm:hidden"
            >
              <Upload className="h-4 w-4" />
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={state.loading}
            >
              <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* Settings (for admin roles) */}
            {(state.userRole === 'SA' || state.userRole === 'AD') && (
              <Button
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Upload Queue Indicator */}
        {state.uploadQueue.length > 0 && (
          <div className="py-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {state.uploadQueue.filter(u => u.status === 'uploading').length} uploads in progress
              </div>
              <div className="flex space-x-2">
                {state.uploadQueue.map(upload => (
                  <div key={upload.id} className="flex items-center space-x-2">
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {upload.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}