
import React, { useState, useEffect, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retryDelay?: number;
  maxRetries?: number;
  onError?: (error: Error) => void;
  loadingMessage?: string;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  fallback,
  errorFallback,
  retryDelay = 1000,
  maxRetries = 3,
  onError,
  loadingMessage = "Loading..."
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setHasError(false);
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        // Trigger re-render
        setRetryCount(prev => prev);
      }, retryDelay);
    }
  };

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    </div>
  );

  const defaultErrorFallback = (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load content</span>
        {retryCount < maxRetries && (
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry ({maxRetries - retryCount} left)
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );

  if (hasError) {
    return errorFallback || defaultErrorFallback;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <ErrorBoundary 
        onError={(error) => {
          setHasError(true);
          onError?.(error);
        }}
        retryCount={retryCount}
      >
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
  retryCount: number;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.retryCount !== this.props.retryCount) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle error display
    }

    return this.props.children;
  }
}

// Lazy loading wrapper for heavy components
export const LazyWrapper: React.FC<{ 
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  props?: any;
  fallback?: React.ReactNode;
}> = ({ 
  loader, 
  props = {}, 
  fallback = <Skeleton className="h-64 w-full" /> 
}) => {
  const LazyComponent = React.lazy(loader);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};
