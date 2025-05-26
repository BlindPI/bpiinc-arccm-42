
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComplianceStatusWidgetProps {
  userId: string;
}

export const ComplianceStatusWidget: React.FC<ComplianceStatusWidgetProps> = ({ userId }) => {
  // Mock compliance data
  const complianceData = {
    overallScore: 85,
    certifications: [
      { name: 'CPR Instructor', status: 'valid', expiryDate: '2026-05-15' },
      { name: 'First Aid Trainer', status: 'valid', expiryDate: '2026-07-20' },
      { name: 'Advanced Techniques', status: 'expiring_soon', expiryDate: '2025-06-10' }
    ],
    requiredDocuments: {
      completed: 8,
      total: 10
    },
    teachingHours: {
      current: 42,
      required: 50
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'expiring_soon': return 'text-amber-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring_soon': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Compliance</span>
            <span>{complianceData.overallScore}%</span>
          </div>
          <Progress value={complianceData.overallScore} className="h-2" />
        </div>

        {/* Certifications */}
        <div>
          <h4 className="font-medium mb-2">Certifications</h4>
          <div className="space-y-2">
            {complianceData.certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(cert.status)}
                  <span>{cert.name}</span>
                </div>
                <Badge variant="outline" className={getStatusColor(cert.status)}>
                  {cert.status === 'expiring_soon' ? 'Expires Soon' : 
                   cert.status === 'valid' ? 'Valid' : 'Expired'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Hours */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Teaching Hours</span>
            <span>{complianceData.teachingHours.current}/{complianceData.teachingHours.required}</span>
          </div>
          <Progress 
            value={(complianceData.teachingHours.current / complianceData.teachingHours.required) * 100} 
            className="h-2" 
          />
        </div>

        {/* Documents */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Required Documents</span>
            <span>{complianceData.requiredDocuments.completed}/{complianceData.requiredDocuments.total}</span>
          </div>
          <Progress 
            value={(complianceData.requiredDocuments.completed / complianceData.requiredDocuments.total) * 100} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
};
