import { format } from 'date-fns';

export interface ReportFilter {
  role?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  requirementType?: string;
}

export class ComplianceReportService {
  /**
   * Generate a compliance status report
   */
  static async generateStatusReport(
    filters: ReportFilter = {}
  ): Promise<{ data: any[]; stats: any }> {
    try {
      // In a real implementation, this would fetch data from Supabase
      // Simulating API call to fetch data based on filters
      const data = await this.fetchReportData(filters);
      
      // Calculate statistics
      const stats = this.calculateReportStatistics(data);
      
      // Format data for report
      const formattedData = data.map(record => ({
        user_id: record.user_id,
        user_name: record.profiles.full_name,
        user_email: record.profiles.email,
        user_role: record.profiles.role,
        compliance_tier: record.profiles.compliance_tier,
        requirement_id: record.requirement_id,
        requirement_name: record.compliance_requirements.name,
        requirement_type: record.compliance_requirements.requirement_type,
        status: record.status,
        is_mandatory: record.compliance_requirements.is_mandatory,
        points_value: record.compliance_requirements.points_value,
        last_updated: record.updated_at,
        last_submission: record.last_submission_date
      }));
      
      return { data: formattedData, stats };
    } catch (error) {
      console.error('Failed to generate compliance status report:', error);
      throw error;
    }
  }
  
  /**
   * Export compliance report as Excel
   */
  static async exportToExcel(filters: ReportFilter = {}): Promise<Blob> {
    try {
      const { data, stats } = await this.generateStatusReport(filters);
      
      // In a real implementation, this would create an Excel file using a library like xlsx
      console.log('Exporting data to Excel:', { data, stats });
      
      // Mock Excel generation
      const mockExcelBlob = new Blob(['Excel data would go here'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      return mockExcelBlob;
    } catch (error) {
      console.error('Failed to export compliance report to Excel:', error);
      throw error;
    }
  }
  
  /**
   * Mock fetching report data
   */
  private static async fetchReportData(filters: ReportFilter): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    const mockData = [
      {
        user_id: 'user-1',
        requirement_id: 'req-1',
        status: 'approved',
        created_at: '2025-05-01T00:00:00Z',
        updated_at: '2025-05-10T00:00:00Z',
        last_submission_date: '2025-05-08T00:00:00Z',
        profiles: {
          id: 'user-1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          role: 'IT',
          compliance_tier: 'basic'
        },
        compliance_requirements: {
          id: 'req-1',
          name: 'Data Protection Policy',
          description: 'Implement a data protection policy',
          requirement_type: 'document',
          is_mandatory: true,
          points_value: 10
        }
      },
      {
        user_id: 'user-1',
        requirement_id: 'req-2',
        status: 'pending',
        created_at: '2025-05-01T00:00:00Z',
        updated_at: '2025-05-01T00:00:00Z',
        last_submission_date: null,
        profiles: {
          id: 'user-1',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          role: 'IT',
          compliance_tier: 'basic'
        },
        compliance_requirements: {
          id: 'req-2',
          name: 'Security Training',
          description: 'Complete security awareness training',
          requirement_type: 'training',
          is_mandatory: true,
          points_value: 15
        }
      },
      {
        user_id: 'user-2',
        requirement_id: 'req-1',
        status: 'approved',
        created_at: '2025-05-01T00:00:00Z',
        updated_at: '2025-05-12T00:00:00Z',
        last_submission_date: '2025-05-12T00:00:00Z',
        profiles: {
          id: 'user-2',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          role: 'IC',
          compliance_tier: 'robust'
        },
        compliance_requirements: {
          id: 'req-1',
          name: 'Data Protection Policy',
          description: 'Implement a data protection policy',
          requirement_type: 'document',
          is_mandatory: true,
          points_value: 10
        }
      },
      {
        user_id: 'user-2',
        requirement_id: 'req-3',
        status: 'in_progress',
        created_at: '2025-05-01T00:00:00Z',
        updated_at: '2025-05-15T00:00:00Z',
        last_submission_date: null,
        profiles: {
          id: 'user-2',
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          role: 'IC',
          compliance_tier: 'robust'
        },
        compliance_requirements: {
          id: 'req-3',
          name: 'Annual Security Assessment',
          description: 'Complete annual security assessment',
          requirement_type: 'assessment',
          is_mandatory: true,
          points_value: 20
        }
      }
    ];
    
    // Apply filters
    let filteredData = [...mockData];
    
    if (filters.role) {
      filteredData = filteredData.filter(item => item.profiles.role === filters.role);
    }
    
    if (filters.tier) {
      filteredData = filteredData.filter(item => item.profiles.compliance_tier === filters.tier);
    }
    
    if (filters.status) {
      filteredData = filteredData.filter(item => item.status === filters.status);
    }
    
    if (filters.requirementType) {
      filteredData = filteredData.filter(
        item => item.compliance_requirements.requirement_type === filters.requirementType
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredData = filteredData.filter(item => new Date(item.updated_at) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredData = filteredData.filter(item => new Date(item.updated_at) <= toDate);
    }
    
    return filteredData;
  }
  
  /**
   * Calculate statistics for the report data
   */
  private static calculateReportStatistics(data: any[]): any {
    // Initialize stats object
    const stats = {
      totalRequirements: data.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      completionRate: 0,
      mandatoryCompletionRate: 0,
      avgDaysToCompletion: 0,
      byRole: {} as any,
      byTier: {} as any,
      byType: {} as any
    };
    
    // Count by status
    stats.completed = data.filter(r => r.status === 'approved').length;
    stats.inProgress = data.filter(r => ['in_progress', 'submitted'].includes(r.status)).length;
    stats.pending = data.filter(r => r.status === 'pending').length;
    
    // Overall completion rate
    stats.completionRate = data.length > 0 
      ? Math.round((stats.completed / data.length) * 100) 
      : 0;
    
    // Mandatory requirements completion rate
    const mandatoryReqs = data.filter(r => r.compliance_requirements.is_mandatory);
    const completedMandatory = mandatoryReqs.filter(r => r.status === 'approved').length;
    stats.mandatoryCompletionRate = mandatoryReqs.length > 0 
      ? Math.round((completedMandatory / mandatoryReqs.length) * 100) 
      : 0;
    
    // Average days to completion
    const completedWithDates = data.filter(r => 
      r.status === 'approved' && 
      r.created_at && 
      r.updated_at
    );
    
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, r) => {
        const createdDate = new Date(r.created_at);
        const completedDate = new Date(r.updated_at);
        const days = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      
      stats.avgDaysToCompletion = Math.round(totalDays / completedWithDates.length);
    }
    
    // Group by role
    const roles = [...new Set(data.map(r => r.profiles.role))];
    roles.forEach(role => {
      const roleData = data.filter(r => r.profiles.role === role);
      const roleCompleted = roleData.filter(r => r.status === 'approved').length;
      
      stats.byRole[role] = {
        total: roleData.length,
        completed: roleCompleted,
        completionRate: roleData.length > 0 
          ? Math.round((roleCompleted / roleData.length) * 100) 
          : 0
      };
    });
    
    // Group by tier
    const tiers = [...new Set(data.map(r => r.profiles.compliance_tier))];
    tiers.forEach(tier => {
      const tierData = data.filter(r => r.profiles.compliance_tier === tier);
      const tierCompleted = tierData.filter(r => r.status === 'approved').length;
      
      stats.byTier[tier] = {
        total: tierData.length,
        completed: tierCompleted,
        completionRate: tierData.length > 0 
          ? Math.round((tierCompleted / tierData.length) * 100) 
          : 0
      };
    });
    
    // Group by requirement type
    const types = [...new Set(data.map(r => r.compliance_requirements.requirement_type))];
    types.forEach(type => {
      const typeData = data.filter(r => r.compliance_requirements.requirement_type === type);
      const typeCompleted = typeData.filter(r => r.status === 'approved').length;
      
      stats.byType[type] = {
        total: typeData.length,
        completed: typeCompleted,
        completionRate: typeData.length > 0 
          ? Math.round((typeCompleted / typeData.length) * 100) 
          : 0
      };
    });
    
    return stats;
  }
}