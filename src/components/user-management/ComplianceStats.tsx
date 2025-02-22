
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, Users } from "lucide-react";

interface ComplianceStatsProps {
  totalUsers: number;
  compliantUsers: number;
  nonCompliantUsers: number;
}

export function ComplianceStats({
  totalUsers,
  compliantUsers,
  nonCompliantUsers,
}: ComplianceStatsProps) {
  const complianceRate = totalUsers > 0 ? Math.round((compliantUsers / totalUsers) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliant Users</CardTitle>
          <Shield className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{compliantUsers}</div>
          <p className="text-xs text-muted-foreground">
            {complianceRate}% compliance rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Non-Compliant Users</CardTitle>
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{nonCompliantUsers}</div>
        </CardContent>
      </Card>
    </div>
  );
}
