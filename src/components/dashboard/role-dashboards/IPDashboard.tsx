
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUIRequirements } from '@/hooks/useComplianceRequirements';
import { BookOpen, Award, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface IPDashboardProps {
  dashboardView: 'overview' | 'compliance' | 'progress';
  onViewChange: (view: 'overview' | 'compliance' | 'progress') => void;
  activeRequirement: string | null;
  onRequirementSelect: (id: string | null) => void;
}

export function IPDashboard({ 
  dashboardView, 
  onViewChange, 
  activeRequirement, 
  onRequirementSelect 
}: IPDashboardProps) {
  const { user } = useAuth();
  const { data: requirements = [], isLoading } = useUIRequirements(user?.id, 'IP');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedRequirements = requirements.filter(req => req.status === 'completed');
  const pendingRequirements = requirements.filter(req => req.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Instructor Provider Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage training delivery and instructor coordination
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirements.length}</div>
            <p className="text-xs text-muted-foreground">Compliance requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequirements.length}</div>
            <p className="text-xs text-muted-foreground">Requirements completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequirements.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requirements.length > 0 ? Math.round((completedRequirements.length / requirements.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle>IP Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance requirements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div 
                  key={requirement.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRequirementSelect(requirement.id)}
                >
                  <div>
                    <p className="font-medium">{requirement.name}</p>
                    <p className="text-sm text-muted-foreground">{requirement.description}</p>
                    {requirement.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(requirement.due_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={requirement.status === 'completed' ? 'default' : 'outline'}>
                      {requirement.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
