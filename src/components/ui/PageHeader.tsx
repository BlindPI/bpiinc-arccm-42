
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'info' | 'warning';
  };
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  badge,
  children,
  actions
}) => {
  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return variant as 'default' | 'secondary' | 'destructive' | 'outline';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
            {badge && (
              <Badge variant={getBadgeVariant(badge.variant)}>
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {(children || actions) && (
        <div className="flex-shrink-0">
          {actions || children}
        </div>
      )}
    </div>
  );
};
