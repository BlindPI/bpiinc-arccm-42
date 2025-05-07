
export interface CertificationLevel {
  id: string;
  name: string;
  type: 'FIRST_AID' | 'CPR';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CertificationLevelInput = Omit<
  CertificationLevel,
  'id' | 'created_at' | 'updated_at'
>;
