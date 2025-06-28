
import React from 'react';
import { cn } from '@/lib/utils';

interface FlexLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'base' | 'lg';
  className?: string;
}

export function FlexLayout({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'base',
  className
}: FlexLayoutProps) {
  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col'
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapStyles = {
    sm: 'gap-2',
    base: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      'flex',
      directionStyles[direction],
      alignStyles[align],
      justifyStyles[justify],
      wrap && 'flex-wrap',
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}
