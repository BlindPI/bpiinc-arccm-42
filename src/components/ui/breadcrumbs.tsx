import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Define page metadata for context-aware UI
export const PAGE_METADATA = {
  "/": {
    title: "Dashboard",
    section: "Core Features",
    icon: "Home",
    description: "Overview of your certificates and activities"
  },
  "/certifications": {
    title: "Certifications",
    section: "Core Features",
    icon: "ScrollText",
    description: "Manage and view your certifications"
  },
  "/verification": {
    title: "Certificate Verification",
    section: "Core Features",
    icon: "CheckCircle",
    description: "Verify certificate authenticity"
  },
  "/certificate-analytics": {
    title: "Certificate Analytics",
    section: "Administration",
    icon: "BarChart2",
    description: "Analytics and insights for certificates"
  },
  "/courses": {
    title: "Courses",
    section: "Administration",
    icon: "GraduationCap",
    description: "Manage training courses"
  },
  "/progression-paths": {
    title: "Progression Paths",
    section: "Administration",
    icon: "GitBranch",
    description: "Define and manage career progression paths"
  },
  "/locations": {
    title: "Locations",
    section: "Administration",
    icon: "MapPin",
    description: "Manage training locations"
  },
  "/user-management": {
    title: "Users",
    section: "Administration",
    icon: "Users",
    description: "Manage system users"
  },
  "/role-management": {
    title: "Role Management",
    section: "Administration",
    icon: "Building",
    description: "Manage user roles and permissions"
  },
  "/supervision": {
    title: "My Team",
    section: "User",
    icon: "UserPlus",
    description: "Manage and supervise your team"
  },
  "/profile": {
    title: "Profile",
    section: "User",
    icon: "User",
    description: "Manage your profile information"
  },
  "/settings": {
    title: "Settings",
    section: "User",
    icon: "Settings",
    description: "Configure application settings"
  }
};

interface BreadcrumbsProps {
  currentPath: string;
}

export function Breadcrumbs({ currentPath }: BreadcrumbsProps) {
  // Skip breadcrumbs for dashboard
  if (currentPath === "/") return null;
  
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const metadata = PAGE_METADATA[path] || { title: segment.charAt(0).toUpperCase() + segment.slice(1) };
    
    return {
      path,
      label: metadata.title
    };
  });
  
  // Add home as first breadcrumb
  breadcrumbs.unshift({ path: '/', label: 'Home' });
  
  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && <ChevronRight className="h-3 w-3 mx-2" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-700">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-blue-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}