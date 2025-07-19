/**
 * Integration tests for roster enrollment services
 * Tests the complete workflow from database foundation to service layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RosterEnrollmentService } from '../rosterEnrollmentService';
import { EnrollmentService } from '../enrollmentService';
import { RosterEnrollmentIntegration } from '../rosterEnrollmentIntegration';
import type { 
  RosterEnrollmentParams,
  CapacityValidationResult,
  RosterCapacityInfo 
} from '@/types/roster-enrollment';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      sql: vi.fn()
    })),
    rpc: vi.fn()
  }
}));

describe('RosterEnrollmentService Integration Tests', () => {
  const mockRosterId = 'test-roster-123';
  const mockStudentId = 'test-student-456';
  const mockEnrolledBy = 'test-admin-789';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Enrollment Workflow', () => {
    it('should follow TransactionManager pattern for enrollment', async () => {
      // Mock successful roster and capacity check
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Test Roster',
        max_capacity: 20,
        current_enrollment: 15,
        status: 'ACTIVE'
      };

      const mockStudent = {
        id: mockStudentId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };

      const mockEnrollment = {
        id: 'enrollment-123',
        roster_id: mockRosterId,
        student_profile_id: mockStudentId,
        enrollment_status: 'enrolled',
        enrolled_at: new Date().toISOString()
      };

      // Setup mock responses
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock the transaction steps
      supabase.from().single
        .mockResolvedValueOnce({ data: mockRoster, error: null }) // validateCapacity
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // checkExistingEnrollment
        .mockResolvedValueOnce({ data: mockStudent, error: null }) // validateStudent
        .mockResolvedValueOnce({ data: mockRoster, error: null }); // getUpdatedCapacity

      supabase.from().insert().select().single
        .mockResolvedValueOnce({ data: mockEnrollment, error: null }) // createEnrollment
        .mockResolvedValueOnce({ data: { id: 'notification-123' }, error: null }); // createNotification

      const params: RosterEnrollmentParams = {
        rosterId: mockRosterId,
        studentId: mockStudentId,
        enrolledBy: mockEnrolledBy,
        userRole: 'AP',
        enrollmentType: 'standard'
      };

      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(params);

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(7); // All steps completed
      expect(result.results.enrollment).toBeDefined();
      expect(result.results.capacityCheck).toBeDefined();
    });

    it('should handle capacity exceeded error correctly', async () => {
      // Mock roster at full capacity
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Full Roster',
        max_capacity: 20,
        current_enrollment: 20,
        status: 'ACTIVE'
      };

      const { supabase } = await import('@/integrations/supabase/client');
      supabase.from().single.mockResolvedValueOnce({ data: mockRoster, error: null });

      const params: RosterEnrollmentParams = {
        rosterId: mockRosterId,
        studentId: mockStudentId,
        enrolledBy: mockEnrolledBy,
        userRole: 'AP',
        enrollmentType: 'standard'
      };

      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('full capacity');
      expect(result.stepsCompleted).toBe(0); // Should fail at capacity validation
    });

    it('should support force enrollment for administrators', async () => {
      // Mock roster at full capacity
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Full Roster',
        max_capacity: 20,
        current_enrollment: 20,
        status: 'ACTIVE'
      };

      const mockStudent = {
        id: mockStudentId,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com'
      };

      const mockEnrollment = {
        id: 'forced-enrollment-123',
        roster_id: mockRosterId,
        student_profile_id: mockStudentId,
        enrollment_status: 'enrolled',
        enrolled_at: new Date().toISOString()
      };

      const { supabase } = await import('@/integrations/supabase/client');
      
      supabase.from().single
        .mockResolvedValueOnce({ data: mockRoster, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockStudent, error: null })
        .mockResolvedValueOnce({ data: { ...mockRoster, current_enrollment: 21 }, error: null });

      supabase.from().insert().select().single
        .mockResolvedValueOnce({ data: mockEnrollment, error: null })
        .mockResolvedValueOnce({ data: { id: 'notification-456' }, error: null });

      const params: RosterEnrollmentParams = {
        rosterId: mockRosterId,
        studentId: mockStudentId,
        enrolledBy: mockEnrolledBy,
        userRole: 'ADMIN',
        enrollmentType: 'manual',
        forceEnrollment: true
      };

      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(params);

      expect(result.success).toBe(true);
      expect(result.results.enrollment?.enrollment_status).toBe('enrolled');
    });
  });

  describe('Capacity Validation Integration', () => {
    it('should provide comprehensive capacity information', async () => {
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Test Roster',
        max_capacity: 25,
        current_enrollment: 20,
        status: 'ACTIVE'
      };

      const mockWaitlistData = [
        {
          student_profile_id: 'waitlist-student-1',
          enrolled_at: '2024-01-01T10:00:00Z',
          student_enrollment_profiles: { first_name: 'Wait', last_name: 'Listed' }
        }
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      
      supabase.from().single
        .mockResolvedValueOnce({ data: mockRoster, error: null });

      supabase.from().select().eq().eq().order
        .mockResolvedValueOnce({ data: mockWaitlistData, error: null });

      const result = await EnrollmentService.checkRosterCapacityStatus(mockRosterId, 3, true);

      expect(result.success).toBe(true);
      expect(result.capacity.max_capacity).toBe(25);
      expect(result.capacity.current_enrollment).toBe(20);
      expect(result.capacity.available_spots).toBe(5);
      expect(result.capacity.can_enroll).toBe(true);
      expect(result.waitlist.total).toBe(1);
      expect(result.recommendations).toContain('Consider promoting 1 students from waitlist');
    });

    it('should generate appropriate warnings for nearly full rosters', async () => {
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Nearly Full Roster',
        max_capacity: 20,
        current_enrollment: 19,
        status: 'ACTIVE'
      };

      const { supabase } = await import('@/integrations/supabase/client');
      supabase.from().single.mockResolvedValueOnce({ data: mockRoster, error: null });
      supabase.from().select().eq().eq().order.mockResolvedValueOnce({ data: [], error: null });

      const result = await EnrollmentService.checkRosterCapacityStatus(mockRosterId, 0, true);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Roster is nearly full (90%+ capacity)');
    });
  });

  describe('Waitlist Management', () => {
    it('should promote students from waitlist when capacity becomes available', async () => {
      const mockCapacityValidation: CapacityValidationResult = {
        success: true,
        roster: { id: mockRosterId, name: 'Test Roster', status: 'ACTIVE' },
        capacity: {
          success: true,
          roster_id: mockRosterId,
          roster_name: 'Test Roster',
          max_capacity: 20,
          current_enrollment: 18,
          available_spots: 2,
          can_enroll: true,
          requested_students: 0
        },
        waitlist: {
          total: 3,
          positions: [
            { studentId: 'waitlist-1', position: 1, enrolledAt: '2024-01-01T10:00:00Z' },
            { studentId: 'waitlist-2', position: 2, enrolledAt: '2024-01-01T11:00:00Z' }
          ]
        },
        recommendations: [],
        warnings: []
      };

      const mockWaitlistedStudents = [
        {
          id: 'enrollment-1',
          student_profile_id: 'waitlist-1',
          enrolled_at: '2024-01-01T10:00:00Z',
          student_enrollment_profiles: { first_name: 'First', last_name: 'Waitlisted' }
        },
        {
          id: 'enrollment-2', 
          student_profile_id: 'waitlist-2',
          enrolled_at: '2024-01-01T11:00:00Z',
          student_enrollment_profiles: { first_name: 'Second', last_name: 'Waitlisted' }
        }
      ];

      // Mock the service methods
      const checkCapacitySpy = vi.spyOn(EnrollmentService, 'checkRosterCapacityStatus')
        .mockResolvedValueOnce(mockCapacityValidation);

      const { supabase } = await import('@/integrations/supabase/client');
      
      supabase.from().select().eq().eq().order().limit
        .mockResolvedValueOnce({ data: mockWaitlistedStudents, error: null });

      supabase.from().update().eq
        .mockResolvedValue({ error: null });

      supabase.from().select().eq().eq
        .mockResolvedValueOnce({ count: 1, error: null });

      const result = await EnrollmentService.promoteFromWaitlist(
        mockRosterId,
        'test-admin',
        'AP',
        2
      );

      expect(result.success).toBe(true);
      expect(result.promotedCount).toBe(2);
      expect(result.promotedStudents).toHaveLength(2);
      expect(result.remainingWaitlist).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should provide intelligent error handling suggestions', async () => {
      const capacityError = new Error('Roster is at full capacity') as any;
      capacityError.code = 'CAPACITY_EXCEEDED';

      const errorHandling = await RosterEnrollmentIntegration.handleEnrollmentError(
        capacityError,
        {
          rosterId: mockRosterId,
          studentId: mockStudentId,
          operation: 'enrollment',
          userRole: 'AP'
        }
      );

      expect(errorHandling.shouldRetry).toBe(false);
      expect(errorHandling.canUseWaitlist).toBe(true);
      expect(errorHandling.suggestedAction).toContain('waitlist');
      expect(errorHandling.alternativeOptions).toContain('Add to waitlist');
      expect(errorHandling.errorDetails.isCapacityIssue).toBe(true);
    });

    it('should suggest retry for transient system errors', async () => {
      const systemError = new Error('Database connection failed') as any;
      systemError.code = 'DATABASE_ERROR';

      const errorHandling = await RosterEnrollmentIntegration.handleEnrollmentError(
        systemError,
        {
          rosterId: mockRosterId,
          operation: 'enrollment',
          userRole: 'AP'
        }
      );

      expect(errorHandling.shouldRetry).toBe(true);
      expect(errorHandling.suggestedAction).toContain('Retry operation');
      expect(errorHandling.alternativeOptions).toContain('Retry enrollment');
      expect(errorHandling.errorDetails.isSystemIssue).toBe(true);
    });
  });

  describe('Service Health and Integration', () => {
    it('should perform comprehensive system health check', async () => {
      // Mock service health responses
      const mockRosterServiceHealth = {
        service: 'RosterEnrollmentService',
        status: 'HEALTHY',
        version: '1.0.0',
        features: {
          capacityValidation: true,
          waitlistManagement: true,
          batchEnrollment: true,
          auditLogging: true,
          notifications: true
        },
        performance: {
          averageResponseTime: 150,
          successRate: 99.8,
          activeTransactions: 0
        },
        lastCheck: new Date().toISOString()
      };

      const getServiceHealthSpy = vi.spyOn(RosterEnrollmentService, 'getServiceHealth')
        .mockResolvedValueOnce(mockRosterServiceHealth);

      const { supabase } = await import('@/integrations/supabase/client');
      supabase.from().select().limit.mockResolvedValueOnce({ data: [{ id: 'test' }], error: null });

      const healthCheck = await RosterEnrollmentIntegration.performSystemHealthCheck();

      expect(healthCheck.status).toBe('HEALTHY');
      expect(healthCheck.services.rosterEnrollmentService).toEqual(mockRosterServiceHealth);
      expect(healthCheck.services.databaseConnectivity).toBe(true);
      expect(healthCheck.services.enrollmentService).toBe(true);
      expect(healthCheck.recommendations).toHaveLength(0);
    });

    it('should integrate safely with legacy fallback', async () => {
      // Mock primary enrollment failure
      const enrollSpy = vi.spyOn(RosterEnrollmentService, 'enrollStudentWithCapacityCheck')
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'));

      // Mock legacy fallback success
      const { supabase } = await import('@/integrations/supabase/client');
      supabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: {
            id: 'legacy-enrollment-123',
            roster_id: mockRosterId,
            student_profile_id: mockStudentId,
            enrollment_status: 'enrolled',
            enrolled_at: new Date().toISOString()
          },
          error: null
        });

      const result = await RosterEnrollmentIntegration.enrollStudentSafely({
        rosterId: mockRosterId,
        studentId: mockStudentId,
        enrolledBy: mockEnrolledBy,
        userRole: 'AP',
        enableLegacyFallback: true
      });

      expect(result.success).toBe(true);
      expect(result.results.enrollment?.id).toBe('legacy-enrollment-123');
    });
  });

  describe('Transaction Safety and Rollback', () => {
    it('should rollback completed steps on failure', async () => {
      const mockRoster = {
        id: mockRosterId,
        roster_name: 'Test Roster',
        max_capacity: 20,
        current_enrollment: 15,
        status: 'ACTIVE'
      };

      const mockStudent = {
        id: mockStudentId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };

      const mockEnrollment = {
        id: 'enrollment-to-rollback',
        roster_id: mockRosterId,
        student_profile_id: mockStudentId,
        enrollment_status: 'enrolled',
        enrolled_at: new Date().toISOString()
      };

      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock successful steps followed by failure
      supabase.from().single
        .mockResolvedValueOnce({ data: mockRoster, error: null }) // validateCapacity
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // checkExistingEnrollment
        .mockResolvedValueOnce({ data: mockStudent, error: null }); // validateStudent

      supabase.from().insert().select().single
        .mockResolvedValueOnce({ data: mockEnrollment, error: null }); // createEnrollment

      // Mock failure in notification step
      supabase.from().insert().select().single
        .mockRejectedValueOnce(new Error('Notification service unavailable'));

      // Mock rollback operations
      supabase.from().delete().eq.mockResolvedValueOnce({ error: null });

      const params: RosterEnrollmentParams = {
        rosterId: mockRosterId,
        studentId: mockStudentId,
        enrolledBy: mockEnrolledBy,
        userRole: 'AP'
      };

      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Notification service unavailable');
      expect(result.stepsCompleted).toBeLessThan(result.totalSteps);
      
      // Verify rollback was called
      expect(supabase.from().delete().eq).toHaveBeenCalled();
    });
  });
});

describe('Integration with Database Foundation', () => {
  it('should work with database triggers and constraints', async () => {
    // This test demonstrates that the service relies on the database
    // triggers and constraints implemented in the migration
    
    const mockRoster = {
      id: mockRosterId,
      roster_name: 'Test Roster',
      max_capacity: 20,
      current_enrollment: 19, // Nearly full
      status: 'ACTIVE'
    };

    // Mock constraint violation from database trigger
    const constraintError = new Error('Cannot enroll student: Roster "Test Roster" is at full capacity (20/20)');
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    supabase.from().single
      .mockResolvedValueOnce({ data: mockRoster, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      .mockResolvedValueOnce({ data: { id: mockStudentId }, error: null });

    // Simulate database constraint violation
    supabase.from().insert().select().single
      .mockRejectedValueOnce(constraintError);

    const params: RosterEnrollmentParams = {
      rosterId: mockRosterId,
      studentId: mockStudentId,
      enrolledBy: mockEnrolledBy,
      userRole: 'AP'
    };

    const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(params);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot enroll student');
    
    // The service should handle database constraint violations gracefully
    expect(result.stepsCompleted).toBeGreaterThan(0);
  });
});