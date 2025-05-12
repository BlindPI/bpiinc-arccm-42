
import React from 'react';
import { Helmet } from 'react-helmet';
import { RosterDetailsView } from '@/components/rosters/RosterDetailsView';
import { useParams } from 'react-router-dom';
import { useRosterDetail } from '@/hooks/useRosters';

export function RosterDetailPage() {
  const { rosterId } = useParams<{ rosterId: string }>();
  const { roster } = useRosterDetail(rosterId);

  return (
    <>
      <Helmet>
        <title>
          {roster ? `${roster.name} | Roster Details` : 'Roster Details'} | Certificate Management System
        </title>
      </Helmet>

      <div className="container mx-auto py-6 max-w-7xl">
        <RosterDetailsView />
      </div>
    </>
  );
}
