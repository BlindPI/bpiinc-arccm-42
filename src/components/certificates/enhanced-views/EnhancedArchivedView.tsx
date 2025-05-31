
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Archive,
  Calendar,
  Eye,
  Download,
  RotateCcw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { CertificateRequest } from '@/types/supabase-schema';
import { EnhancedArchivedCard } from './EnhancedArchivedCard';
import { ArchivedStatsCards } from './ArchivedStatsCards';

export function EnhancedArchivedView() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: archivedRequests, isLoading } = useQuery({
    queryKey: ['enhanced-archived-requests', isAdmin, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('certificate_requests')
        .select('*')
        .in('status', ['ARCHIVED', 'ARCHIVE_FAILED']);

      if (!isAdmin && profile?.id) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as CertificateRequest[];
    },
    enabled: !!profile
  });

  const filteredRequests = archivedRequests?.filter(request => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      request.recipient_name?.toLowerCase().includes(searchLower) ||
      request.course_name?.toLowerCase().includes(searchLower) ||
      request.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <ArchivedStatsCards requests={archivedRequests || []} />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Enhanced Archived Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search archived requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Archive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Requests List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading archived requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No archived requests found matching your criteria
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <EnhancedArchivedCard
                  key={request.id}
                  request={request}
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
