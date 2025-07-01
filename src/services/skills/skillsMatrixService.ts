
import { supabase } from '@/integrations/supabase/client';

export interface SkillsMatrix {
  teamId: string;
  totalSkills: number;
  averageProficiency: number;
  skillGaps: string[];
}

export class SkillsMatrixService {
  static async getTeamSkillsMatrix(teamId: string): Promise<SkillsMatrix> {
    // Mock implementation
    return {
      teamId,
      totalSkills: 25,
      averageProficiency: 3.2,
      skillGaps: ['Advanced CPR', 'Incident Command']
    };
  }
}
