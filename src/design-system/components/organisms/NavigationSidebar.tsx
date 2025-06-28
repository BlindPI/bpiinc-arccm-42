
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '../atoms/EnhancedButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string | number;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface NavigationSidebarProps {
  groups: NavigationGroup[];
  userRole?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function NavigationSidebar({
  groups,
  userRole,
  collapsed = false,
  onCollapsedChange,
  className
}: NavigationSidebarProps) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const filteredGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      !item.roles || !userRole || item.roles.includes(userRole)
    )
  })).filter(group => group.items.length > 0);

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={cn(
      'relative h-full bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Collapse Toggle */}
      <div className="absolute -right-3 top-6 z-10">
        <EnhancedButton
          variant="secondary"
          size="sm"
          icon={collapsed ? ChevronRight : ChevronLeft}
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="w-6 h-6 rounded-full shadow-md"
        />
      </div>

      {/* Navigation Content */}
      <div className="p-4 h-full overflow-y-auto">
        {/* Logo/Brand Area */}
        <div className={cn(
          'flex items-center mb-8 transition-all duration-300',
          collapsed ? 'justify-center' : 'justify-start'
        )}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-bold text-gray-900">
              Training Hub
            </span>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-6">
          {filteredGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
              )}
              
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                        onMouseEnter={() => setHoveredItem(item.path)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <Icon className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        )} />
                        
                        {!collapsed && (
                          <>
                            <span className="ml-3 truncate">{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {collapsed && hoveredItem === item.path && (
                          <div className="absolute left-16 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-100 transition-opacity z-50 whitespace-nowrap">
                            {item.title}
                            {item.badge && ` (${item.badge})`}
                          </div>
                        )}
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        
        {/* User Role Badge */}
        {!collapsed && userRole && (
          <div className="mt-auto pt-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Current Role</div>
              <div className="text-sm font-medium text-gray-900">{userRole}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
