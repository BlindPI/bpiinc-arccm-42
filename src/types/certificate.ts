export interface FontConfig {
  name: string;
  size: number;
  isBold?: boolean;
}

// Standard fonts that we'll use for certificate fields
export const FIELD_CONFIGS: Record<string, FontConfig> = {
  NAME: { name: 'Arial', size: 48 },
  COURSE: { name: 'Arial', size: 28, isBold: true },
  ISSUE: { name: 'Arial', size: 20 },
  EXPIRY: { name: 'Arial', size: 20 }
} as const;

// Font files mapping for PDF generation - REQUIRED
export const FONT_FILES = {
  'Arial': 'Arial.ttf',
  'ArialBold': 'ArialBold.ttf',
  'Tahoma': 'Tahoma.ttf',
  'TahomaBold': 'TahomaBold.ttf',
  'SegoeUI': 'SegoeUI.ttf'
};

// Maps the actual bucket ID to the bucket name used in the application
export const STORAGE_BUCKETS = {
  certificates: 'certification-pdfs',
  templates: 'certificate-template',
  fonts: 'fonts'
};
