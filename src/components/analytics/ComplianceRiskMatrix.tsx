
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Users, MapPin, ChevronRight } from 'lucide-react';
import type { ComplianceRiskScore } from '@/types/analytics';

interface ComplianceRiskMatrixProps {
  data: ComplianceRiskScore[];
  loading: boolean;
}

export const ComplianceRiskMatrix: React.FC<ComplianceRiskMatrixProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRiskIcon = (entityType: string) => {
    switch (entityType) {
      case 'user': return Users;
      case 'team': return Shield;
      case 'location': return MapPin;
      default: return AlertTriangle;
    }
  };

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.entity_type]) {
      acc[item.entity_type] = [];
    }
    acc[item.entity_type].push(item);
    return acc;
  }, {} as Record<string, ComplianceRiskScore[]>);

  return (
    <div className="space-y-6">
      {/* Risk Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map((level) => {
          const count = data.filter(item => item.risk_level === level).length;
          return (
            <Card key={level}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${
                  level === 'critical' ? 'text-red-600' :
                  level === 'high' ? 'text-orange-600' :
                  level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {count}
                </div>
                <p className="text-sm text-gray-600 capitalize">{level} Risk</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Matrix by Entity Type */}
      {Object.entries(groupedData).map(([entityType, risks]) => {
        const Icon = getRiskIcon(entityType);
        
        return (
          <Card key={entityType}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Icon className="h-5 w-5" />
                {entityType} Compliance Risks
                <Badge variant="outline">{risks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks
                  .sort((a, b) => b.risk_score - a.risk_score)
                  .slice(0, 10)
                  .map((risk) => (
                    <div key={risk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${
                            risk.risk_level === 'critical' ? 'bg-red-500' :
                            risk.risk_level === 'high' ? 'bg-orange-500' :
                            risk.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{risk.entity_name}</p>
                          <p className="text-xs text-gray-600">
                            Last assessed: {new Date(risk.last_assessment).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">Score: {risk.risk_score}</p>
                          <Badge variant={getRiskBadgeVariant(risk.risk_level)}>
                            {risk.risk_level}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {risks.length > 10 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      View All {risks.length} {entityType} Risks
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Mitigation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Mitigation Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data
              .filter(risk => risk.mitigation_recommendations && risk.mitigation_recommendations.length > 0)
              .slice(0, 5)
              .map((risk) => (
                <div key={risk.id} className="border-l-4 border-orange-400 pl-4">
                  <p className="font-medium text-sm">{risk.entity_name}</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {risk.mitigation_recommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
