
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  CheckCircle, 
  Clock, 
  Shield 
} from 'lucide-react';

interface ComplianceStatsCardsProps {
  totalDocuments: number;
  approvedDocuments: number;
  compliancePercentage: number;
}

export function ComplianceStatsCards({ 
  totalDocuments, 
  approvedDocuments, 
  compliancePercentage 
}: ComplianceStatsCardsProps) {
  const pendingDocuments = totalDocuments - approvedDocuments;
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Docs</p>
              <p className="text-2xl font-bold text-blue-600">{totalDocuments}</p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedDocuments}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingDocuments}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Compliance</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-purple-600">{compliancePercentage}%</p>
                {compliancePercentage === 100 && (
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    Complete
                  </Badge>
                )}
              </div>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
