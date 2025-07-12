import { supabase } from '@/integrations/supabase/client';

export interface ComplianceMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  required_for_roles: string[];
  measurement_type: 'boolean' | 'percentage' | 'date' | 'numeric';
  target_value: any;
  weight: number;
  is_active: boolean;
  applicable_tiers?: string; 
  created_at: string;
  updated_at: string;
}

export interface UserComplianceRecord {
  id: string;
  user_id: string;
  metric_id: string;
  current_value: any;
  compliance_status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable'; 
  last_checked_at: string;
  next_check_due: string;
  notes: string;
  verified_by: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
  compliance_metrics?: ComplianceMetric; 
}

export interface ComplianceAction {
  id: string;
  user_id: string;
  metric_id: string;
  action_type: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  assigned_by?: string; 
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  compliance_metrics?: ComplianceMetric;
}

export interface ComplianceSummary {
  user_id: string;
  overall_score: number;
  total_metrics: number;
  compliant_count: number;
  warning_count: number;
  non_compliant_count: number;
  pending_count: number;
  overdue_actions: number;
}

export interface ComplianceDocument {
  id: string;
  user_id: string;
  metric_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  expiry_date?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  rejection_reason?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  compliance_metrics?: ComplianceMetric; 
}

export interface DocumentRequirement {
  id: string;
  metric_id: string;
  document_type: string;
  required_file_types: string[];
  max_file_size_mb: number;
  requires_expiry_date: boolean;
  auto_expire_days?: number;
  description: string;
  example_files?: string[];
  created_at: string;
  updated_at: string;
}

export class ComplianceService {
  // Get all compliance metrics
  static async getComplianceMetrics(filters?: { role?: string, tier?: 'basic' | 'robust' }): Promise<ComplianceMetric[]> {
    let query = supabase
      .from('compliance_metrics')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (filters?.role) {
      query = query.or(`required_for_roles.cs.{${filters.role}},required_for_roles.eq.{}`);
    }

    if (filters?.tier) {
      query = query.like('applicable_tiers', `%${filters.tier}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as ComplianceMetric[] || [];
  }

  // Get compliance metrics for a specific role
  static async getComplianceMetricsForRole(role: string): Promise<ComplianceMetric[]> {
    const { data, error } = await supabase
      .from('compliance_metrics')
      .select('*')
      .eq('is_active', true)
      .or(`required_for_roles.cs.{${role}},required_for_roles.eq.{}`)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as unknown as ComplianceMetric[] || [];
  }

  // Create or update compliance metric (SA/AD only)
  static async upsertComplianceMetric(metric: Partial<ComplianceMetric>): Promise<ComplianceMetric> {
    const upsertData: any = { 
      ...metric,
      name: metric.name || 'Untitled Metric', 
      description: metric.description || '',
      category: metric.category || 'general',
      required_for_roles: metric.required_for_roles || [],
      measurement_type: metric.measurement_type || 'boolean', 
      target_value: metric.target_value ?? true, 
      weight: metric.weight ?? 0,
      is_active: metric.is_active ?? true,
      applicable_tiers: metric.applicable_tiers || 'basic,robust',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_metrics')
      .upsert(upsertData)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ComplianceMetric;
  }

  // Delete compliance metric (SA/AD only)
  static async deleteComplianceMetric(metricId: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_metrics')
      .update({ is_active: false })
      .eq('id', metricId);

    if (error) throw error;
  }

  // Get user compliance records
  static async getUserComplianceRecords(userId: string): Promise<UserComplianceRecord[]> {
    const { data, error } = await supabase
      .from('user_compliance_records')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          description,
          category,
          measurement_type,
          target_value,
          weight,
          applicable_tiers 
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as unknown as UserComplianceRecord[] || [];
  }

  // Get compliance records for all users (SA/AD only)
  static async getAllComplianceRecords(): Promise<UserComplianceRecord[]> {
    const { data, error } = await supabase
      .from('user_compliance_records')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          description,
          category,
          measurement_type,
          target_value,
          weight,
          applicable_tiers
        ),
        profiles!user_compliance_records_user_id_fkey (
          id,
          display_name,
          email,
          role,
          compliance_tier 
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as unknown as UserComplianceRecord[] || [];
  }

  // Update compliance record (includes 'not_applicable' status)
  static async updateComplianceRecord(
    userId: string,
    metricId: string,
    currentValue: any,
    complianceStatus: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable',
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('update_compliance_record', {
      p_user_id: userId,
      p_metric_id: metricId,
      p_current_value: currentValue,
      p_compliance_status: complianceStatus,
      p_notes: notes || null
    } as any); 

    if (error) throw error;
    return data;
  }

  // Get user compliance summary
  static async getUserComplianceSummary(userId: string): Promise<ComplianceSummary> {
    const { data, error } = await supabase.rpc('get_user_compliance_summary', {
      p_user_id: userId
    });

    if (error) throw error;
    return data?.[0] || {
      user_id: userId,
      overall_score: 0,
      total_metrics: 0,
      compliant_count: 0,
      warning_count: 0,
      non_compliant_count: 0,
      pending_count: 0,
      overdue_actions: 0
    };
  }

  // Get compliance actions for user
  static async getUserComplianceActions(userId: string): Promise<ComplianceAction[]> {
    const { data, error } = await supabase
      .from('compliance_actions')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as unknown as ComplianceAction[] || []; 
  }

  // Create compliance action
  static async createComplianceAction(action: Partial<ComplianceAction>): Promise<ComplianceAction> {
    const insertData: any = {
      ...action,
      action_type: action.action_type || 'general', 
      title: action.title || 'New Action', 
      metric_id: action.metric_id!, 
      user_id: action.user_id!, 
      priority: action.priority || 'medium', 
      status: action.status || 'open', 
      assigned_by: (await supabase.auth.getUser()).data.user?.id || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_actions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ComplianceAction;
  }

  // Update compliance action status
  static async updateComplianceActionStatus(
    actionId: string,
    status: 'open' | 'in_progress' | 'completed' | 'dismissed'
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_by = (await supabase.auth.getUser()).data.user?.id;
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('compliance_actions')
      .update(updateData)
      .eq('id', actionId);

    if (error) throw error;
  }

  // Get compliance audit log
  static async getComplianceAuditLog(userId?: string): Promise<any[]> {
    let query = supabase
      .from('compliance_audit_log')
      .select(`
        *,
        compliance_metrics (
          name,
          category
        ),
        profiles!compliance_audit_log_performed_by_fkey (
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || []; 
  }

  // Calculate overall compliance score for provider
  static async getProviderComplianceScore(providerId: string): Promise<number> {
    const { data: providerUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, compliance_tier'); 

    if (usersError) {
      console.error('Error fetching provider users with compliance tier:', usersError);
      // Return 0 or throw, depending on desired error handling
      return 0; 
    }

    // Explicitly cast to the expected array type
    // Explicitly cast to unknown first to bypass strict overlap checking, then to the specific type
    const typedProviderUsers: { id: string; compliance_tier: 'basic' | 'robust' | null }[] = providerUsers as unknown as { id: string; compliance_tier: 'basic' | 'robust' | null }[];

    if (!typedProviderUsers || typedProviderUsers.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let userCount = 0;

    for (const user of typedProviderUsers) {
      const summary = await this.getUserComplianceSummary(user.id);
      totalScore += summary.overall_score;
      userCount++;
    }

    return userCount > 0 ? Math.round(totalScore / userCount) : 0;
  }

  // Get compliance requirements breakdown for provider
  static async getProviderComplianceBreakdown(providerId: string): Promise<{
    requirements: Array<{
      name: string;
      category: string;
      status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable'; 
      score: number;
    }>;
    actions: ComplianceAction[];
  }> {
    const records = await this.getUserComplianceRecords(providerId);
    const actions = await this.getUserComplianceActions(providerId);

    const requirements = records.map(record => ({
      name: record.compliance_metrics?.name || 'Unknown',
      category: record.compliance_metrics?.category || 'general',
      status: record.compliance_status, 
      score: this.calculateMetricScore(record)
    }));

    return { requirements, actions };
  }

  // Helper function to calculate metric score
  static calculateMetricScore(record: UserComplianceRecord): number {
    switch (record.compliance_status) {
      case 'compliant':
        return 100;
      case 'warning':
        return 75;
      case 'non_compliant':
        return 0;
      case 'pending':
      case 'not_applicable': 
      default:
        return 50;
    }
  }

  // Get team compliance overview
  static async getTeamComplianceOverview(teamId: string): Promise<{
    compliantMembers: number;
    nonCompliantMembers: number;
    pendingMembers: number;
    overallComplianceRate: number;
  }> {
    try {
      // Get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (membersError) throw membersError;

      if (!teamMembers || teamMembers.length === 0) {
        return {
          compliantMembers: 0,
          nonCompliantMembers: 0,
          pendingMembers: 0,
          overallComplianceRate: 0
        };
      }

      // Get compliance summaries for all team members
      const complianceSummaries = await Promise.all(
        teamMembers.map(member => this.getUserComplianceSummary(member.user_id))
      );

      let compliantMembers = 0;
      let nonCompliantMembers = 0;
      let pendingMembers = 0;
      let totalScore = 0;

      complianceSummaries.forEach(summary => {
        totalScore += summary.overall_score;
        
        if (summary.overall_score >= 85) {
          compliantMembers++;
        } else if (summary.overall_score >= 50) {
          pendingMembers++;
        } else {
          nonCompliantMembers++;
        }
      });

      const overallComplianceRate = teamMembers.length > 0 
        ? Math.round(totalScore / teamMembers.length) 
        : 0;

      return {
        compliantMembers,
        nonCompliantMembers,
        pendingMembers,
        overallComplianceRate
      };
    } catch (error) {
      console.error('Error getting team compliance overview:', error);
      return {
        compliantMembers: 0,
        nonCompliantMembers: 0,
        pendingMembers: 0,
        overallComplianceRate: 0
      };
    }
  }

  // Document Management Methods

  // Get document requirements for a metric
  static async getDocumentRequirements(metricId: string): Promise<DocumentRequirement | null> {
    const { data, error } = await supabase
      .from('compliance_document_requirements')
      .select('*')
      .eq('metric_id', metricId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; 
    return data as unknown as DocumentRequirement;
  }

  // Get user's compliance documents
  static async getUserComplianceDocuments(userId: string, metricId?: string): Promise<ComplianceDocument[]> {
    let query = supabase
      .from('compliance_documents')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (metricId) {
      query = query.eq('metric_id', metricId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as ComplianceDocument[] || [];
  }

  // Upload compliance document
  static async uploadComplianceDocument(
    userId: string,
    metricId: string,
    file: File,
    expiryDate?: string
  ): Promise<string> {
    try {
      // First upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${metricId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Then record in database
      const { data, error } = await supabase.rpc('upload_compliance_document', {
        p_user_id: userId,
        p_metric_id: metricId,
        p_file_name: file.name,
        p_file_path: uploadData.path,
        p_file_type: fileExt || 'unknown',
        p_file_size: file.size,
        p_expiry_date: expiryDate || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading compliance document:', error);
      throw error;
    }
  }

  // Verify compliance document (SA/AD only)
  static async verifyComplianceDocument(
    documentId: string,
    verificationStatus: 'approved' | 'rejected', 
    notes?: string,
    rejectionReason?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('verify_compliance_document', {
      p_document_id: documentId,
      p_verification_status: verificationStatus,
      p_verification_notes: notes || null,
      p_rejection_reason: rejectionReason || null
    } as any); 
    if (error) throw error;
  }

  // Download compliance document
  static async downloadComplianceDocument(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('compliance-documents')
      .download(filePath);

    if (error) throw error;
    return data;
  }

  // Get document download URL
  static async getDocumentDownloadUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('compliance-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || '';
  }

  // Check for expired documents
  static async checkExpiredDocuments(): Promise<number> {
    const { data, error } = await supabase.rpc('check_expired_compliance_documents');
    if (error) throw error;
    return data || 0;
  }

  // Get compliance documents for verification (SA/AD only)
  static async getDocumentsForVerification(): Promise<ComplianceDocument[]> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          category
        ),
        profiles!compliance_documents_user_id_fkey (
          id,
          display_name,
          email
        )
      `)
      .eq('verification_status', 'pending')
      .eq('is_current', true)
      .order('upload_date', { ascending: true });

    if (error) throw error;
    return data as unknown as ComplianceDocument[] || [];
  }

  // Create document requirement (SA/AD only)
  static async createDocumentRequirement(requirement: Partial<DocumentRequirement>): Promise<DocumentRequirement> {
    const insertData: any = {
      ...requirement,
      document_type: requirement.document_type || 'general', 
      metric_id: requirement.metric_id!, 
      required_file_types: requirement.required_file_types || [],
      max_file_size_mb: requirement.max_file_size_mb || 0,
      requires_expiry_date: requirement.requires_expiry_date || false,
      description: requirement.description || 'No description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('compliance_document_requirements')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DocumentRequirement;
  }

  // Update document requirement (SA/AD only)
  static async updateDocumentRequirement(
    requirementId: string,
    updates: Partial<DocumentRequirement>
  ): Promise<DocumentRequirement> {
    const { data, error } = await supabase
      .from('compliance_document_requirements')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any) 
      .eq('id', requirementId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DocumentRequirement;
  }

  // Delete all user compliance records (helper for tier switching)
  static async deleteUserComplianceRecords(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_compliance_records')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user compliance records:', error);
      throw error;
    }
  }
}
