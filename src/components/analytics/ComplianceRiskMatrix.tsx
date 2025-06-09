
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ComplianceRiskMatrixProps {
  data: any[];
  loading: boolean;
}

export function ComplianceRiskMatrix({ data, loading }: ComplianceRiskMatrixProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock compliance risk data
  const riskData = data.length > 0 ? data : [
    { 
      entity_name: 'Team Alpha', 
      risk_score: 25, 
      risk_level: 'low',
      entity_type: 'team',
      mitigation_recommendations: ['Continue current practices']
    },
    { 
      entity_name: 'Team Beta', 
      risk_score: 65, 
      risk_level: 'medium',
      entity_type: 'team',
      mitigation_recommendations: ['Review training schedules', 'Update compliance docs']
    },
    { 
      entity_name: 'Team Gamma', 
      risk_score: 85, 
      risk_level: 'high',
      entity_type: 'team',
      mitigation_recommendations: ['Immediate intervention required', 'Schedule compliance audit']
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'high': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const riskSummary = {
    low: riskData.filter(r => r.risk_level === 'low').length,
    medium: riskData.filter(r => r.risk_level === 'medium').length,
    high: riskData.filter(r => r.risk_level === 'high').length,
    total: riskData.length
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Low Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">{riskSummary.low}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Medium Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">{riskSummary.medium}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">High Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">{riskSummary.high}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Overall Score</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Math.round((riskSummary.low * 100 + riskSummary.medium * 50) / riskSummary.total || 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Risk Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskData.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(risk.risk_level)}
                    <div>
                      <h4 className="font-medium">{risk.entity_name}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {risk.entity_type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={getRiskColor(risk.risk_level)}>
                      {risk.risk_level.toUpperCase()} RISK
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      Score: {risk.risk_score}/100
                    </div>
                  </div>
                </div>

                {/* Risk Score Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Level</span>
                    <span>{risk.risk_score}/100</span>
                  </div>
                  <Progress 
                    value={risk.risk_score} 
                    className={`h-2 ${
                      risk.risk_level === 'high' ? 'bg-red-100' :
                      risk.risk_level === 'medium' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}
                  />
                </div>

                {/* Mitigation Recommendations */}
                {risk.mitigation_recommendations && risk.mitigation_recommendations.length > 0 && (
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    <div className="text-sm font-medium mb-1">Recommendations:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {risk.mitigation_recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-xs">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {Math.round((riskSummary.low * 100 + riskSummary.medium * 50) / riskSummary.total || 0)}%
            </div>
            <div className="text-muted-foreground mb-4">Overall Compliance Health</div>
            <Progress 
              value={Math.round((riskSummary.low * 100 + riskSummary.medium * 50) / riskSummary.total || 0)}
              className="h-3"
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Based on {riskSummary.total} assessed entities
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
