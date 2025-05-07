
export type CourseMatchType = 'exact' | 'partial' | 'fallback' | 'default';

export interface CourseMatch {
  id: string;
  name: string;
  matchType: CourseMatchType;
  length?: number;
  expiration_months: number;
  courseType?: string;
  certifications?: {
    type: string;
    level: string;
  }[];
}
