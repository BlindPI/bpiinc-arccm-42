import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, TrendingUp, Users, MapPin, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReportsSectionProps {
  userRole: string;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const getAvailableReports = () => {
    const baseReports = [
      {
        id: 'team-performance',
        title: 'Team Performance',
        description: 'View team metrics and performance indicators',
        icon: TrendingUp,
        href: '/reports/team-performance'
      },
      {
        id: 'certifications',
        title: 'Certification Reports',
        description: 'Track certification progress and completions',
        icon: GraduationCap,
        href: '/reports/certifications'
      }
    ];

    if (userRole === 'AP') {
      return [
        ...baseReports,
        {
          id: 'location-overview',
          title: 'Location Overview',
          description: 'Comprehensive location-level reporting',
          icon: MapPin,
          href: '/reports/location-overview'
        },
        {
          id: 'instructor-management',
          title: 'Instructor Management',
          description: 'Instructor performance and scheduling',
          icon: Users,
          href: '/reports/instructor-management'
        }
      ];
    }

    if (userRole === 'IT') {
      return [
        ...baseReports,
        {
          id: 'system-reports',
          title: 'System Reports',
          description: 'System-wide metrics and analytics',
          icon: BarChart3,
          href: '/reports/system'
        },
        {
          id: 'compliance-reports',
          title: 'Compliance Reports',
          description: 'Compliance tracking and audit reports',
          icon: FileText,
          href: '/reports/compliance'
        }
      ];
    }

    return baseReports;
  };

  const reports = getAvailableReports();

  const getRoleLabel = () => {
    switch (userRole) {
      case 'AP':
        return 'Authorized Provider';
      case 'IT':
        return 'Instructor In Training';
      default:
        return userRole;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </div>
          <Badge variant="outline" className="text-xs">
            {getRoleLabel()} Access
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                    <p className="text-gray-600 text-xs">{report.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate(report.href)}
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reports available for your current role.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};