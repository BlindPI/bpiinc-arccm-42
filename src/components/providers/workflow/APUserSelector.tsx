
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Mail, Phone, Building } from 'lucide-react';

interface APUser {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  created_at: string;
}

interface APUserSelectorProps {
  selectedUserId?: string;
  onSelect: (userId: string) => void;
}

export function APUserSelector({ selectedUserId, onSelect }: APUserSelectorProps) {
  const { data: apUsers = [], isLoading } = useQuery({
    queryKey: ['ap-users-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data as APUser[];
    }
  });

  const { data: assignedUsers = [] } = useQuery({
    queryKey: ['ap-users-assigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ap_user_location_assignments')
        .select('ap_user_id')
        .eq('status', 'active');
      
      if (error) throw error;
      return data.map(a => a.ap_user_id);
    }
  });

  const availableUsers = apUsers.filter(user => !assignedUsers.includes(user.id));
  const assignedUsersList = apUsers.filter(user => assignedUsers.includes(user.id));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading AP users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select an Authorized Provider User</h3>
        <p className="text-muted-foreground">
          Choose an AP user who will be assigned as the authorized provider for a location.
        </p>
      </div>

      {/* Available Users */}
      <div className="space-y-4">
        <h4 className="font-medium text-green-700 flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Available AP Users ({availableUsers.length})
        </h4>
        
        {availableUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available AP users found</p>
              <p className="text-sm">All AP users may already be assigned to locations</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {availableUsers.map((user) => (
              <Card
                key={user.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedUserId === user.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(user.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{user.display_name}</h4>
                          <Badge variant="secondary">Authorized Provider</Badge>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 text-sm text-muted-foreground ml-13">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        
                        {user.organization && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>{user.organization}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedUserId === user.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Already Assigned Users (for reference) */}
      {assignedUsersList.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-amber-700 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Already Assigned AP Users ({assignedUsersList.length})
          </h4>
          
          <div className="grid gap-2">
            {assignedUsersList.map((user) => (
              <Card key={user.id} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline">Assigned</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
