
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Unlock } from "lucide-react";
import { ROLE_LABELS, UserRole } from "@/lib/roles";

// Define mocked permissions for visualization
const ROLE_PERMISSIONS: { [key in UserRole]: string[] } = {
  SA: [
    "Manage all users/roles",
    "Platform/system settings",
    "Issue/revoke certificates",
    "Access audit logs"
  ],
  AD: [
    "Manage users/roles (org)",
    "Approve certificate requests",
    "View compliance dashboard"
  ],
  AP: [
    "Supervise instructors",
    "Submit evaluations",
    "Manage course offerings"
  ],
  IC: [
    "Teach certified courses",
    "Request upgrades",
    "View own progress"
  ],
  IP: [
    "Teach basic courses",
    "Request supervision",
    "View progress"
  ],
  IT: [
    "Participate in training",
    "Request supervisor",
    "View own profile"
  ],
};

export function RolePermissionsSummary() {
  const ROLE_ORDER: UserRole[] = ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'];
  const roleColors: { [key in UserRole]: string } = {
    SA: "bg-red-100 text-red-700",
    AD: "bg-purple-100 text-purple-700",
    AP: "bg-blue-100 text-blue-700",
    IC: "bg-green-100 text-green-700",
    IP: "bg-amber-100 text-amber-700",
    IT: "bg-gray-100 text-gray-700",
  };

  return (
    <Card className="mt-4 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Role Permissions Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {ROLE_ORDER.map((role) => (
            <div
              key={role}
              className={`rounded-lg p-4 border ${roleColors[role]} flex flex-col gap-2 shadow-sm`}
            >
              <div className="flex items-center gap-2 font-semibold">
                <span className="uppercase text-xs font-bold">{role}</span>
                <span>{ROLE_LABELS[role]}</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[15px]">
                {ROLE_PERMISSIONS[role].map((perm) => (
                  <li key={perm}>{perm}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
