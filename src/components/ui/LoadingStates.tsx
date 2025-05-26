
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export const InlineLoader: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size];

  return (
    <div className="flex items-center justify-center space-x-2 p-4">
      <Loader2 className={`${iconSize} animate-spin text-primary`} />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-20 w-full" />
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);
