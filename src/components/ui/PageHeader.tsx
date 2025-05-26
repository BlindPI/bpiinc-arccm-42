
import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
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
