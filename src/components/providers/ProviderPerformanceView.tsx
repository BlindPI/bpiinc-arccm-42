
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Award, Users, DollarSign } from 'lucide-react';

interface ProviderPerformanceViewProps {
  providerId: string;
}

export function ProviderPerformanceView({ providerId }: ProviderPerformanceViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Mock performance data - replace with actual API call
  const performanceData = {
    certificates_issued: 45,
    courses_conducted: 12,
    student_satisfaction: 4.2,
    revenue_generated: 28500,
    compliance_score: 92.5
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Performance Metrics</h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Certificates Issued</p>
                <p className="text-2xl font-bold">{performanceData.certificates_issued}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Courses Conducted</p>
                <p className="text-2xl font-bold">{performanceData.courses_conducted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{performanceData.student_satisfaction}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${performanceData.revenue_generated.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Compliance Score</p>
                <p className="text-lg">{performanceData.compliance_score}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Student Satisfaction</p>
                <p className="text-lg">{performanceData.student_satisfaction}/5.0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
