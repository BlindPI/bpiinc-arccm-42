
export interface FontConfig {
  name: string;
  size: number;
  isBold?: boolean;
}

// Standard fonts that we'll use for certificate fields
export const FIELD_CONFIGS: Record<string, FontConfig> = {
  NAME: { name: 'Tahoma', size: 48, isBold: true },
  COURSE: { name: 'Tahoma', size: 28, isBold: true },
  ISSUE: { name: 'Tahoma', size: 20 },
  EXPIRY: { name: 'Tahoma', size: 20 }
} as const;

// Font files mapping for PDF generation
// These match EXACTLY what's in the Supabase "fonts" bucket
export const FONT_FILES = {
  'Tahoma': 'tahoma.ttf',
  'TahomaBold': 'tahomabd.ttf',
  'SegoeUI': 'Segoe UI.ttf'
};

// Maps the actual bucket ID to the bucket name used in the application
export const STORAGE_BUCKETS = {
  certificates: 'certification-pdfs',
  templates: 'certificate-template',
  fonts: 'fonts'
};
