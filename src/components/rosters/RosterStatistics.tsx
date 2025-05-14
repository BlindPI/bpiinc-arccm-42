
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast, ToastVariant } from "@/components/ui/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface RosterStats {
  total_certificates: number;
  active_certificates: number;
  expired_certificates: number;
  revoked_certificates: number;
}

interface RosterStatisticsProps {
  rosterId: string;
}

export const RosterStatistics: React.FC<RosterStatisticsProps> = ({ rosterId }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<RosterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatistics() {
      if (!rosterId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('status')
          .eq('roster_id', rosterId);

        if (error) throw error;

        // Calculate stats from the certificates data
        const statsData: RosterStats = {
          total_certificates: data.length,
          active_certificates: data.filter(c => c.status === 'ACTIVE').length,
          expired_certificates: data.filter(c => c.status === 'EXPIRED').length,
          revoked_certificates: data.filter(c => c.status === 'REVOKED').length
        };
        
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching roster statistics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load roster statistics',
          variant: "error" as ToastVariant,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatistics();
  }, [rosterId, toast]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Certificate Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-700">{stats?.total_certificates || 0}</div>
            <div className="text-sm text-blue-600">Total Certificates</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-700">{stats?.active_certificates || 0}</div>
            <div className="text-sm text-green-600">Active</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-amber-700">{stats?.expired_certificates || 0}</div>
            <div className="text-sm text-amber-600">Expired</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-red-700">{stats?.revoked_certificates || 0}</div>
            <div className="text-sm text-red-600">Revoked</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
