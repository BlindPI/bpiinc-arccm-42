
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';
  
  const variantStyles = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

interface SpinnerProps {
  size?: 'sm' | 'base' | 'lg';
  color?: string;
}

export function Spinner({ size = 'base', color = 'text-blue-600' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4',
    base: 'h-6 w-6', 
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeStyles[size]} ${color}`} />
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'base' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'critical';
  showLabel?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'base',
  color = 'primary',
  showLabel = false 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeStyles = {
    sm: 'h-1',
    base: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    critical: 'bg-red-600',
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeStyles[size]}`}>
        <div 
          className={`${colorStyles[color]} ${sizeStyles[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
