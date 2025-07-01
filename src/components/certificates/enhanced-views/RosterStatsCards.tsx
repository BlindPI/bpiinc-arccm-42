
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RosterWithRelations } from '@/types/roster';
import { FileText, Award, Archive, Users } from 'lucide-react';

interface RosterStatsCardsProps {
  rosters: RosterWithRelations[];
}

export function RosterStatsCards({ rosters }: RosterStatsCardsProps) {
  const activeRosters = rosters.filter(r => r.status === 'ACTIVE').length;
  const archivedRosters = rosters.filter(r => r.status === 'ARCHIVED').length;
  const draftRosters = rosters.filter(r => r.status === 'DRAFT').length;
  const totalCertificates = rosters.reduce((sum, r) => sum + (r.certificate_count || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{activeRosters}</div>
              <div className="text-sm text-gray-600">Active Rosters</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{totalCertificates}</div>
              <div className="text-sm text-gray-600">Total Certificates</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-gray-600" />
            <div>
              <div className="text-2xl font-bold text-gray-600">{archivedRosters}</div>
              <div className="text-sm text-gray-600">Archived</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{draftRosters}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
