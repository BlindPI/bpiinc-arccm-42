
import React from 'react';
import { Helmet } from 'react-helmet';
import { useRosters } from '@/hooks/useRosters';
import { RosterList } from '@/components/rosters/RosterList';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, FileUp } from 'lucide-react';

export function RostersPage() {
  const navigate = useNavigate();
  const { rosters, isLoading, archiveRoster } = useRosters();

  const handleArchiveRoster = (rosterId: string) => {
    if (confirm('Are you sure you want to archive this roster? This cannot be undone.')) {
      archiveRoster(rosterId);
    }
  };

  const handleCreateRoster = () => {
    navigate('/certificates/upload');
  };

  return (
    <>
      <Helmet>
        <title>Certificate Rosters | Certificate Management System</title>
      </Helmet>

      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificate Rosters</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your certificate rosters
            </p>
          </div>
          
          <Button onClick={handleCreateRoster}>
            <FileUp className="h-4 w-4 mr-2" />
            New Roster
          </Button>
        </div>

        <RosterList 
          rosters={rosters} 
          isLoading={isLoading} 
          onArchiveRoster={handleArchiveRoster} 
        />
      </div>
    </>
  );
}
