
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import AppRoutes from './AppRoutes';
import { StrictMode } from 'react';
import { RealtimeProvider } from './contexts/RealtimeContext';

// Configure query client with improved defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true, // Enable refetch when window gains focus
      staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10, // Cache garbage collection after 10 minutes
      refetchOnMount: 'always',
    },
  },
});

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Router>
            <AuthProvider>
              <RealtimeProvider>
                <AppRoutes />
                <Toaster />
              </RealtimeProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

export default App;
