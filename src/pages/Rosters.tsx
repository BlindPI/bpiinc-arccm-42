
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Users, 
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/ui/PageHeader';

export default function Rosters() {
  const { data: profile } = useProfile();

  const canManageRosters = profile?.role && ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'].includes(profile.role);

  if (!canManageRosters) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to access roster management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="h-7 w-7 text-primary" />}
        title="Roster Management"
        subtitle="Manage course rosters and student lists"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Roster
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Roster
            </Button>
          </div>
        }
      />

      {/* Recent Rosters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Rosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "CPR Level C - January 2025",
                course: "CPR Level C",
                date: "2025-01-15",
                students: 24,
                status: "Active"
              },
              {
                name: "First Aid Basic - December 2024",
                course: "First Aid Basic",
                date: "2024-12-20",
                students: 18,
                status: "Completed"
              },
              {
                name: "CPR HCP - November 2024",
                course: "CPR HCP",
                date: "2024-11-28",
                students: 16,
                status: "Completed"
              }
            ].map((roster, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">{roster.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {roster.course} • {new Date(roster.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">{roster.students}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                  <Badge variant={roster.status === "Active" ? "default" : "secondary"}>
                    {roster.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roster Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Total Rosters</span>
            </div>
            <div className="text-2xl font-bold mt-2">24</div>
            <div className="text-sm text-muted-foreground">This year</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="font-medium">Total Students</span>
            </div>
            <div className="text-2xl font-bold mt-2">486</div>
            <div className="text-sm text-muted-foreground">Across all rosters</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Active Rosters</span>
            </div>
            <div className="text-2xl font-bold mt-2">3</div>
            <div className="text-sm text-muted-foreground">Currently running</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
