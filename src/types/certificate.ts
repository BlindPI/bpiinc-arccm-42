
export interface FontConfig {
  name: string;
  size: number;
  isBold?: boolean;
}

export const FIELD_CONFIGS: Record<string, FontConfig> = {
  NAME: { name: 'Arial', size: 48 },
  COURSE: { name: 'Arial', size: 28, isBold: true },
  ISSUE: { name: 'Arial', size: 20 },
  EXPIRY: { name: 'Arial', size: 20 }
} as const;

