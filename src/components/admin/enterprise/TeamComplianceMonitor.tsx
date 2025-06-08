
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  Search,
  Filter
} from 'lucide-react';

interface TeamComplianceMonitorProps {
  teams: any[];
}

export function TeamComplianceMonitor({ teams }: TeamComplianceMonitorProps) {
  const [selectedCompliance, setSelectedCompliance] = useState('overview');

  // Mock compliance data
  const complianceData = teams.map(team => ({
    ...team,
    complianceScore: Math.floor(Math.random() * 30) + 70,
    issues: Math.floor(Math.random() * 5),
    lastAudit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    certifications: ['ISO 9001', 'SOC 2'][Math.floor(Math.random() * 2)]
  }));

  const systemCompliance = {
    overall: Math.round(complianceData.reduce((sum, team) => sum + team.complianceScore, 0) / complianceData.length),
    compliantTeams: complianceData.filter(t => t.complianceScore >= 85).length,
    criticalIssues: complianceData.reduce((sum, team) => sum + team.issues, 0),
    pendingAudits: complianceData.filter(t => 
      new Date().getTime() - t.lastAudit.getTime() > 90 * 24 * 60 * 60 * 1000
    ).length
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
    if (score >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Monitoring
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor team compliance across all frameworks and standards
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(systemCompliance.overall)}`}>
              {systemCompliance.overall}%
            </div>
            <Progress value={systemCompliance.overall} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliant Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemCompliance.compliantTeams}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {teams.length} teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {systemCompliance.criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {systemCompliance.pendingAudits}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overdue for review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {systemCompliance.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical compliance issues detected!</strong> {systemCompliance.criticalIssues} issues 
            require immediate attention across {teams.length} teams.
          </AlertDescription>
        </Alert>
      )}

      {/* Team Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Team Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.map((team) => (
              <div key={team.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">{team.location?.name || 'No Location'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getComplianceBadge(team.complianceScore)}
                    <span className={`text-lg font-bold ${getComplianceColor(team.complianceScore)}`}>
                      {team.complianceScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Score:</span>
                    <div className="mt-1">
                      <Progress value={team.complianceScore} className="h-2" />
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Issues:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {team.issues > 0 ? (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">{team.issues} critical</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">No issues</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Last Audit:</span>
                    <div className="mt-1">
                      {team.lastAudit.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Certifications:</span>
                    <div className="mt-1">
                      <Badge variant="outline">{team.certifications}</Badge>
                    </div>
                  </div>
                </div>

                {team.issues > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <div className="text-sm text-red-800">
                      <strong>Critical Issues:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        <li>Missing required training documentation</li>
                        <li>Overdue safety certification renewal</li>
                        {team.issues > 2 && <li>And {team.issues - 2} more issues...</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Active Compliance Frameworks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">ISO 9001:2015</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Quality Management System standards
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <span className="text-sm">89% compliance</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">SOC 2 Type II</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Security and availability controls
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <span className="text-sm">92% compliance</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">OSHA Standards</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Workplace safety and health regulations
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
                <span className="text-sm">76% compliance</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
