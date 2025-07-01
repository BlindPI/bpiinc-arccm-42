import { useState, useEffect } from 'react';

// Define UIRequirement interface
export interface UIRequirement {
  id: string;
  name: string;
  description: string;
  status: 'approved' | 'submitted' | 'rejected' | 'in_progress' | 'not_started';
  type: 'document' | 'certification' | 'training' | 'assessment' | string;
  progress: number;
  due_date?: string;
  category?: string;
  display_config?: {
    priority?: 'high' | 'medium' | 'low';
  };
}

interface ComplianceRequirementsResponse {
  data: UIRequirement[] | null;
  isLoading: boolean;
  error: Error | null;
}

// Mock data for requirements
const MOCK_REQUIREMENTS: Record<string, Record<string, UIRequirement[]>> = {
  'IT': {
    'basic': [
      {
        id: 'req-001',
        name: 'Complete Instructor Training Module 1',
        description: 'Complete the foundational instructor training module covering teaching basics.',
        status: 'approved',
        type: 'training',
        progress: 100,
        due_date: '2025-07-15',
        category: 'Training',
        display_config: { priority: 'high' }
      },
      {
        id: 'req-002',
        name: 'Submit Teaching Philosophy Document',
        description: 'Create and submit a document outlining your teaching philosophy and approach.',
        status: 'in_progress',
        type: 'document',
        progress: 60,
        due_date: '2025-07-30',
        category: 'Documentation'
      },
      {
        id: 'req-003',
        name: 'Complete Teaching Assessment',
        description: 'Complete an initial teaching skills assessment with a certified instructor.',
        status: 'not_started',
        type: 'assessment',
        progress: 0,
        due_date: '2025-08-15',
        category: 'Assessment',
        display_config: { priority: 'high' }
      },
      {
        id: 'req-004',
        name: 'Attend Orientation Webinar',
        description: 'Attend the mandatory orientation webinar for new instructor trainees.',
        status: 'approved',
        type: 'training',
        progress: 100,
        category: 'Training'
      }
    ],
    'robust': [
      {
        id: 'req-101',
        name: 'Complete Advanced Teaching Methodologies',
        description: 'Complete the advanced teaching methodologies course.',
        status: 'in_progress',
        type: 'training',
        progress: 35,
        due_date: '2025-09-15',
        category: 'Training',
        display_config: { priority: 'high' }
      },
      {
        id: 'req-102',
        name: 'Create Teaching Portfolio',
        description: 'Develop a comprehensive teaching portfolio with lesson plans and materials.',
        status: 'not_started',
        type: 'document',
        progress: 0,
        due_date: '2025-10-01',
        category: 'Documentation',
        display_config: { priority: 'high' }
      },
      {
        id: 'req-103',
        name: 'Complete Peer Teaching Review',
        description: 'Participate in peer teaching review with feedback from certified instructors.',
        status: 'not_started',
        type: 'assessment',
        progress: 0,
        due_date: '2025-10-15',
        category: 'Assessment'
      },
      {
        id: 'req-104',
        name: 'Attend Teaching Skills Workshop',
        description: 'Attend the in-person teaching skills workshop.',
        status: 'not_started',
        type: 'training',
        progress: 0,
        due_date: '2025-11-01',
        category: 'Training'
      },
      {
        id: 'req-105',
        name: 'Complete Mentorship Program',
        description: 'Participate in the mentorship program with an experienced instructor.',
        status: 'not_started',
        type: 'certification',
        progress: 0,
        due_date: '2025-12-01',
        category: 'Certification',
        display_config: { priority: 'high' }
      },
      {
        id: 'req-106',
        name: 'Submit Teaching Video',
        description: 'Record and submit a teaching demonstration video for review.',
        status: 'not_started',
        type: 'assessment',
        progress: 0,
        due_date: '2025-11-15',
        category: 'Assessment'
      }
    ]
  },
  // Add similar data for other roles (IP, IC, AP)
  'IP': {
    'basic': [
      // Mock data for IP role, basic tier
    ],
    'robust': [
      // Mock data for IP role, robust tier
    ]
  },
  'IC': {
    'basic': [
      // Mock data for IC role, basic tier
    ],
    'robust': [
      // Mock data for IC role, robust tier
    ]
  },
  'AP': {
    'basic': [
      // Mock data for AP role, basic tier
    ],
    'robust': [
      // Mock data for AP role, robust tier
    ]
  }
};

/**
 * Hook to fetch compliance requirements for a specific user, role, and tier
 */
export function useComplianceRequirements(
  userId?: string,
  role: string = 'IT',
  tier: string = 'basic'
): ComplianceRequirementsResponse {
  const [data, setData] = useState<UIRequirement[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRequirements = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get mock data for the specified role and tier
        const roleData = MOCK_REQUIREMENTS[role] || MOCK_REQUIREMENTS['IT'];
        const tierData = roleData[tier as 'basic' | 'robust'] || roleData['basic'];
        
        setData(tierData);
        setError(null);
      } catch (err) {
        console.error('Error fetching requirements:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequirements();
  }, [userId, role, tier]);

  return { data, isLoading, error };
}