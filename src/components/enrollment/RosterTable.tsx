import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Download,
  Edit,
  Trash2,
  Users,
  Calendar,
  MapPin
} from "lucide-react";

interface StudentRoster {
  id: string;
  roster_name: string;
  course_name: string;
  location_id: string;
  instructor_id: string;
  max_capacity: number;
  current_enrollment: number;
  roster_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  scheduled_start_date: string;
  scheduled_end_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  locations?: {
    name: string;
    city: string;
    state: string;
  };
  profiles?: {
    display_name: string;
  };
}

interface RosterTableProps {
  rosters: StudentRoster[];
  isLoading?: boolean;
  onEdit?: (roster: StudentRoster) => void;
  onDelete?: (rosterId: string) => void;
  onExport?: (rosterId: string) => void;
}

export function RosterTable({ 
  rosters, 
  isLoading = false, 
  onEdit, 
  onDelete, 
  onExport 
}: RosterTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'DRAFT': return 'outline';
      case 'ARCHIVED': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600';
      case 'COMPLETED': return 'text-blue-600';
      case 'DRAFT': return 'text-yellow-600';
      case 'ARCHIVED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Rosters...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rosters.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Rosters Found</h3>
          <p className="text-muted-foreground">
            No rosters match your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rosters ({rosters.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roster Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rosters.map((roster) => (
                <TableRow key={roster.id}>
                  <TableCell className="font-medium">
                    {roster.roster_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {roster.course_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {roster.locations ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{roster.locations.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {roster.locations.city}, {roster.locations.state}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {roster.profiles?.display_name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {roster.current_enrollment} / {roster.max_capacity}
                      </span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((roster.current_enrollment / roster.max_capacity) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(roster.roster_status)}
                      className={getStatusColor(roster.roster_status)}
                    >
                      {roster.roster_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(roster.scheduled_start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onExport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onExport(roster.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(roster)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(roster.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}