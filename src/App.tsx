
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/components/AuthProvider';
import { AppRoutes } from './AppRoutes';
import { PerformanceMonitor } from '@/services/performance/performanceMonitor';
import { useEffect } from 'react';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Track API failures
        PerformanceMonitor.trackMetric({
          metricName: 'api_failure',
          metricType: 'api_response',
          metricValue: failureCount,
          metadata: { error: error?.message }
        });
        return failureCount < 3;
      },
    },
  },
});

// Cleanup performance monitoring on app unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    PerformanceMonitor.cleanup();
  });
}

function App() {
  useEffect(() => {
    // Track app initialization
    PerformanceMonitor.trackUserAction('app_initialized');
    
    // Track route changes
    const handleRouteChange = () => {
      PerformanceMonitor.trackUserAction('route_change', {
        path: window.location.pathname
      });
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" />
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
