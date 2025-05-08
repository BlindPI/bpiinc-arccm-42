
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Award, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { AnalyticsSummary } from '@/hooks/useCertificateAnalytics';

interface SummaryMetricsCardsProps {
  data: AnalyticsSummary;
}

export const SummaryMetricsCards: React.FC<SummaryMetricsCardsProps> = ({ data }) => {
  const metrics = [
    {
      title: "Total Certificates",
      value: data.totalCertificates,
      icon: <Award className="w-6 h-6 text-blue-500" />,
      color: "bg-blue-50 border-blue-100"
    },
    {
      title: "Active Certificates",
      value: data.activeCertificates,
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      color: "bg-green-50 border-green-100"
    },
    {
      title: "Expiring Soon",
      value: data.expiringCertificates,
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-50 border-amber-100"
    },
    {
      title: "Unique Courses",
      value: data.coursesWithCertificates,
      icon: <BookOpen className="w-6 h-6 text-purple-500" />,
      color: "bg-purple-50 border-purple-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className={`border shadow-sm ${metric.color}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-full bg-white/80 shadow-sm">
                {metric.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
