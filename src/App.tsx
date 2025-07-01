
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutRouter } from "@/components/LayoutRouter";

// Import pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import ComplianceAdminDashboard from "./pages/ComplianceAdminDashboard";
import UserManagement from "./pages/UserManagement";
import SystemUserManagement from "./pages/SystemUserManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LayoutRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/compliance-dashboard/admin" element={<ComplianceAdminDashboard />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/system-user-management" element={<SystemUserManagement />} />
              </Routes>
            </LayoutRouter>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
