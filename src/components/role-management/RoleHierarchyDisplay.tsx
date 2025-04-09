
import { UserRole } from "@/types/auth";
import { ROLE_LABELS, ROLE_HIERARCHY } from "@/lib/roles";
import { RoleDisplay } from "./RoleDisplay";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleHierarchyDisplayProps {
  currentRole?: UserRole;
  showTitle?: boolean;
}

export function RoleHierarchyDisplay({ currentRole, showTitle = true }: RoleHierarchyDisplayProps) {
  // Define the role progression
  const roleProgression: UserRole[] = ['IT', 'IP', 'IC', 'AP', 'AD', 'SA'];
  
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Progression of roles from Instructor In Training to System Admin
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 py-2">
          {roleProgression.map((role, index) => (
            <div key={role} className="flex items-center">
              <div className={`relative ${currentRole === role ? 'scale-110 transform' : ''}`}>
                <RoleDisplay 
                  role={role} 
                  showLabel={true} 
                  size="md"
                  showTooltip={true}
                />
                {currentRole === role && (
                  <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                    <div className="h-1 w-1 bg-primary rounded-full"></div>
                  </div>
                )}
              </div>
              
              {index < roleProgression.length - 1 && (
                <ChevronRight className="mx-1 text-muted-foreground h-4 w-4" />
              )}
            </div>
          ))}
        </div>
        
        {currentRole && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Your current role: <span className="font-medium text-foreground">{ROLE_LABELS[currentRole]}</span></p>
            <p className="mt-2">Requirements to advance:</p>
            {currentRole !== 'SA' && (
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Complete required training hours</li>
                <li>Submit necessary documentation</li>
                <li>Receive supervisor evaluations</li>
                <li>Meet time-in-role requirement</li>
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
