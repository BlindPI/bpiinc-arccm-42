
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Archive, ExternalLink, FileText, MapPin } from 'lucide-react';
import { RosterWithRelations } from '@/types/rosters';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface RosterCardProps {
  roster: RosterWithRelations;
  onView: (rosterId: string) => void;
  onArchive: (rosterId: string) => void;
  onDownload?: (rosterId: string) => void;
}

export function RosterCard({ roster, onView, onArchive, onDownload }: RosterCardProps) {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isOwner = profile?.id === roster.created_by;
  const canEdit = isAdmin || isOwner;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
      case 'PROCESSING':
        return 'warning';
      default:
        return 'outline';
    }
  };

  const copyRosterId = () => {
    navigator.clipboard.writeText(roster.id);
    toast.success('Roster ID copied to clipboard');
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div>
            <h3 className="font-semibold truncate">{roster.name}</h3>
            <p className="text-xs text-muted-foreground">
              Created on {format(new Date(roster.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(roster.status)}>
            {roster.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mt-3 text-sm">
          {(roster.course?.name || roster.course_id) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">{roster.course?.name || 'Unknown course'}</span>
            </div>
          )}
          
          {(roster.location?.name || roster.location_id) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{roster.location?.name || 'Unknown location'}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Badge variant="outline" className="text-xs font-normal">
              {roster.certificate_count || 0} certificates
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t bg-muted/20 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onView(roster.id)}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={copyRosterId}
            title="Copy roster ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          
          {canEdit && roster.status !== 'ARCHIVED' && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onArchive(roster.id)}
              title="Archive roster"
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {onDownload && roster.certificate_count > 0 && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDownload(roster.id)}
              title="Download all certificates"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
