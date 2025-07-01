
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutRouter } from '@/components/LayoutRouter';
import { AppRoutes } from './AppRoutes';
import { useEffect } from 'react';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        return failureCount < 3;
      },
    },
  },
});

function App() {
  useEffect(() => {
    // Basic app initialization tracking
    console.log('🔧 App initialized');
    
    return () => {
      console.log('🔧 App cleanup');
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <SidebarProvider>
              <LayoutRouter>
                <AppRoutes />
              </LayoutRouter>
            </SidebarProvider>
            <Toaster position="top-right" />
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
