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
    // Only include pages with VERIFIED role-based access
    const baseReports = [
      {
        id: 'analytics',
        title: 'Analytics Hub',
        description: 'Performance insights with role-based access',
        icon: TrendingUp,
        href: '/analytics'
      },
      {
        id: 'teams',
        title: 'Team Reports',
        description: 'Team management and performance',
        icon: Users,
        href: '/teams'
      }
    ];

    // AP users - verified access to CRM Hub
    if (userRole === 'AP' || ['SA', 'AD', 'IC', 'IP', 'IT'].includes(userRole)) {
      baseReports.push({
        id: 'crm-hub',
        title: 'CRM Hub',
        description: 'Customer relationship management',
        icon: Users,
        href: '/crm/hub'
      });
    }

    // Admin only - verified access control
    if (['SA', 'AD'].includes(userRole)) {
      baseReports.push({
        id: 'admin-hub',
        title: 'Admin Hub',
        description: 'System administration',
        icon: FileText,
        href: '/admin-hub'
      });
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