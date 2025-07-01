
import { supabase } from '@/integrations/supabase/client';

export interface SupervisionRelationship {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  supervisor_role: string;
  supervisee_role: string;
  supervisor_name: string;
  supervisee_name: string;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  location_id?: string;
  provider_id?: string;
  start_date: string;
  end_date?: string;
  supervision_type: 'direct' | 'indirect' | 'clinical' | 'administrative';
  requirements_met: Record<string, boolean>;
  progress_notes: string[];
  created_at: string;
  updated_at: string;
}

export interface LocationSupervisionMetrics {
  location_id: string;
  location_name: string;
  total_supervisors: number;
  total_supervisees: number;
  active_relationships: number;
  compliance_rate: number;
  supervision_hours_logged: number;
}

export interface ProviderSupervisionMetrics {
  provider_id: string;
  provider_name: string;
  supervision_capacity: number;
  current_supervisees: number;
  compliance_score: number;
  performance_rating: number;
}

export class EnhancedSupervisionService {
  async getLocationSupervisionMetrics(locationId?: string): Promise<LocationSupervisionMetrics[]> {
    try {
      let query = supabase
        .from('locations')
        .select(`
          id,
          name,
          teams!inner(
            team_members(
              profiles(id, role, display_name)
            )
          )
        `);

      if (locationId) {
        query = query.eq('id', locationId);
      }

      const { data: locations, error } = await query;
      if (error) throw error;

      const metrics: LocationSupervisionMetrics[] = [];

      for (const location of locations || []) {
        // Get supervision relationships for this location
        const { data: relationships } = await supabase
          .from('active_supervision_relationships')
          .select('*')
          .or(`supervisor_id.in.(${location.teams?.flatMap(t => t.team_members?.map(m => m.profiles?.id)).filter(Boolean).join(',')}),supervisee_id.in.(${location.teams?.flatMap(t => t.team_members?.map(m => m.profiles?.id)).filter(Boolean).join(',')})`);

        const supervisors = new Set();
        const supervisees = new Set();
        
        relationships?.forEach(rel => {
          supervisors.add(rel.supervisor_id);
          supervisees.add(rel.supervisee_id);
        });

        metrics.push({
          location_id: location.id,
          location_name: location.name,
          total_supervisors: supervisors.size,
          total_supervisees: supervisees.size,
          active_relationships: relationships?.length || 0,
          compliance_rate: this.calculateComplianceRate(relationships || []),
          supervision_hours_logged: Math.floor(Math.random() * 200) + 50 // Placeholder
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting location supervision metrics:', error);
      return [];
    }
  }

  async getProviderSupervisionMetrics(): Promise<ProviderSupervisionMetrics[]> {
    try {
      const { data: providers, error } = await supabase
        .from('authorized_providers')
        .select('*');

      if (error) throw error;

      const metrics: ProviderSupervisionMetrics[] = [];

      for (const provider of providers || []) {
        // Get teams for this provider
        const { data: teams } = await supabase
          .from('teams')
          .select(`
            team_members(
              profiles(id, role)
            )
          `)
          .eq('provider_id', provider.id);

        const memberIds = teams?.flatMap(t => t.team_members?.map(m => m.profiles?.id)).filter(Boolean) || [];
        
        const { data: relationships } = await supabase
          .from('active_supervision_relationships')
          .select('*')
          .or(`supervisor_id.in.(${memberIds.join(',')}),supervisee_id.in.(${memberIds.join(',')})`);

        const supervisees = new Set();
        relationships?.forEach(rel => supervisees.add(rel.supervisee_id));

        metrics.push({
          provider_id: provider.id.toString(),
          provider_name: provider.name,
          supervision_capacity: 20, // Placeholder
          current_supervisees: supervisees.size,
          compliance_score: provider.compliance_score || 0,
          performance_rating: provider.performance_rating || 0
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting provider supervision metrics:', error);
      return [];
    }
  }

  async createSupervisionRelationship(
    supervisorId: string,
    superviseeId: string,
    supervisionType: 'direct' | 'indirect' | 'clinical' | 'administrative',
    locationId?: string,
    providerId?: string
  ): Promise<SupervisionRelationship> {
    try {
      // Get supervisor and supervisee details
      const { data: supervisor } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', supervisorId)
        .single();

      const { data: supervisee } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', superviseeId)
        .single();

      const relationshipData = {
        id: crypto.randomUUID(),
        supervisor_id: supervisorId,
        supervisee_id: superviseeId,
        supervisor_role: supervisor?.role || 'unknown',
        supervisee_role: supervisee?.role || 'unknown',
        supervisor_name: supervisor?.display_name || 'Unknown',
        supervisee_name: supervisee?.display_name || 'Unknown',
        status: 'active' as const,
        location_id: locationId,
        provider_id: providerId,
        start_date: new Date().toISOString(),
        supervision_type: supervisionType,
        requirements_met: {},
        progress_notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Note: This would normally insert into a supervision_relationships table
      // For now, we return the mock data structure
      return relationshipData;
    } catch (error) {
      console.error('Error creating supervision relationship:', error);
      throw error;
    }
  }

  async updateSupervisionProgress(
    relationshipId: string,
    requirements: Record<string, boolean>,
    notes: string[]
  ): Promise<void> {
    try {
      // This would update the supervision_relationships table
      console.log('Updating supervision progress:', { relationshipId, requirements, notes });
    } catch (error) {
      console.error('Error updating supervision progress:', error);
      throw error;
    }
  }

  async getSupervisionHierarchy(locationId?: string): Promise<any[]> {
    try {
      const { data: relationships, error } = await supabase
        .from('active_supervision_relationships')
        .select('*');

      if (error) throw error;

      // Build hierarchy tree
      const hierarchy = this.buildSupervisionTree(relationships || []);
      return hierarchy;
    } catch (error) {
      console.error('Error getting supervision hierarchy:', error);
      return [];
    }
  }

  private calculateComplianceRate(relationships: any[]): number {
    if (relationships.length === 0) return 100;
    
    const compliantRelationships = relationships.filter(rel => 
      rel.status === 'active' && 
      new Date(rel.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    );

    return Math.round((compliantRelationships.length / relationships.length) * 100);
  }

  private buildSupervisionTree(relationships: any[]): any[] {
    // Build a tree structure from flat supervision relationships
    const supervisorMap = new Map();
    
    relationships.forEach(rel => {
      if (!supervisorMap.has(rel.supervisor_id)) {
        supervisorMap.set(rel.supervisor_id, {
          id: rel.supervisor_id,
          name: rel.supervisor_name,
          role: rel.supervisor_role,
          supervisees: []
        });
      }
      
      supervisorMap.get(rel.supervisor_id).supervisees.push({
        id: rel.supervisee_id,
        name: rel.supervisee_name,
        role: rel.supervisee_role,
        status: rel.status
      });
    });

    return Array.from(supervisorMap.values());
  }
}

export const enhancedSupervisionService = new EnhancedSupervisionService();
