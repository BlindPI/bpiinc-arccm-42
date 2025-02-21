
export interface FontConfig {
  name: string;
  size: number;
  isBold?: boolean;
}

export const FIELD_CONFIGS: Record<string, FontConfig> = {
  NAME: { name: 'Tahoma', size: 48 },
  COURSE: { name: 'Tahoma', size: 28, isBold: true },
  ISSUE: { name: 'Segoe UI', size: 20 },
  EXPIRY: { name: 'Segoe UI', size: 20 }
} as const;
