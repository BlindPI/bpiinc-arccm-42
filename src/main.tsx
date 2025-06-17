
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppRoutes } from "./AppRoutes.tsx";
import "./index.css";

// Import team diagnostics for debugging (development only)
if (import.meta.env.DEV) {
  import('./utils/runTeamDiagnostics').then(module => {
    console.log('🔧 Team diagnostics loaded. Run runTeamDiagnostics() in console to test database connectivity.');
  }).catch(err => {
    console.warn('Could not load team diagnostics:', err);
  });

  // Import database schema diagnostics
  import('./utils/debugDatabaseSchema.js').then(module => {
    console.log('🔍 Database schema diagnostics loaded. Run debugDatabaseSchema() in console to test schema.');
  }).catch(err => {
    console.warn('Could not load database schema diagnostics:', err);
  });

  // Import provider certificate diagnostics
  import('./utils/simpleProviderDebug.js').then(module => {
    console.log('🔍 Provider certificate diagnostics loaded. Run debugProviderCertificates() in console to test provider setup.');
  }).catch(err => {
    console.warn('Could not load provider certificate diagnostics:', err);
  });
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
