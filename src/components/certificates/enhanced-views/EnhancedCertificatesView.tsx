
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Award,
  Calendar,
  FileText,
  Eye,
  Mail
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { EnhancedCertificateCard } from './EnhancedCertificateCard';
import { CertificateStatsCards } from './CertificateStatsCards';

export function EnhancedCertificatesView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['enhanced-certificates', isAdmin, statusFilter, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select('*');

      if (!isAdmin && profile?.id) {
        query = query.eq('user_id', profile.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!profile
  });

  const filteredCertificates = certificates?.filter(cert => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      cert.recipient_name?.toLowerCase().includes(searchLower) ||
      cert.course_name?.toLowerCase().includes(searchLower) ||
      cert.verification_code?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSelectCertificate = (certId: string, selected: boolean) => {
    const newSelection = new Set(selectedCertificates);
    if (selected) {
      newSelection.add(certId);
    } else {
      newSelection.delete(certId);
    }
    setSelectedCertificates(newSelection);
  };

  const handleBulkEmail = () => {
    console.log('Bulk email certificates:', Array.from(selectedCertificates));
    // TODO: Implement bulk email functionality
  };

  const handleExport = () => {
    console.log('Export certificates');
    // TODO: Implement export functionality
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <CertificateStatsCards certificates={certificates || []} />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Enhanced Certificate Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              {['ACTIVE', 'EXPIRED', 'REVOKED'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {selectedCertificates.size > 0 && (
                <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email ({selectedCertificates.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading certificates...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No certificates found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((certificate) => (
                <EnhancedCertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  isSelected={selectedCertificates.has(certificate.id)}
                  onSelect={(selected) => handleSelectCertificate(certificate.id, selected)}
                  canManage={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
