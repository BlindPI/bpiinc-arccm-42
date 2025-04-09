
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
import { UserRole } from "@/types/supabase-schema";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ActiveSupervisionRelationship } from "@/types/supabase-views";

interface SupervisionDisplayData extends ActiveSupervisionRelationship {
  completed_teaching_hours?: number;
  required_teaching_hours?: number;
  document_type?: string;
  document_status?: string;
  overall_compliance?: boolean;
}

export const UserSupervisionView = () => {
  const { data: currentUserProfile } = useProfile();

  const { data: relationships, isLoading } = useQuery({
    queryKey: ['supervision-relationships'],
    queryFn: async () => {
      // Using the raw query to get typed data from the view
      const { data, error } = await supabase
        .from('active_supervision_relationships')
        .select('*');

      if (error) throw error;
      
      // Add mock data for now - this would come from a real view in production
      const mockData = (data || []).map(rel => ({
        ...rel,
        completed_teaching_hours: Math.floor(Math.random() * 40),
        required_teaching_hours: 40,
        document_type: Math.random() > 0.5 ? "Teaching Certificate" : "First Aid Certificate",
        document_status: Math.random() > 0.7 ? "APPROVED" : "PENDING",
        overall_compliance: Math.random() > 0.3
      }));
      
      return mockData as SupervisionDisplayData[];
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

  const ProgressSection = ({ relationship }: { relationship: SupervisionDisplayData }) => (
    <div className="space-y-2 mt-2">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Teaching Progress</span>
          <span>{relationship.completed_teaching_hours || 0}/{relationship.required_teaching_hours || 0} hours</span>
        </div>
        <Progress 
          value={(relationship.completed_teaching_hours || 0) / (relationship.required_teaching_hours || 1) * 100} 
        />
      </div>
      {relationship.document_type && (
        <Badge 
          variant={relationship.document_status === 'APPROVED' ? 'default' : 'secondary'}
          className="mt-2"
        >
          {relationship.document_type}: {relationship.document_status}
        </Badge>
      )}
      <Badge 
        variant={relationship.overall_compliance ? 'default' : 'destructive'}
        className="mt-1"
      >
        {relationship.overall_compliance ? 'Compliant' : 'Non-compliant'}
      </Badge>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          My Supervision Relationships
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisedByRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                    <TableCell className="min-w-[200px]">
                      <ProgressSection relationship={relationship} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Separator />

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
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisingRelationships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                    <TableCell className="min-w-[200px]">
                      <ProgressSection relationship={relationship} />
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
