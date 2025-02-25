
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface SessionsListProps {
  relationshipId: string;
}

export const SessionsList = ({ relationshipId }: SessionsListProps) => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['supervision-sessions', relationshipId],
    queryFn: async () => {
      const { data: relationship } = await supabase
        .from('supervision_relationships')
        .select('supervisor_id, supervisee_id')
        .eq('id', relationshipId)
        .single();

      if (!relationship) throw new Error('Relationship not found');

      const { data, error } = await supabase
        .from('supervision_sessions')
        .select('*')
        .eq('supervisor_id', relationship.supervisor_id)
        .eq('supervisee_id', relationship.supervisee_id)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No supervision sessions recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Session History</h3>
      <Accordion type="single" collapsible className="w-full">
        {sessions.map((session, index) => (
          <AccordionItem key={session.id} value={session.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-4">
                <span>{format(new Date(session.session_date), "PPP")}</span>
                <Badge>
                  {session.session_type.replace('_', ' ')}
                </Badge>
                <span className="text-muted-foreground">
                  {session.duration_minutes} minutes
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                {session.meeting_notes && (
                  <div>
                    <h4 className="font-medium mb-2">Meeting Notes</h4>
                    <p className="text-muted-foreground">{session.meeting_notes}</p>
                  </div>
                )}
                
                {session.feedback_given && (
                  <div>
                    <h4 className="font-medium mb-2">Feedback</h4>
                    <p className="text-muted-foreground">{session.feedback_given}</p>
                  </div>
                )}

                {session.action_items && (
                  <div>
                    <h4 className="font-medium mb-2">Action Items</h4>
                    <p className="text-muted-foreground">{session.action_items}</p>
                  </div>
                )}

                {session.next_session_date && (
                  <div>
                    <h4 className="font-medium mb-2">Next Session</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(session.next_session_date), "PPP")}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
