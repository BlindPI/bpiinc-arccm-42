
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '../../tokens';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function EnhancedButton({
  variant = 'primary',
  size = 'base',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: EnhancedButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantStyles = {
    primary: `
      bg-blue-600 text-white border border-transparent
      hover:bg-blue-700 focus:ring-blue-500
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-300
      hover:bg-gray-50 focus:ring-blue-500
      shadow-sm hover:shadow-md
    `,
    ghost: `
      bg-transparent text-gray-700 border border-transparent
      hover:bg-gray-100 focus:ring-blue-500
    `,
    destructive: `
      bg-red-600 text-white border border-transparent
      hover:bg-red-700 focus:ring-red-500
      shadow-sm hover:shadow-md
    `,
    success: `
      bg-green-600 text-white border border-transparent
      hover:bg-green-700 focus:ring-green-500
      shadow-sm hover:shadow-md
    `,
    warning: `
      bg-yellow-600 text-white border border-transparent
      hover:bg-yellow-700 focus:ring-yellow-500
      shadow-sm hover:shadow-md
    `,
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    base: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const iconSize = {
    sm: 'h-4 w-4',
    base: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSize[size]}`} />
          Loading...
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={iconSize[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={iconSize[size]} />}
        </>
      )}
    </button>
  );
}
