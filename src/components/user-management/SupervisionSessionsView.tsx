
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { NewSessionDialog } from "./supervision/NewSessionDialog";
import { SupervisionMetrics } from "./supervision/SupervisionMetrics";
import { SessionsList } from "./supervision/SessionsList";

export const SupervisionSessionsView = () => {
  const { user } = useAuth();
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");

  const { data: relationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['active-supervision-relationships', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_supervision_relationships')
        .select('*')
        .or(`supervisor_id.eq.${user?.id},supervisee_id.eq.${user?.id}`);

      if (error) throw error;
      return data;
    },
  });

  if (isLoadingRelationships) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const selectedRelationshipData = relationships?.find(r => r.id === selectedRelationship);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervision Sessions</CardTitle>
        <CardDescription>
          Track and manage your supervision sessions
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Select
            value={selectedRelationship}
            onValueChange={setSelectedRelationship}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select supervision relationship" />
            </SelectTrigger>
            <SelectContent>
              {relationships?.map((relationship) => (
                <SelectItem
                  key={relationship.id}
                  value={relationship.id}
                >
                  {user?.id === relationship.supervisor_id
                    ? `Supervising ${relationship.supervisee_name}`
                    : `Supervised by ${relationship.supervisor_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRelationship && (
            <Button
              onClick={() => setIsNewSessionOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {selectedRelationship ? (
          <div className="space-y-6">
            <SupervisionMetrics relationshipId={selectedRelationship} />
            <SessionsList relationshipId={selectedRelationship} />
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Select a supervision relationship to view sessions
          </div>
        )}
      </CardContent>

      {selectedRelationshipData && (
        <NewSessionDialog
          open={isNewSessionOpen}
          onOpenChange={setIsNewSessionOpen}
          supervisorId={selectedRelationshipData.supervisor_id}
          superviseeId={selectedRelationshipData.supervisee_id}
          onSuccess={() => {
            setIsNewSessionOpen(false);
          }}
        />
      )}
    </Card>
  );
};
