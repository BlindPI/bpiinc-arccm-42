
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { RLSPolicyService } from '@/services/security/rlsPolicyService';

export const RLSStatusPanel: React.FC = () => {
  const { data: policies, isLoading } = useQuery({
    queryKey: ['rls-policies'],
    queryFn: () => RLSPolicyService.getAllPolicies()
  });

  const criticalTables = [
    'profiles', 'certificates', 'certificate_requests', 'courses', 
    'course_schedules', 'teams', 'team_members', 'notifications',
    'rosters', 'teaching_sessions'
  ];

  const getTableStatus = (tableName: string) => {
    const tablePolicies = policies?.filter(p => p.tablename === tableName) || [];
    
    if (tablePolicies.length === 0) {
      return { status: 'missing', icon: XCircle, color: 'destructive' as const };
    }
    
    const hasSelect = tablePolicies.some(p => p.cmd === 'SELECT');
    const hasInsert = tablePolicies.some(p => p.cmd === 'INSERT');
    const hasUpdate = tablePolicies.some(p => p.cmd === 'UPDATE');
    const hasDelete = tablePolicies.some(p => p.cmd === 'DELETE');
    
    if (hasSelect && hasInsert && hasUpdate && hasDelete) {
      return { status: 'complete', icon: CheckCircle, color: 'default' as const };
    } else if (hasSelect || hasInsert) {
      return { status: 'partial', icon: AlertTriangle, color: 'secondary' as const };
    } else {
      return { status: 'incomplete', icon: XCircle, color: 'destructive' as const };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading RLS status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Row Level Security Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalTables.map((tableName) => {
              const status = getTableStatus(tableName);
              const Icon = status.icon;
              
              return (
                <div
                  key={tableName}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${
                      status.color === 'destructive' ? 'text-red-500' :
                      status.color === 'secondary' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <span className="font-mono text-sm">{tableName}</span>
                  </div>
                  <Badge variant={status.color}>
                    {status.status}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">
                  {criticalTables.filter(t => getTableStatus(t).status === 'complete').length}
                </div>
                <div className="text-gray-600">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-bold text-lg">
                  {criticalTables.filter(t => getTableStatus(t).status === 'partial').length}
                </div>
                <div className="text-gray-600">Partial</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-bold text-lg">
                  {criticalTables.filter(t => ['missing', 'incomplete'].includes(getTableStatus(t).status)).length}
                </div>
                <div className="text-gray-600">Issues</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
