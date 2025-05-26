import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "../ui/button";
import { 
  List, 
  Plus, 
  Download, 
  UserPlus, 
  Upload, 
  FileText, 
  BarChart2, 
  Settings 
} from "lucide-react";

interface PageActionsProps {
  currentPath: string;
}

export function PageActions({ currentPath }: PageActionsProps) {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isInstructor = profile?.role && ['AP', 'IC', 'IP', 'IT'].includes(profile.role);
  
  // Define actions based on page and role
  const getActions = () => {
    switch (currentPath) {
      case "/certifications":
        return [
          { 
            label: "View All", 
            icon: <List className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: true 
          },
          { 
            label: "Create New", 
            icon: <Plus className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin || isInstructor 
          },
          { 
            label: "Export", 
            icon: <Download className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
      
      case "/certificate-analytics":
        return [
          { 
            label: "View Report", 
            icon: <FileText className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          },
          { 
            label: "Export Data", 
            icon: <Download className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
        
      case "/user-management":
        return [
          { 
            label: "Invite User", 
            icon: <UserPlus className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          },
          { 
            label: "Import", 
            icon: <Upload className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          },
          { 
            label: "Export", 
            icon: <Download className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
        
      case "/courses":
        return [
          { 
            label: "Add Course", 
            icon: <Plus className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          },
          { 
            label: "Export", 
            icon: <Download className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
        
      case "/locations":
        return [
          { 
            label: "Add Location", 
            icon: <Plus className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          },
          { 
            label: "Export", 
            icon: <Download className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
        
      case "/settings":
        return [
          { 
            label: "System Settings", 
            icon: <Settings className="h-4 w-4 mr-2" />, 
            action: () => {}, 
            visible: isAdmin 
          }
        ];
        
      // Add more page-specific actions
      default:
        return [];
    }
  };
  
  const actions = getActions().filter(action => action.visible);
  
  if (actions.length === 0) return null;
  
  return (
    <div className="flex gap-2 mb-6">
      {actions.map((action, index) => (
        <Button 
          key={index}
          variant="outline"
          size="sm"
          onClick={() => action.action()}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-gray-200"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}