// Mock service to simulate backend tier management functionality

import { TierInfo, TierSwitchValidation } from '../../hooks/useComplianceTier';

// Define mock data for our service
const MOCK_TIER_INFO: Record<string, TierInfo> = {
  '123': {
    tier: 'basic',
    role: 'IT',
    completion_percentage: 75,
    completed_requirements: 3,
    requirements_count: 4,
    can_advance_tier: true,
    last_updated: new Date().toISOString()
  },
  '456': {
    tier: 'robust',
    role: 'IC',
    completion_percentage: 45,
    completed_requirements: 5,
    requirements_count: 11,
    can_advance_tier: false,
    advancement_blocked_reason: 'Must complete at least 80% of requirements',
    last_updated: new Date().toISOString()
  }
};

// Mock tier comparison data
const MOCK_TIER_COMPARISON = {
  'IT': {
    basic: {
      requirementsCount: '3-5',
      timeToComplete: '2-4 weeks',
      mentoring: false,
      advancedFeatures: false
    },
    robust: {
      requirementsCount: '6-8',
      timeToComplete: '6-12 weeks',
      mentoring: true,
      advancedFeatures: true
    }
  },
  'IP': {
    basic: {
      requirementsCount: '3-4',
      timeToComplete: '2-3 weeks',
      mentoring: false,
      advancedFeatures: false
    },
    robust: {
      requirementsCount: '5-6',
      timeToComplete: '8-10 weeks',
      mentoring: true,
      advancedFeatures: true
    }
  },
  'IC': {
    basic: {
      requirementsCount: '4-6',
      timeToComplete: '4-6 weeks',
      mentoring: false,
      advancedFeatures: false
    },
    robust: {
      requirementsCount: '7-9',
      timeToComplete: '10-14 weeks',
      mentoring: true,
      advancedFeatures: true
    }
  },
  'AP': {
    basic: {
      requirementsCount: '3',
      timeToComplete: '2-4 weeks',
      mentoring: false,
      advancedFeatures: false
    },
    robust: {
      requirementsCount: '5-7',
      timeToComplete: '8-12 weeks',
      mentoring: true,
      advancedFeatures: true
    }
  }
};

// Export service methods
export const ComplianceTierService = {
  /**
   * Get user's tier information
   */
  async getUserTierInfo(userId: string): Promise<TierInfo> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data or generate default data if user not found
    return MOCK_TIER_INFO[userId] || {
      tier: 'basic',
      role: 'IT',
      completion_percentage: 0,
      completed_requirements: 0,
      requirements_count: 4,
      can_advance_tier: false,
      advancement_blocked_reason: 'Complete required basic tier requirements first',
      last_updated: new Date().toISOString()
    };
  },
  
  /**
   * Validate if a user can switch to a target tier
   */
  async validateTierSwitch(userId: string, targetTier: string): Promise<TierSwitchValidation> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Get current tier info
    const tierInfo = await this.getUserTierInfo(userId);
    
    // If already on the target tier, no need to switch
    if (tierInfo.tier === targetTier) {
      return {
        allowed: false,
        reason: `User is already on the ${targetTier} tier`
      };
    }
    
    // For switching to robust tier, check completion requirements
    if (targetTier === 'robust' && tierInfo.completion_percentage < 75) {
      return {
        allowed: false,
        reason: 'Must complete at least 75% of basic tier requirements',
        impact: {
          requirementsToAdd: 8,
          requirementsToRemove: 0,
          requirementsToPreserve: 4,
          estimatedTimeToComplete: '6-12 weeks'
        }
      };
    }
    
    // For downgrading to basic tier, always allowed
    if (targetTier === 'basic') {
      return {
        allowed: true,
        impact: {
          requirementsToAdd: 0,
          requirementsToRemove: 6,
          requirementsToPreserve: 4,
          estimatedTimeToComplete: '2-4 weeks'
        }
      };
    }
    
    // Default case - allowed with impact analysis
    return {
      allowed: true,
      impact: {
        requirementsToAdd: targetTier === 'robust' ? 8 : 0,
        requirementsToRemove: targetTier === 'basic' ? 6 : 0,
        requirementsToPreserve: 4,
        estimatedTimeToComplete: targetTier === 'robust' ? '6-12 weeks' : '2-4 weeks'
      }
    };
  },
  
  /**
   * Switch a user's tier
   */
  async switchTier(userId: string, targetTier: string, reason: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Validate the switch first
    const validation = await this.validateTierSwitch(userId, targetTier);
    
    if (!validation.allowed) {
      throw new Error(`Cannot switch tier: ${validation.reason}`);
    }
    
    // Update mock data
    if (MOCK_TIER_INFO[userId]) {
      MOCK_TIER_INFO[userId].tier = targetTier as 'basic' | 'robust';
      MOCK_TIER_INFO[userId].last_updated = new Date().toISOString();
      
      // Reset progress for new tier
      if (targetTier === 'robust') {
        MOCK_TIER_INFO[userId].completion_percentage = 0;
        MOCK_TIER_INFO[userId].completed_requirements = 0;
        MOCK_TIER_INFO[userId].requirements_count = 8;
        MOCK_TIER_INFO[userId].can_advance_tier = false;
      } else {
        MOCK_TIER_INFO[userId].completion_percentage = 0;
        MOCK_TIER_INFO[userId].completed_requirements = 0;
        MOCK_TIER_INFO[userId].requirements_count = 4;
        MOCK_TIER_INFO[userId].can_advance_tier = false;
      }
    }
    
    return true;
  },
  
  /**
   * Get tier comparison data for a specific role
   */
  async getTierComparisonData(role: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock comparison data
    return MOCK_TIER_COMPARISON[role as keyof typeof MOCK_TIER_COMPARISON] || MOCK_TIER_COMPARISON['IT'];
  }
};