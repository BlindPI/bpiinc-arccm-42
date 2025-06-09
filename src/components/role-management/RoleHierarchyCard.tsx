
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, ROLE_HIERARCHY, UserRole } from "@/lib/roles";
import { Shield } from "lucide-react";

interface RoleHierarchyCardProps {
  currentRole: UserRole;
}

export function RoleHierarchyCard({ currentRole }: RoleHierarchyCardProps) {
  const getHigherRoles = (role: UserRole): UserRole[] => {
    return Object.entries(ROLE_HIERARCHY)
      .filter(([_, subordinates]) => subordinates.includes(role))
      .map(([higherRole]) => higherRole as UserRole);
  };

  const getLowerRoles = (role: UserRole): UserRole[] => {
    return ROLE_HIERARCHY[role] || [];
  };

  const higherRoles = getHigherRoles(currentRole);
  const lowerRoles = getLowerRoles(currentRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Role Hierarchy
        </CardTitle>
        <CardDescription>
          Understanding your role in the organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {higherRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Reports to:</h4>
              <div className="space-y-1">
                {higherRoles.map((role) => (
                  <div key={role} className="text-sm font-medium">
                    {ROLE_LABELS[role]}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Role:</h4>
            <div className="text-sm font-medium">{ROLE_LABELS[currentRole]}</div>
          </div>

          {lowerRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Can manage:</h4>
              <div className="space-y-1">
                {lowerRoles.map((role) => (
                  <div key={role} className="text-sm font-medium">
                    {ROLE_LABELS[role]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
