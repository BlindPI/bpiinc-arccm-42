
import { QueryClient } from '@tanstack/react-query';

export class QueryInvalidationService {
  private static instance: QueryInvalidationService;
  private queryClient: QueryClient | null = null;
  
  private constructor() {}
  
  public static getInstance(): QueryInvalidationService {
    if (!QueryInvalidationService.instance) {
      QueryInvalidationService.instance = new QueryInvalidationService();
    }
    return QueryInvalidationService.instance;
  }
  
  public setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }
  
  /**
   * Invalidate certificate-related queries
   */
  public invalidateCertificates(): void {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['certificates'] });
    this.queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    this.queryClient.invalidateQueries({ queryKey: ['certificateStats'] });
  }
  
  /**
   * Invalidate profile-related queries
   */
  public invalidateProfiles(): void {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['profile'] });
    this.queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
  }
  
  /**
   * Invalidate notification-related queries
   */
  public invalidateNotifications(): void {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
    this.queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
  }
  
  /**
   * Invalidate course-related queries
   */
  public invalidateCourses(): void {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['courses'] });
    this.queryClient.invalidateQueries({ queryKey: ['courseOfferings'] });
  }
  
  /**
   * Invalidate role management related queries
   */
  public invalidateRoleManagement(): void {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['transitionRequests'] });
    this.queryClient.invalidateQueries({ queryKey: ['roles'] });
  }
  
  /**
   * Invalidate multiple related query types
   */
  public invalidateAll(): void {
    this.invalidateCertificates();
    this.invalidateProfiles();
    this.invalidateNotifications();
    this.invalidateCourses();
    this.invalidateRoleManagement();
  }
}

// Initialize the service
export const queryInvalidationService = QueryInvalidationService.getInstance();
