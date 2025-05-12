
import React from 'react';
import { ArrowLeft, Archive, Download, Calendar, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { RosterWithRelations } from '@/types/rosters';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface RosterDetailsHeaderProps {
  roster: RosterWithRelations;
  onArchive?: () => void;
  onDownload?: () => void;
  isArchiving?: boolean;
  isDownloading?: boolean;
}

export function RosterDetailsHeader({
  roster,
  onArchive,
  onDownload,
  isArchiving = false,
  isDownloading = false,
}: RosterDetailsHeaderProps) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isOwner = profile?.id === roster.created_by;
  const canArchive = (isAdmin || isOwner) && roster.status !== 'ARCHIVED';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyRosterId = () => {
    navigator.clipboard.writeText(roster.id);
    toast.success('Roster ID copied to clipboard');
  };

  return (
    <div className="border-b pb-6 mb-6">
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => navigate('/rosters')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold flex-grow">{roster.name}</h1>
        <div className="flex items-center gap-2">
          {getStatusBadge(roster.status)}
        </div>
      </div>
      
      <div className="flex flex-col gap-1 mb-4">
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(roster.created_at), 'MMMM d, yyyy')}
          </div>
          
          {roster.course?.name && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {roster.course.name}
            </div>
          )}
          
          {roster.location?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {roster.location.name}
            </div>
          )}
          
          <div>
            <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={copyRosterId}>
              ID: {roster.id.split('-')[0]}...
            </Button>
          </div>
        </div>
        
        {roster.description && (
          <p className="text-sm max-w-3xl">{roster.description}</p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {onDownload && (
          <Button
            variant="outline"
            onClick={onDownload}
            disabled={isDownloading || roster.certificate_count === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : `Download (${roster.certificate_count})`}
          </Button>
        )}
        
        {canArchive && onArchive && (
          <Button
            variant="outline"
            onClick={onArchive}
            disabled={isArchiving}
          >
            <Archive className="h-4 w-4 mr-2" />
            {isArchiving ? 'Archiving...' : 'Archive Roster'}
          </Button>
        )}
      </div>
    </div>
  );
}
