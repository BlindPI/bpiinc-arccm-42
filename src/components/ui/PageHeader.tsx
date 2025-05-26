
import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant?: string;
  };
  className?: string;
}

export function PageHeader({ icon, title, subtitle, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
            {badge && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                badge.variant === 'success' ? 'bg-green-100 text-green-800' : 
                badge.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
