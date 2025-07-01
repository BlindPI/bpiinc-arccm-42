
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { CertificateRequest } from '@/types/supabase-schema';

interface ArchivedStatsCardsProps {
  requests: CertificateRequest[];
}

export function ArchivedStatsCards({ requests }: ArchivedStatsCardsProps) {
  const totalArchived = requests.length;
  const successfullyArchived = requests.filter(req => req.status === 'ARCHIVED').length;
  const failedArchives = requests.filter(req => req.status === 'ARCHIVE_FAILED').length;
  const passedAssessments = requests.filter(req => req.assessment_status === 'PASS').length;

  const stats = [
    {
      title: 'Total Archived',
      value: totalArchived,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Successfully Archived',
      value: successfullyArchived,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Archive Failures',
      value: failedArchives,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Passed Assessments',
      value: passedAssessments,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
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
