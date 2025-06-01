
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Award,
  Mail,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { CertificateStatsCards } from './CertificateStatsCards';
import { EnhancedCertificateCard } from './EnhancedCertificateCard';
import { EmailCertificateForm } from '../EmailCertificateForm';
import { BatchEmailAction } from '../BatchEmailAction';
import { toast } from 'sonner';

export function EnhancedCertificatesView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<string>>(new Set());
  const [emailDialogCert, setEmailDialogCert] = useState<Certificate | null>(null);

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
      return (data || []) as Certificate[];
    },
    enabled: !!profile
  });

  // Fetch locations for display
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, state');
      
      if (error) throw error;
      return data || [];
    }
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

  const handleSelectAll = () => {
    if (selectedCertificates.size === filteredCertificates.length) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(new Set(filteredCertificates.map(c => c.id)));
    }
  };

  const handleExport = () => {
    console.log('Export certificates');
    toast.info('Export functionality coming soon');
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'REVOKED' })
        .eq('id', certificateId);

      if (error) throw error;
      
      toast.success('Certificate revoked successfully');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error('Failed to revoke certificate');
    }
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId || !locations) return 'No Location';
    const location = locations.find(loc => loc.id === locationId);
    return location ? `${location.name}, ${location.city}` : 'Unknown Location';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <CertificateStatsCards certificates={certificates || []} />

      {/* Header and Controls */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Award className="h-6 w-6 text-primary" />
              Certificate Management
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredCertificates.length} certificates
              </Badge>
              {selectedCertificates.size > 0 && (
                <Badge variant="default" className="text-sm">
                  {selectedCertificates.size} selected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates by name, course, or verification code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {/* Status Filters */}
              {['ACTIVE', 'EXPIRED', 'REVOKED', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                  className="capitalize"
                >
                  {status === 'all' ? 'All' : status.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {filteredCertificates.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedCertificates.size === filteredCertificates.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
              
              {selectedCertificates.size > 0 && (
                <>
                  <BatchEmailAction
                    selectedCertificates={Array.from(selectedCertificates)}
                    certificates={filteredCertificates}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Display */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-600">No certificates match your current search criteria.</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredCertificates.map((certificate) => (
                <EnhancedCertificateCard
                  key={certificate.id}
                  certificate={certificate}
                  isSelected={selectedCertificates.has(certificate.id)}
                  onSelect={(selected) => handleSelectCertificate(certificate.id, selected)}
                  onEmail={() => setEmailDialogCert(certificate)}
                  onRevoke={() => handleRevokeCertificate(certificate.id)}
                  locationName={getLocationName(certificate.location_id)}
                  showActions={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      {emailDialogCert && (
        <Dialog open={!!emailDialogCert} onOpenChange={() => setEmailDialogCert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Certificate</DialogTitle>
            </DialogHeader>
            <EmailCertificateForm
              certificate={emailDialogCert}
              onClose={() => setEmailDialogCert(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
