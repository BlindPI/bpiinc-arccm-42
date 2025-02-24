
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserCog } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";

export const UserSupervisionView = () => {
  const { data: currentUserProfile } = useProfile();

  // Fetch user's supervision relationships (both as supervisor and supervisee)
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['user-supervision-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_supervision_relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const supervisingRelationships = relationships?.filter(
    rel => rel.supervisor_id === currentUserProfile?.id
  ) || [];

  const supervisedByRelationships = relationships?.filter(
    rel => rel.supervisee_id === currentUserProfile?.id
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          My Supervision Relationships
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* People I supervise */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">People I Supervise</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisingRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    You are not supervising anyone at the moment.
                  </TableCell>
                </TableRow>
              ) : (
                supervisingRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>{relationship.supervisee_name}</TableCell>
                    <TableCell>{relationship.supervisee_role}</TableCell>
                    <TableCell>
                      <Badge variant={relationship.status === "ACTIVE" ? "default" : "secondary"}>
                        {relationship.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(relationship.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* My Supervisors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">My Supervisors</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisedByRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    You don't have any supervisors at the moment.
                  </TableCell>
                </TableRow>
              ) : (
                supervisedByRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell>{relationship.supervisor_name}</TableCell>
                    <TableCell>{relationship.supervisor_role}</TableCell>
                    <TableCell>
                      <Badge variant={relationship.status === "ACTIVE" ? "default" : "secondary"}>
                        {relationship.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(relationship.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
