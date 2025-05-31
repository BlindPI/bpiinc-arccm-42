
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Certificate } from '@/types/certificates';

interface CertificateStatsCardsProps {
  certificates: Certificate[];
}

export function CertificateStatsCards({ certificates }: CertificateStatsCardsProps) {
  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter(cert => cert.status === 'ACTIVE').length;
  const expiredCertificates = certificates.filter(cert => {
    const isExpired = new Date(cert.expiry_date) < new Date();
    return cert.status === 'ACTIVE' && isExpired;
  }).length;
  const revokedCertificates = certificates.filter(cert => cert.status === 'REVOKED').length;

  const stats = [
    {
      title: 'Total Certificates',
      value: totalCertificates,
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Certificates',
      value: activeCertificates,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Expired',
      value: expiredCertificates,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Revoked',
      value: revokedCertificates,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
