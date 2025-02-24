
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import RoleManagement from './pages/RoleManagement';
import Certifications from './pages/Certifications';
import UserManagement from './pages/UserManagement';
import Courses from './pages/Courses';
import Teams from './pages/Teams';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/role-management" element={<RoleManagement />} />
      <Route path="/certifications" element={<Certifications />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
