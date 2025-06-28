
import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'base' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'base' | 'lg';
  className?: string;
}

export function Container({ 
  children, 
  size = 'xl', 
  padding = 'base',
  className 
}: ContainerProps) {
  const sizeStyles = {
    sm: 'max-w-2xl',
    base: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingStyles = {
    none: '',
    sm: 'px-4',
    base: 'px-6',
    lg: 'px-8'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      sizeStyles[size],
      paddingStyles[padding],
      className
    )}>
      {children}
    </div>
  );
}
