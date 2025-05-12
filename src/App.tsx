
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { BatchCertificateProvider } from '@/components/certificates/batch-upload/BatchCertificateContext';
import { Dashboard } from '@/pages/Dashboard';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CertificatesPage } from '@/pages/CertificatesPage';
import { BatchUploadPage } from '@/pages/BatchUploadPage';
import { UsersPage } from '@/pages/UsersPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { RostersPage } from '@/pages/RostersPage';
import { RosterDetailPage } from '@/pages/RosterDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <BrowserRouter>
            <BatchCertificateProvider>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                </Route>

                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/certificates/upload" element={<BatchUploadPage />} />
                  <Route path="/rosters" element={<RostersPage />} />
                  <Route path="/rosters/:rosterId" element={<RosterDetailPage />} />
                </Route>

                <Route element={<ProtectedRoute requiresAdmin><AdminLayout /></ProtectedRoute>}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <Toaster richColors position="top-center" />
            </BatchCertificateProvider>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
