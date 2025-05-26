import React from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

interface SectionTabsProps {
  currentPath: string;
}

export function SectionTabs({ currentPath }: SectionTabsProps) {
  // Define section tabs based on current path
  const getSectionTabs = () => {
    if (currentPath.startsWith("/certifications") || 
        currentPath === "/verification" || 
        currentPath === "/certificate-analytics") {
      return [
        { label: "My Certificates", path: "/certifications" },
        { label: "Verification", path: "/verification" },
        { label: "Analytics", path: "/certificate-analytics", adminOnly: true }
      ];
    }
    
    if (currentPath.startsWith("/user-management") || 
        currentPath === "/role-management" || 
        currentPath === "/supervision") {
      return [
        { label: "Users", path: "/user-management" },
        { label: "Roles", path: "/role-management" },
        { label: "My Team", path: "/supervision" }
      ];
    }
    
    return [];
  };
  
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const tabs = getSectionTabs().filter(tab => !tab.adminOnly || isAdmin);
  
  if (tabs.length <= 1) return null;
  
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`py-2 px-4 text-sm font-medium ${
            currentPath === tab.path
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}