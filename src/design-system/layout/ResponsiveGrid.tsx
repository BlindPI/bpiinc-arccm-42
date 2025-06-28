
import React from 'react';
import { cn } from '@/lib/utils';

interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'base' | 'lg';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  columns = 12, 
  gap = 'base',
  className 
}: GridProps) {
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-1 md:grid-cols-6 lg:grid-cols-12'
  };

  const gapStyles = {
    sm: 'gap-4',
    base: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={cn(
      'grid',
      columnStyles[columns],
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}

interface GridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  spanMd?: 1 | 2 | 3 | 4 | 6 | 12;
  spanLg?: 1 | 2 | 3 | 4 | 6 | 12;
  className?: string;
}

export function GridItem({ 
  children, 
  span = 1, 
  spanMd, 
  spanLg,
  className 
}: GridItemProps) {
  const spanStyles = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    6: 'col-span-6',
    12: 'col-span-12'
  };

  return (
    <div className={cn(
      spanStyles[span],
      spanMd && `md:${spanStyles[spanMd]}`,
      spanLg && `lg:${spanStyles[spanLg]}`,
      className
    )}>
      {children}
    </div>
  );
}
