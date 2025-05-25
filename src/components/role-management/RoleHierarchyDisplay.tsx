
import { UserRole } from "@/types/auth";
import { ROLE_LABELS, ROLE_HIERARCHY } from "@/lib/roles";
import { RoleDisplay } from "./RoleDisplay";
import { ChevronRight, CheckCircle2, Circle, Users, Lock, Unlock, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleHierarchyDisplayProps {
  currentRole?: UserRole;
  showTitle?: boolean;
}

const ROLE_ORDER: UserRole[] = ['IN', 'IT', 'IP', 'IC', 'AP', 'AD', 'SA'];

// Define role requirements/descriptions for tooltips
const ROLE_DETAILS: { [key in UserRole]: { description: string; color: string } } = {
  IN:     { description: "Instructor New. Entry-level new instructor role.", color: "bg-gray-50" },
  IT:     { description: "Instructor Trainee. Entry-level training role.", color: "bg-gray-100" },
  IP:     { description: "Provisional Instructor. Basic teaching rights.", color: "bg-amber-100" },
  IC:     { description: "Certified Instructor. Full instructor status.", color: "bg-green-100" },
  AP:     { description: "Authorized Provider. Can supervise instructors.", color: "bg-blue-100" },
  AD:     { description: "Administrator. Manages users/roles for org.", color: "bg-purple-100" },
  SA:     { description: "System Admin. Full global platform access.", color: "bg-red-100" },
};

export function RoleHierarchyDisplay({ currentRole, showTitle = true }: RoleHierarchyDisplayProps) {
  // Find index of current role
  const currentIdx = currentRole ? ROLE_ORDER.indexOf(currentRole) : -1;

  return (
    <Card className="mb-2 shadow-lg border overflow-visible animate-fade-in">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Role Hierarchy</span>
          </CardTitle>
          <CardDescription>
            Progression from Instructor New <ChevronRight className="inline mx-1" /> System Admin
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-row items-center justify-center gap-1 flex-wrap animate-fade-in">
          {ROLE_ORDER.map((role, idx) => {
            const active = currentRole === role;
            const completed = currentIdx > idx;
            return (
              <div key={role} className="relative flex flex-col items-center group min-w-[90px]">
                {/* Step circle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          flex items-center justify-center rounded-full border-2 transition-all
                          ${active ? "border-primary bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg scale-110 ring-2 ring-primary/30" : ""}
                          ${completed ? "border-green-400 bg-green-50" : ""}
                          ${!active && !completed ? "border-gray-200 bg-white" : ""}
                          h-12 w-12 mb-1 hover:scale-105 duration-150
                        `}
                      >
                        {completed ? (
                          <CheckCircle2 className="text-green-600 h-7 w-7" />
                        ) : (
                          <RoleDisplay role={role} showLabel={false} size="lg" showTooltip={false} />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="font-semibold">{ROLE_LABELS[role]}</span>
                      <div className="text-xs text-muted-foreground mt-1">{ROLE_DETAILS[role].description}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Label and highlight */}
                <span
                  className={`
                    mt-1 text-xs font-semibold ${active ? "text-primary" : "text-gray-500"}
                    transition-colors duration-100
                  `}
                >
                  {ROLE_LABELS[role]}
                </span>
                {/* Current */}
                {active && (
                  <div className="absolute -bottom-7 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="animate-pulse text-xs px-2 py-0.5 rounded bg-gradient-to-r from-blue-400 to-purple-400 text-white font-medium shadow">
                      Current
                    </span>
                  </div>
                )}
                {/* Step line */}
                {idx < ROLE_ORDER.length - 1 && (
                  <span className={`absolute top-1/2 right-[-42px] w-[56px] h-1 ${completed ? "bg-green-400" : "bg-gray-200"} rounded-full transition-colors duration-200`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Requirements/Cheat-sheet */}
        {currentRole && (
          <div className="mt-7 bg-neutral-50 border rounded p-4">
            <div className="text-[15px] mb-1 text-gray-700">
              <span>Your current role:</span>{" "}
              <span className="font-bold text-foreground">{ROLE_LABELS[currentRole]}</span>
            </div>
            <div className="text-xs text-muted-foreground">To advance, you typically need:</div>
            {currentRole !== "SA" ? (
              <ul className="list-disc text-sm text-gray-700 pl-5 mt-1 leading-snug space-y-1">
                <li>Complete required teaching and supervision hours</li>
                <li>Submit all necessary documentation</li>
                <li>Receive supervisor evaluations</li>
                <li>Satisfy time-in-role requirements</li>
              </ul>
            ) : (
              <span className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Highest role reached
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
