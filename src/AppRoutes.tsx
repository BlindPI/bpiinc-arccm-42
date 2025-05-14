
import React from "react";
import {
  Navigate,
  Routes,
  Route,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Import the missing components
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import UserManagementPage from "./pages/UserManagement";
import RoleManagementPage from "./pages/RoleManagement";
import CoursesPage from "./pages/Courses";
import LocationsPage from "./pages/Locations";
import CertificatesPage from "./pages/Certifications";
import LoginPage from "./pages/Login";
import CertificateAnalyticsPage from "./pages/CertificateAnalytics";

const AppRoutes = () => {
  const { user, loading } = useAuth(); // Use user property instead of isLoggedIn
  
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    return !loading && user ? <>{children}</> : <Navigate to="/login" />;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        {
          path: "/",
          element: (
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          ),
        },
        {
          path: "/user-management",
          element: (
            <RequireAuth>
              <UserManagementPage />
            </RequireAuth>
          ),
        },
        {
          path: "/role-management",
          element: (
            <RequireAuth>
              <RoleManagementPage />
            </RequireAuth>
          ),
        },
        {
          path: "/courses",
          element: (
            <RequireAuth>
              <CoursesPage />
            </RequireAuth>
          ),
        },
        {
          path: "/locations",
          element: (
            <RequireAuth>
              <LocationsPage />
            </RequireAuth>
          ),
        },
        {
          path: "/certifications",
          element: (
            <RequireAuth>
              <CertificatesPage />
            </RequireAuth>
          ),
        },
        {
          path: "/analytics",
          element: (
            <RequireAuth>
              <CertificateAnalyticsPage />
            </RequireAuth>
          ),
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRoutes;
