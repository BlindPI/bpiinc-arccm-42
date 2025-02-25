
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Clock, Calendar, Activity } from "lucide-react";

interface SupervisionMetricsProps {
  relationshipId: string;
}

export const SupervisionMetrics = ({ relationshipId }: SupervisionMetricsProps) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['supervision-metrics', relationshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supervision_metrics')
        .select('*')
        .eq('id', relationshipId)
        .single();

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

  if (!metrics) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Sessions
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_sessions || 0}</div>
          <p className="text-xs text-muted-foreground">
            Last session: {metrics.last_session_date ? new Date(metrics.last_session_date).toLocaleDateString() : 'No sessions yet'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Duration
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avg_session_duration ? `${Math.round(metrics.avg_session_duration)}min` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Per supervision session
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Supervision Status
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.supervision_status || 'Active'}</div>
          <p className="text-xs text-muted-foreground">
            Current relationship status
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
