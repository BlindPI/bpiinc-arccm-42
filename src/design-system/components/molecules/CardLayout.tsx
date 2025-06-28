
import React from 'react';

interface CardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'base' | 'lg';
  shadow?: 'none' | 'sm' | 'base' | 'lg';
}

export function CardLayout({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'base',
  shadow = 'base',
}: CardLayoutProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    base: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200
      ${shadowStyles[shadow]}
      ${className}
    `}>
      {(title || subtitle || actions) && (
        <div className={`
          border-b border-gray-200 flex items-center justify-between
          ${paddingStyles[padding]}
        `}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className={paddingStyles[padding]}>
        {children}
      </div>
    </div>
  );
}
