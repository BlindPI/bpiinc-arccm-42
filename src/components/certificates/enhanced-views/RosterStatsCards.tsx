
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Archive, Edit } from 'lucide-react';
import { RosterWithRelations } from '@/types/roster';

interface RosterStatsCardsProps {
  rosters: RosterWithRelations[];
}

export function RosterStatsCards({ rosters }: RosterStatsCardsProps) {
  const totalRosters = rosters.length;
  const activeRosters = rosters.filter(roster => roster.status === 'ACTIVE').length;
  const archivedRosters = rosters.filter(roster => roster.status === 'ARCHIVED').length;
  const totalCertificates = rosters.reduce((sum, roster) => sum + (roster.certificate_count || 0), 0);

  const stats = [
    {
      title: 'Total Rosters',
      value: totalRosters,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Rosters',
      value: activeRosters,
      icon: Edit,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Certificates',
      value: totalCertificates,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Archived',
      value: archivedRosters,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
