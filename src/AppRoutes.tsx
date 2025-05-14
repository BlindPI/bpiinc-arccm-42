import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import UserManagementPage from "./pages/UserManagement";
import RoleManagementPage from "./pages/RoleManagement";
import CoursesPage from "./pages/Courses";
import LocationsPage from "./pages/Locations";
import CertificatesPage from "./pages/Certifications";
import LoginPage from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import React from "react";
import CertificateAnalyticsPage from "./pages/CertificateAnalytics";

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/user-management"
          element={
            <RequireAuth>
              <UserManagementPage />
            </RequireAuth>
          }
        />
        <Route
          path="/role-management"
          element={
            <RequireAuth>
              <RoleManagementPage />
            </RequireAuth>
          }
        />
        <Route
          path="/courses"
          element={
            <RequireAuth>
              <CoursesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/locations"
          element={
            <RequireAuth>
              <LocationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/certifications"
          element={
            <RequireAuth>
              <CertificatesPage />
            </RequireAuth>
          }
        />
         <Route
            path="/analytics"
            element={
              <RequireAuth>
                <CertificateAnalyticsPage />
              </RequireAuth>
            }
          />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    )
  );

  return router;
};

export default AppRoutes;
