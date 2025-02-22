
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Certifications from './pages/Certifications';
import Courses from './pages/Courses';
import RoleManagement from './pages/RoleManagement';
import Settings from './pages/Settings';
import Teams from './pages/Teams';
import UserManagement from './pages/UserManagement';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Index />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/certifications" element={<Certifications />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/role-management" element={<RoleManagement />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
