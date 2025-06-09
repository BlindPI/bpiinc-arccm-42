
import { UserRole } from "@/types/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { RoleDisplay } from "./RoleDisplay";
import { ChevronRight, CheckCircle2, Circle, Users, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleHierarchyDisplayProps {
  currentRole?: UserRole;
  showTitle?: boolean;
}

const ROLE_ORDER: UserRole[] = ['ST', 'IN', 'IT', 'IP', 'IC', 'TL', 'AP', 'AD', 'SA'];

const ROLE_DETAILS: Record<UserRole, { description: string; color: string }> = {
  ST: { description: "Student. Entry-level participant role.", color: "bg-gray-50" },
  IN: { description: "Instructor New. Entry-level new instructor role.", color: "bg-gray-100" },
  IT: { description: "Instructor Training. Entry-level training role.", color: "bg-gray-100" },
  IP: { description: "Provisional Instructor. Basic teaching rights.", color: "bg-amber-100" },
  IC: { description: "Certified Instructor. Full instructor status.", color: "bg-green-100" },
  TL: { description: "Team Leader. Manages teams and coordinates activities.", color: "bg-blue-100" },
  AP: { description: "Authorized Provider. Manages training locations and oversees instructors.", color: "bg-blue-100" },
  AD: { description: "Administrator. Full system administration rights.", color: "bg-purple-100" },
  SA: { description: "System Admin. Complete system control and oversight.", color: "bg-red-100" },
};

export function RoleHierarchyDisplay({ currentRole, showTitle = true }: RoleHierarchyDisplayProps) {
  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Hierarchy
          </CardTitle>
          <CardDescription>
            Progression path through the instructor certification system
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col space-y-3">
          {ROLE_ORDER.map((role, index) => {
            const isCurrentRole = currentRole === role;
            const isPastRole = currentRole && ROLE_ORDER.indexOf(currentRole) > index;
            const isFutureRole = currentRole && ROLE_ORDER.indexOf(currentRole) < index;
            
            return (
              <TooltipProvider key={role}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all
                      ${isCurrentRole ? 'border-primary bg-primary/5 shadow-sm' : ''}
                      ${isPastRole ? 'border-green-200 bg-green-50' : ''}
                      ${isFutureRole ? 'border-gray-200 bg-gray-50' : ''}
                      ${!currentRole ? 'border-gray-200 hover:border-gray-300' : ''}
                    `}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isPastRole && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                        {isCurrentRole && <Circle className="h-4 w-4 text-primary flex-shrink-0" />}
                        {isFutureRole && <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        {!currentRole && <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        
                        <RoleDisplay 
                          role={role} 
                          showLabel={true} 
                          size="md" 
                          showTooltip={false}
                        />
                        
                        <div className="flex items-center gap-2 ml-auto">
                          {role === 'AP' && <Users className="h-4 w-4 text-blue-600" />}
                          {['AD', 'SA'].includes(role) && <ShieldCheck className="h-4 w-4 text-purple-600" />}
                          {role === 'SA' && <ShieldAlert className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                      
                      {index < ROLE_ORDER.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{ROLE_LABELS[role]}</p>
                      <p className="text-sm text-muted-foreground">
                        {ROLE_DETAILS[role].description}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        {currentRole && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current Position:</strong> {ROLE_LABELS[currentRole]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ROLE_DETAILS[currentRole].description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
