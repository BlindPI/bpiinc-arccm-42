import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Target,
  Award,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  UserCheck,
  BarChart3,
  Settings
} from 'lucide-react';
import { TeamAssignmentTab } from './TeamAssignmentTab';
import { PerformanceTab } from './PerformanceTab';
import { CapabilitiesTab } from './CapabilitiesTab';

interface ProviderTeamManagementDashboardProps {
  providerId?: string;
}

export function ProviderTeamManagementDashboard({ providerId }: ProviderTeamManagementDashboardProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('assignments');

  // Fetch provider data
  const { data: provider, isLoading: loadingProvider } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          locations:location_id (
            id,
            name,
            city,
            state
          ),
          profiles:user_id (
            id,
            display_name,
            email,
            organization,
            job_title
          )
        `)
        .eq('id', providerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId
  });

  // Fetch team assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['provider-team-assignments', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .rpc('get_provider_team_assignments_detailed', { p_provider_id: providerId });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!providerId
  });

  // Fetch performance metrics
  const { data: performanceMetrics = [], isLoading: loadingPerformance } = useQuery({
    queryKey: ['provider-performance', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_team_performance')
        .select('*')
        .eq('provider_id', providerId)
        .order('measurement_period', { ascending: false });
      
      if (error) {
        console.error('Error fetching performance:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!providerId
  });

  // Fetch training capabilities
  const { data: capabilities = [], isLoading: loadingCapabilities } = useQuery({
    queryKey: ['provider-capabilities', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_training_capabilities')
        .select('*')
        .eq('provider_id', providerId);
      
      if (error) {
        console.error('Error fetching capabilities:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!providerId
  });

  const isLoading = loadingProvider || loadingAssignments || loadingPerformance || loadingCapabilities;

  if (!providerId) {
    return (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Select a Provider</h3>
        <p className="text-muted-foreground">
          Choose a provider from the list to manage their team assignments, performance, and capabilities.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading provider team management data...</p>
      </div>
    );
  }

  const activeAssignments = assignments.filter(a => a.status === 'active');
  const totalTeams = activeAssignments.length;
  const totalMembers = activeAssignments.reduce((sum, a) => sum + (a.member_count || 0), 0);
  const avgPerformance = activeAssignments.length > 0 
    ? activeAssignments.reduce((sum, a) => sum + (a.performance_score || 0), 0) / activeAssignments.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Provider Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{provider?.name || 'Provider'}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {provider?.profiles?.email && (
                  <span>{provider.profiles.email}</span>
                )}
                {provider?.locations && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{provider.locations.name}</span>
                  </div>
                )}
                {provider?.profiles?.organization && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{provider.profiles.organization}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Badge variant={provider?.status === 'APPROVED' ? 'default' : 'secondary'}>
            {provider?.status || 'Unknown'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Teams</p>
                <p className="text-2xl font-bold">{totalTeams}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">{avgPerformance.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capabilities</p>
                <p className="text-2xl font-bold">{capabilities.length}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Assignments
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Capabilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <TeamAssignmentTab 
            providerId={providerId}
            assignments={assignments}
            onAssignmentChange={() => {
              queryClient.invalidateQueries({ queryKey: ['provider-team-assignments', providerId] });
            }}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab 
            providerId={providerId}
            performanceMetrics={performanceMetrics}
            assignments={assignments}
            onPerformanceChange={() => {
              queryClient.invalidateQueries({ queryKey: ['provider-performance', providerId] });
            }}
          />
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <CapabilitiesTab 
            providerId={providerId}
            capabilities={capabilities}
            onCapabilitiesChange={() => {
              queryClient.invalidateQueries({ queryKey: ['provider-capabilities', providerId] });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}