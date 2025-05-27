
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import UserManagementPage from '@/pages/UserManagementPage';
import Certifications from '@/pages/Certifications';
import Courses from '@/pages/Courses';
import Settings from '@/pages/Settings';
import AcceptInvitation from '@/pages/AcceptInvitation';
import CertificateVerification from '@/pages/CertificateVerification';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<SignIn />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/verify" element={<CertificateVerification />} />
            <Route path="/" element={<Layout />}>
              <Route 
                index 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute>
                    <UserManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="certificates" 
                element={
                  <ProtectedRoute>
                    <Certifications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="courses" 
                element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </AuthProvider>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
