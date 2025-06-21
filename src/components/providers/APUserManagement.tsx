
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  Users,
  Settings
} from 'lucide-react';

interface APUser {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  created_at: string;
}

interface APUserAssignment {
  location: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  assignment_role: string;
  status: string;
  assigned_at: string;
}

export function APUserManagement() {
  const { data: apUsers = [], isLoading } = useQuery({
    queryKey: ['ap-users-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'AP')
        .order('display_name');
      
      if (error) throw error;
      return data as APUser[];
    }
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['ap-user-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          ap_user_id,
          assignment_role,
          status,
          assigned_at,
          location:locations(id, name, city, state)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  const getUserAssignments = (userId: string): APUserAssignment[] => {
    return assignments
      .filter(a => a.ap_user_id === userId)
      .map(a => ({
        location: a.location,
        assignment_role: a.assignment_role,
        status: a.status,
        assigned_at: a.assigned_at
      }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading AP users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AP User Management</h2>
          <p className="text-muted-foreground">
            Manage Authorized Provider users and their location assignments
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {apUsers.map((user) => {
          const userAssignments = getUserAssignments(user.id);
          const isAssigned = userAssignments.length > 0;

          return (
            <Card key={user.id} className={isAssigned ? 'border-green-200' : 'border-amber-200'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isAssigned ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      <UserCheck className={`h-5 w-5 ${
                        isAssigned ? 'text-green-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold">{user.display_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">Authorized Provider</Badge>
                        <Badge variant={isAssigned ? 'default' : 'outline'}>
                          {isAssigned ? 'Assigned' : 'Unassigned'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  
                  {user.organization && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.organization}</span>
                    </div>
                  )}
                </div>

                {/* Assignments */}
                {userAssignments.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location Assignments ({userAssignments.length})
                    </h4>
                    <div className="space-y-2">
                      {userAssignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{assignment.location.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {[assignment.location.city, assignment.location.state]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {assignment.assignment_role}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Since {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No location assignments</p>
                    <p className="text-sm">This AP user has not been assigned to any locations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {apUsers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">No AP Users Found</h3>
            <p>No users with the Authorized Provider role were found in the system.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
